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
