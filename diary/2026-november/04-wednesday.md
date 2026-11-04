# Wednesday, november 4th 2026

## A door for the collection value

The day began with a question rather than a feature. To "invalidate" the cache, an account's rows had been deleted from `mtg_collection_value` by hand, and they seemed not to return. The answer, written down here so it isn't lost: the cache fills in two places. The updater recomputes every account right after each import. The app lazily fills anything missing or outdated each time the graph opens. A replayed historical price file recomputes its own import, so nothing has to be done by hand. Snapshots are never overwritten, and that is exactly why rows should not be deleted: a removed snapshot comes back as a dashed estimate, and the moment it captured is gone for good. Rows that seem not to return are more likely the work of an uncommitted transaction in a SQL client than of the code. The cost also stays small as the years pass: one row per weekly import, read by primary key.

Then the promised second phase: `GET /api/<username>/collection-value?from=…&to=…`. It returns the value in euro cents per import, with `cardCount`, `pricedCount` and the `estimated` flag. Both bounds are optional and inclusive, and a date-only `to` covers that whole day. Building it exposed a small trap. The query lived in a `"use server"` module, where every export becomes an action any browser can call, so a more detailed variant had no business there. It moved to `src/db/collection-value-history.ts`, a plain server module, and the graph's action is now a thin wrapper around it. A throwaway Postgres and a dev server confirmed the arithmetic, the date filter and every way of being refused.

### Decision: how API clients authenticate

- **Reuse `dbkey`**: no schema change, but it hands the account's full key to a script, and the login's one-second delay would slow every request.
- **Sessions or OAuth**: far more than a personal app needs today.
- **A separate `api_key` column** (chosen): nullable, so API access is opt-in per account. It is sent as `Authorization: Bearer <key>` and checked together with the username, and every failure gives the same 401. Keys are handed out by hand with `gen_random_uuid()`. They are stored in plain text like `dbkey`; hashing them is an easy step later.

The migration `migrations/add_api_key.sql` still waits to be applied in production. The collection now has a door to the outside world, small, and locked by default.

---

Author: Lucas Moeskops <lucasmoeskops@gmail.com>
Co-author: Claude Opus 5.5 <noreply@anthropic.com>

## One set at a time

The door got a second room: `GET /api/<username>/collection-value/<set>`, the value of the cards from one set over time. The tempting shortcut was to compute it on demand. One set is a small slice of a collection, so it would have been fast enough. But it would only ever know today's collection, and every value would be an estimate. So `compute_collection_values` now writes a per-set breakdown into `mtg_collection_set_value` first and stores the total as its sum. Every weekly import thereby records honest per-set snapshots as well, without a single change to the Python updater. Each card's price is still looked up only once.

The snapshot rule needed care. A backfill must not touch a snapshot breakdown, nor sneak a newly bought set into it. So breakdowns are replaced as a whole or not at all. The few snapshots taken before today get an estimated breakdown under their honest total, and the migration says so in its comments. A throwaway database, set up in the state production is in now, confirmed every case.

One thing went worse than expected: a dev server from the earlier test had quietly stayed alive, and it served a stale compile error that cost a detour. While at it, the graph's server action now takes a username instead of a guessable account number.

### Decision: compute per set on demand, or cache it

- **On demand**: no schema change, but every value would be an estimate based on today's collection.
- **Cached breakdown, written with the total** (chosen): real snapshots per set from now on, at the cost of one table and a slightly longer SQL function.

`migrations/add_collection_set_value.sql` joins the queue for production.

---

Author: Lucas Moeskops <lucasmoeskops@gmail.com>
Co-author: Claude Opus 5.5 <noreply@anthropic.com>
