# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server with Turbopack
npm run build      # Production build
npm run lint       # ESLint checks
npm run fix        # Prettier format + ESLint auto-fix
```

## Architecture

**Next.js 16 App Router** application for managing a personal Magic: The Gathering card collection, backed by PostgreSQL.

### Layer separation

- `src/db/` — Server actions (`"use server"`) for all database operations
- `src/context/` — Client-side React Context providers for global UI state
- `src/components/` — React components; most are `"use client"`
- `src/types/`, `src/interfaces/`, `src/enums/` — Shared TypeScript definitions
- `src/procedures/` — Shared pure logic (card filtering, deck card count)
- `src/scryfall/` — Scryfall API integration for importing card data

### Authentication

Custom username + API key auth (not OAuth). `getAuthenticatedAccountData(username, key)` in `src/db/authenticate.ts` checks the `mtg_account` table. Credentials are stored in a `dbkey` column with a 1-second artificial delay to limit brute-force attempts. There is no session token — the key is held in the `AccountContextProvider`.

`authenticate()` sets both `isAuthenticated` and `accountId` on success. This is load-bearing: `setAccountIdByUsername` has an early-return guard (`username === accountName && accountId !== -1`) that preserves auth state after a login redirect. If `accountId` were not set by `authenticate()`, the guard would not fire and `isAuthenticated` would be silently reset to `false` by the viewer load path.

### HTTP API

Route handlers live under `src/app/api/` (the static `api` segment wins over `[username]`, so no account can be named `api` usefully). Auth is a per-account `mtg_account.api_key` (nullable = no API access, separate from `dbkey`), sent as `Authorization: Bearer <key>` and checked together with the username in the URL; any failure returns the same 401. Keys are handed out by hand: `UPDATE mtg_account SET api_key = gen_random_uuid()::TEXT WHERE username = '…' RETURNING api_key;`.

- `GET /api/[username]/collection-value?from=YYYY-MM-DD&to=YYYY-MM-DD` — collection value per finished price import (`timestamp`, `valueCents`, `cardCount`, `pricedCount`, `estimated`), in EUR. Bounds are optional, inclusive, ISO dates or timestamps; a date-only `to` covers the whole day (UTC).
- `GET /api/[username]/collection-value/[set]?from=…&to=…` — the same, for the account's cards of one set (Scryfall set code, case-insensitive; 400 if malformed, 404 if not in `mtg_data`). Imports where the set wasn't owned give 0.

Both routes go through `src/app/api/collection-value-response.ts` (auth, parameter parsing, errors).

### State management

All global state lives in React Contexts in `src/context/`. Key ones:

- **AccountContextProvider** — auth state, account data, owned cards, account settings
- **CardContextProvider** — active card filters/sorting, synced to URL query params
- **CardEditorContextProvider** — deck and card editing state
- **ViewModeContextProvider** — display mode preferences

Card filter state (`CardSelectionContext`) is persisted in URL query parameters so filters survive navigation.

### Data model

| Table                   | Purpose                                                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `mtg_account`           | Users (id, username, dbkey, settings JSON, api_key)                                                                    |
| `mtg_data`              | Card catalogue (name, series, cardnumber, colors, rarity, prices…)                                                     |
| `mtg_account_card`      | Card ownership (account_id, card_id, amount, foil variants)                                                            |
| `mtg_deck`              | Decks (id, account_id, name, description)                                                                              |
| `mtg_deck_card`         | Deck contents (deck_id, card_id, role) where role is `commander`, `mainboard`, `sideboard`, or `garbage_bin`           |
| `mtg_deck_basic_land`   | Basic land quantities per deck (deck, land_type, quantity) — PRIMARY KEY (deck, land_type)                             |
| `mtg_deck_package`      | Named strategy packages per deck (id, deck, name, description, target)                                                 |
| `mtg_deck_package_card` | Cards assigned to packages (package, card) — PRIMARY KEY (package, card)                                               |
| `mtg_deck_history`      | Deck action log (deck_id, card_id, card_name, from_role, to_role, action_type, from_quantity, to_quantity, created_at) |
| `mtg_price`             | Price history (mtg_data_id, timestamp, price_cents, non_foil_price_cents, import_id)                                   |
| `mtg_price_import`      | One row per handled price file (price_timestamp, started_at, finished_at, source_file, dollar_per_euro, cards_updated) |
| `mtg_collection_value`  | Cached collection value per account per import (value_cents, card_count, priced_count, source, calculated_at)          |
| `mtg_collection_set_value` | Per-set breakdown of `mtg_collection_value` (account, import_id, series, same value columns) — written together     |

### Price updater and collection value

`updater/` is a small Python Django project (its own `requirements.txt`) that imports weekly price files: `python manage.py bulk_update <file> <dollar_per_euro> <timestamp>`. A daily cron creates a new price file once the previous one is 7 days old. The updater uses the same `DATABASE_URL` (falling back to the `mtg` pg service). Its models are `managed = False`: schema changes live only in `migrations/`. It only handles prices; card metadata is maintained by the Next.js app (`src/scryfall/`). Replaying old price files adds history for newly added cards; it does not overwrite the current `price_estimate`.

Each run creates or reuses (±5 days, mirroring the price row deduplication) an `mtg_price_import` row and tags its price rows with it. When it finishes it calls the SQL function `compute_collection_values(import_id, source, account?)`: per owned card, the latest price at or before the import's `price_timestamp`, times the amount.

- `snapshot` values are computed by the updater right after a recent import, so they reflect what the account owned at that moment. They are final: a `backfill` never overwrites one.
- `backfill` values are computed after the fact with the then-current collection (estimates). `getCollectionValueHistory` in `src/db/collection-value.ts` lazily computes missing ones, and recomputes backfills whose `calculated_at < finished_at` (the import was re-run). `finished_at` and `calculated_at` are both set on the database clock in one transaction to keep that comparison meaningful.

The function first replaces the per-set breakdown in `mtg_collection_set_value` as a whole (one price lookup per card) and then upserts the total as its sum. Invariant: every total has a breakdown, so the lazy check only looks at totals. The snapshot rule holds per (account, import) breakdown; breakdowns of snapshots taken before the table existed (migration `add_collection_set_value.sql`) are backfill estimates under a snapshot total.

The query itself lives in `src/db/collection-value-history.ts`, deliberately **not** a `"use server"` module (every export of one becomes a client-callable action); `getCollectionValueHistory` (which takes a username, not an id) and the API routes all use it.

Merchant mode shows the graph next to "Total card value" via `CollectionValueHistory` (whole collection, not the filtered selection; estimated segments are dashed). `PriceGraph` takes a `load` function, so card price history and collection value share it.

### Commander deck management

URL structure: `/[username]/decks` (list) and `/[username]/decks/[deckId]` (editor). The Decks tab only appears when authenticated.

Server actions live in `src/db/decks.ts`: `getDeckList`, `getDeck`, `createDeck`, `deleteDeck`, `updateDeck`, `addCardToDeck`, `removeCardFromDeck`, `emptyGarbageBin`, `setBasicLandCount`, `getDeckHistory`, `copyDeck`. Package actions live in `src/db/packages.ts`: `createPackage`, `updatePackage`, `deletePackage`, `addCardToPackage`, `removeCardFromPackage`.

Key design decisions in `DeckDetail`:

- Basic lands are managed separately via `mtg_deck_basic_land` (not as card rows) because they need quantity tracking and aren't singleton. Only land types within the commander's color identity count toward the 100-card total and appear in the UI — stored counts for other types are preserved but ignored.
- The 100-card count is computed by `computeDeckCardCount` in `src/procedures/deck-card-count.ts`, shared between the deck list (server-side, in `getDeckList`) and the detail view (client-side). Only `commander` and `mainboard` roles count — this is an explicit allowlist so future roles (e.g. a "garbage bin" panel) don't accidentally contribute to the total.
- Cards are validated client-side: color identity violations (mainboard cards with colors outside the commander's identity) and tokens are flagged with a red row tint and warning icon.
- Valid commanders must be Legendary and either a Creature, Spacecraft, or Vehicle (checked via `card_type` string).
- Statistics (type distribution, mana curve, mana symbol counts) and sideboard are computed entirely client-side from the loaded deck.
- Packages are named strategy containers (e.g. "Sacrifice Package") that cross-reference mainboard cards. A package has an optional target count; the UI shows current vs. target with a colored badge. Each deck card row shows small colored avatar chips for its packages. Package color and initials are derived from the package id via `src/components/Decks/packageColors.ts`.
- Every mutating deck action is logged to `mtg_deck_history` via the unexported `logDeckAction` helper in `decks.ts`. Entries have an `action_type`: `card_role` (card moved between roles) or `basic_land` (land count changed; land type in `card_name`, counts in `from_quantity`/`to_quantity`). Schema changes live as SQL files in `migrations/`, applied by hand.
- `copyDeck` duplicates a deck in a single transaction. It contains an explicit checklist comment of every table it copies — **if you add a new deck-related table, update `copyDeck` and its checklist**. Each entry stores `from_role` and `to_role` (`null` = not in deck), which models all transitions uniformly and makes future undo/redo straightforward — the inverse of any entry is just swapping the two fields. The history panel is `src/components/Decks/DeckHistory.tsx`; it receives a `refreshKey` prop and resets to page 0 after each mutation.

### Add to deck button

`src/components/Decks/AddToDeckButton.tsx` has a module-level `lastUsedDeckId` variable that pre-selects the most recently picked deck when the popover opens. It is intentionally module-level (shared across all button instances on the page, reset on full navigation) rather than stored in state or `sessionStorage`.

### Card save logic

`saveCardChanges()` in `src/db/editor.ts` implements three cases:

1. No existing row + amount > 0 → INSERT
2. Existing row + amount = 0 → DELETE
3. Existing row + amount > 0 → UPDATE

### Scryfall image proxying

`next.config.ts` proxies images from `cards.scryfall.io`. Card metadata is imported via `src/scryfall/` utilities and stored locally in the database.

## Change log for users

Whenever something is added or changed that an app user might be interested in (features, visible fixes), add an entry to the change log in `src/app/[username]/colofon/page.tsx`. Entries are grouped per version, newest first, as `Version YYYY.M.D` with a `<List>` of `<ListItem>`s written for users, not developers. When starting a new version, bump `version` in `package.json` to match (format `YY.M.D`, e.g. `26.6.23`); the colofon displays it. Internal changes (refactors, tooling, the updater itself) don't need an entry.

## Code style

- ESLint max line length: 140 characters
- Indent: 2 spaces
- Import order is enforced (warnings for unsorted imports)
- Run `npm run fix` to auto-format before committing

## Environment variables

Required in `.env`:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

The database client (`src/db/client.ts`) uses [`postgres`](https://github.com/porsager/postgres) (postgres.js) with a connection pool of 10. All queries use tagged template literals — no query building is done by string concatenation.

**Type coercion gotcha**: postgres.js returns `bigint`/`bigserial` columns as strings at runtime regardless of TypeScript types. Always wrap with `Number()` when the declared type is `number` (e.g. `id: Number(row.id)`).
