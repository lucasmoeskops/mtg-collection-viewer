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
- `src/procedures/` — Card filtering and selection logic
- `src/scryfall/` — Scryfall API integration for importing card data

### Authentication

Custom username + API key auth (not OAuth). `getAuthenticatedAccountData(username, key)` in `src/db/authenticate.ts` checks the `mtg_account` table. Credentials are stored in a `dbkey` column with a 1-second artificial delay to limit brute-force attempts. There is no session token — the key is held in the `AccountContextProvider`.

`authenticate()` sets both `isAuthenticated` and `accountId` on success. This is load-bearing: `setAccountIdByUsername` has an early-return guard (`username === accountName && accountId !== -1`) that preserves auth state after a login redirect. If `accountId` were not set by `authenticate()`, the guard would not fire and `isAuthenticated` would be silently reset to `false` by the viewer load path.

### State management

All global state lives in React Contexts in `src/context/`. Key ones:

- **AccountContextProvider** — auth state, account data, owned cards, account settings
- **CardContextProvider** — active card filters/sorting, synced to URL query params
- **CardEditorContextProvider** — deck and card editing state
- **ViewModeContextProvider** — display mode preferences

Card filter state (`CardSelectionContext`) is persisted in URL query parameters so filters survive navigation.

### Data model

| Table                   | Purpose                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| `mtg_account`           | Users (id, username, dbkey, settings JSON)                                                    |
| `mtg_data`              | Card catalogue (name, series, cardnumber, colors, rarity, prices…)                            |
| `mtg_account_card`      | Card ownership (account_id, card_id, amount, foil variants)                                   |
| `mtg_deck`              | Decks (id, account_id, name, description)                                                     |
| `mtg_deck_card`         | Deck contents (deck_id, card_id, role) where role is `commander`, `mainboard`, or `sideboard` |
| `mtg_deck_basic_land`   | Basic land quantities per deck (deck, land_type, quantity) — PRIMARY KEY (deck, land_type)    |
| `mtg_deck_package`      | Named strategy packages per deck (id, deck, name, description, target)                        |
| `mtg_deck_package_card` | Cards assigned to packages (package, card) — PRIMARY KEY (package, card)                      |
| `mtg_price`             | Price history (card_id, timestamp, price_cents)                                               |

### Commander deck management

URL structure: `/[username]/decks` (list) and `/[username]/decks/[deckId]` (editor). The Decks tab only appears when authenticated.

Server actions live in `src/db/decks.ts`: `getDeckList`, `getDeck`, `createDeck`, `deleteDeck`, `updateDeck`, `addCardToDeck`, `removeCardFromDeck`, `setBasicLandCount`. Package actions live in `src/db/packages.ts`: `createPackage`, `updatePackage`, `deletePackage`, `addCardToPackage`, `removeCardFromPackage`.

Key design decisions in `DeckDetail`:

- Basic lands are managed separately via `mtg_deck_basic_land` (not as card rows) because they need quantity tracking and aren't singleton. Only land types within the commander's color identity count toward the 100-card total and appear in the UI — stored counts for other types are preserved but ignored.
- Cards are validated client-side: color identity violations (mainboard cards with colors outside the commander's identity) and tokens are flagged with a red row tint and warning icon.
- Valid commanders must be Legendary and either a Creature, Spacecraft, or Vehicle (checked via `card_type` string).
- Statistics (type distribution, mana curve, mana symbol counts) and sideboard are computed entirely client-side from the loaded deck.
- Packages are named strategy containers (e.g. "Sacrifice Package") that cross-reference mainboard cards. A package has an optional target count; the UI shows current vs. target with a colored badge. Each deck card row shows small colored avatar chips for its packages. Package color and initials are derived from the package id via `src/components/Decks/packageColors.ts`.

### Card save logic

`saveCardChanges()` in `src/db/editor.ts` implements three cases:

1. No existing row + amount > 0 → INSERT
2. Existing row + amount = 0 → DELETE
3. Existing row + amount > 0 → UPDATE

### Scryfall image proxying

`next.config.ts` proxies images from `cards.scryfall.io`. Card metadata is imported via `src/scryfall/` utilities and stored locally in the database.

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
