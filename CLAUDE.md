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

**Next.js 16 App Router** application for managing a personal Magic: The Gathering card collection, backed by Supabase.

### Layer separation

- `src/db/` — Server actions (`"use server"`) for all database operations
- `src/context/` — Client-side React Context providers for global UI state
- `src/components/` — React components; most are `"use client"`
- `src/types/`, `src/interfaces/`, `src/enums/` — Shared TypeScript definitions
- `src/procedures/` — Card filtering and selection logic
- `src/scryfall/` — Scryfall API integration for importing card data

### Authentication

Custom username + API key auth (not OAuth). `getAuthenticatedAccountData(username, key)` in `src/supabase/authenticate.ts` checks the `mtg_account` table. Credentials are stored in a `dbkey` column with a 1-second artificial delay to limit brute-force attempts. There is no session token — the key is held in the `AccountContextProvider`.

### State management

All global state lives in React Contexts in `src/context/`. Key ones:

- **AccountContextProvider** — auth state, account data, owned cards, account settings
- **CardContextProvider** — active card filters/sorting, synced to URL query params
- **CardEditorContextProvider** — deck and card editing state
- **ViewModeContextProvider** — display mode preferences

Card filter state (`CardSelectionContext`) is persisted in URL query parameters so filters survive navigation.

### Data model (Supabase tables)

| Table | Purpose |
|---|---|
| `mtg_account` | Users (id, username, dbkey, settings JSON) |
| `mtg_data` | Card catalogue (name, series, cardnumber, colors, rarity, prices…) |
| `mtg_account_card` | Card ownership (account_id, card_id, amount, foil variants) |
| `mtg_deck` | Decks (id, account_id, name, description) |
| `mtg_deck_card` | Deck contents (deck_id, card_id, role) |
| `mtg_price` | Price history (card_id, timestamp, price_cents) |

### Card save logic

`saveCardChanges()` in `src/supabase/editor.ts` implements three cases:
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
