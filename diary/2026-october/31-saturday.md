# Saturday, october 31st 2026

## Collection value over time

The wish was simple: see how the value of a collection develops, week by week. The first sketch kept a weekly lookup table, but it hit a wall. `mtg_account_card` only knows what someone owns *now*, so the value of a past week can only be guessed. The prices themselves are written by a small Python Django updater that until today lived outside this repository. It now lives in `updater/`, and it became the key to the solution. Every handled price file now records an `mtg_price_import` row and tags its price rows with it. When the import finishes, the SQL function `compute_collection_values` stores the value of every account in `mtg_collection_value`. Because that happens right after a recent import, the value reflects what the account owned at that moment: a true *snapshot*. Past imports can only be *backfilled* with today's collection. They are marked as estimates and drawn dashed in the new graph next to "Total card value" in merchant mode.

Reading the updater with fresh eyes turned up more than expected. The full-dump path passed a whole card object where a price dictionary was expected. The web form called a helper with a parameter that doesn't exist. Re-running a price file crashed on `make_aware` of an already aware timestamp. The least visible of all: replaying old price files to add history for new cards quietly set each card's current price back to the old one. All four are fixed. A throwaway Postgres container confirmed the migration, the arithmetic and the updater end to end. That test also exposed one subtle trap: the updater's clock and the database clock disagreed. That made fresh values look outdated, so `finished_at` and `calculated_at` are now both written by the database in one transaction.

### Decision: weeks or imports

- **Weekly buckets**: easy to reason about, but they guess at what an import *is*, and a sync can straddle a weekend.
- **Import events** (chosen): the updater knows exactly when prices were handled, and the ±5 day window already used to deduplicate price rows carries over naturally.

### Decision: what a past value means

- **Current collection at historical prices**: available immediately, but it shifts every time the collection changes.
- **Snapshot at import time**: honest, but it only exists from today onward.
- **Both** (chosen): backfill the past as an estimate and record snapshots from now on. A backfill never overwrites a snapshot.

### Decision: where the calculation lives

- **Separate queries in Python and TypeScript**: two places to keep in sync.
- **One SQL function** (chosen): the updater and the app's lazy fallback call the same `compute_collection_values`.

Still to do: apply the migration, point the cron at `updater/`, and, as a second phase, a small API endpoint. From today on, every week leaves a footprint of its own.

---

Author: Lucas Moeskops <lucasmoeskops@gmail.com>
Co-author: Claude Opus 5.5 <noreply@anthropic.com>
