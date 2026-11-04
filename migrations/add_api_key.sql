-- Per-account key for the HTTP API (sent as `Authorization: Bearer <key>`). NULL = no API access.
-- Hand out a key with:
--   UPDATE mtg_account SET api_key = gen_random_uuid()::TEXT WHERE username = '<name>' RETURNING api_key;
ALTER TABLE mtg_account ADD COLUMN api_key TEXT UNIQUE;
