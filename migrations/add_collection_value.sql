BEGIN;

-- Price imports: one row per handled price file (written by the updater's bulk_update command).
CREATE TABLE mtg_price_import (
  id              BIGSERIAL PRIMARY KEY,
  price_timestamp TIMESTAMPTZ NOT NULL,          -- the moment the prices represent
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at     TIMESTAMPTZ,                   -- NULL = running or crashed; ignored by readers
  source_file     TEXT,
  dollar_per_euro NUMERIC(10, 6),
  cards_updated   INT
);

ALTER TABLE mtg_price ADD COLUMN import_id BIGINT REFERENCES mtg_price_import(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS mtg_price_card_timestamp_idx ON mtg_price (mtg_data_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS mtg_price_import_idx ON mtg_price (import_id);

-- Backfill: group existing price rows into imports. Timestamps less than 5 days apart belong to the same
-- import, mirroring the updater's deduplication window.
CREATE TEMP TABLE price_timestamp_group ON COMMIT DROP AS
WITH timestamps AS (
  SELECT DISTINCT timestamp FROM mtg_price WHERE timestamp IS NOT NULL
),
flagged AS (
  SELECT
    timestamp,
    CASE WHEN timestamp - LAG(timestamp) OVER (ORDER BY timestamp) < INTERVAL '5 days' THEN 0 ELSE 1 END AS is_new_group
  FROM timestamps
)
SELECT timestamp, SUM(is_new_group) OVER (ORDER BY timestamp) AS grp FROM flagged;

INSERT INTO mtg_price_import (price_timestamp, started_at, finished_at)
SELECT MAX(timestamp), now(), now()
FROM price_timestamp_group
GROUP BY grp
ORDER BY grp;

-- Each group's MAX(timestamp) is unique, so it identifies the import
UPDATE mtg_price p
SET import_id = i.id
FROM price_timestamp_group t
JOIN (SELECT grp, MAX(timestamp) AS price_timestamp FROM price_timestamp_group GROUP BY grp) g ON g.grp = t.grp
JOIN mtg_price_import i ON i.price_timestamp = g.price_timestamp
WHERE p.timestamp = t.timestamp;

UPDATE mtg_price_import i
SET cards_updated = (SELECT COUNT(*) FROM mtg_price p WHERE p.import_id = i.id);

-- Collection value per account per import.
--   snapshot: computed right after a recent import, so ownership is what the account held at that moment. Final.
--   backfill: computed later with the ownership of that later moment. An estimate; recomputed when the import changes.
CREATE TABLE mtg_collection_value (
  account       BIGINT NOT NULL REFERENCES mtg_account(id) ON DELETE CASCADE,
  import_id     BIGINT NOT NULL REFERENCES mtg_price_import(id) ON DELETE CASCADE,
  value_cents   BIGINT NOT NULL,
  card_count    INT NOT NULL,                    -- SUM(amount)
  priced_count  INT NOT NULL,                    -- SUM(amount) of cards that had a price at that moment
  source        TEXT NOT NULL CHECK (source IN ('snapshot', 'backfill')),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (account, import_id)
);

-- Value of each account's cards at the moment of an import: per card the latest price at or before the
-- import's price_timestamp (partial imports don't touch every card). Cards without any price count as 0.
-- p_account NULL = all accounts. A backfill never overwrites a snapshot.
CREATE OR REPLACE FUNCTION compute_collection_values(p_import_id BIGINT, p_source TEXT, p_account BIGINT DEFAULT NULL)
RETURNS VOID
LANGUAGE sql
AS $$
  INSERT INTO mtg_collection_value (account, import_id, value_cents, card_count, priced_count, source, calculated_at)
  SELECT
    ac.account,
    i.id,
    COALESCE(SUM(ac.amount::BIGINT * lp.price_cents), 0),
    SUM(ac.amount),
    COALESCE(SUM(ac.amount) FILTER (WHERE lp.price_cents IS NOT NULL), 0),
    p_source,
    now()
  FROM mtg_price_import i
  JOIN mtg_account_card ac ON ac.amount > 0 AND (p_account IS NULL OR ac.account = p_account)
  LEFT JOIN LATERAL (
    SELECT p.price_cents
    FROM mtg_price p
    WHERE p.mtg_data_id = ac.card AND p.timestamp <= i.price_timestamp
    ORDER BY p.timestamp DESC
    LIMIT 1
  ) lp ON TRUE
  WHERE i.id = p_import_id
  GROUP BY ac.account, i.id
  ON CONFLICT (account, import_id) DO UPDATE SET
    value_cents = EXCLUDED.value_cents,
    card_count = EXCLUDED.card_count,
    priced_count = EXCLUDED.priced_count,
    source = EXCLUDED.source,
    calculated_at = EXCLUDED.calculated_at
  WHERE mtg_collection_value.source = 'backfill' OR EXCLUDED.source = 'snapshot';
$$;

COMMIT;
