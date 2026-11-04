BEGIN;

-- Collection value per account per import, broken down per set (mtg_data.series = Scryfall set code).
-- Written together with mtg_collection_value by compute_collection_values: whenever a total exists, its breakdown does
-- too. A set the account didn't own at that import has no row (= 0). source/calculated_at mean the same as there.
CREATE TABLE mtg_collection_set_value (
  account       BIGINT NOT NULL REFERENCES mtg_account(id) ON DELETE CASCADE,
  import_id     BIGINT NOT NULL REFERENCES mtg_price_import(id) ON DELETE CASCADE,
  series        TEXT NOT NULL,
  value_cents   BIGINT NOT NULL,
  card_count    INT NOT NULL,
  priced_count  INT NOT NULL,
  source        TEXT NOT NULL CHECK (source IN ('snapshot', 'backfill')),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (account, series, import_id)
);

CREATE INDEX mtg_collection_set_value_import_idx ON mtg_collection_set_value (import_id);

-- Value of each account's cards at the moment of an import: per card the latest price at or before the
-- import's price_timestamp (partial imports don't touch every card). Cards without any price count as 0.
-- p_account NULL = all accounts. A backfill never overwrites a snapshot.
-- The per-set breakdown is computed first and replaced as a whole; the total is its sum, so prices are looked up once.
CREATE OR REPLACE FUNCTION compute_collection_values(p_import_id BIGINT, p_source TEXT, p_account BIGINT DEFAULT NULL)
RETURNS VOID
LANGUAGE sql
AS $$
  -- A breakdown is all snapshot or all backfill, so this row-level rule replaces breakdowns as a whole
  DELETE FROM mtg_collection_set_value s
  WHERE s.import_id = p_import_id
    AND (p_account IS NULL OR s.account = p_account)
    AND NOT (p_source = 'backfill' AND s.source = 'snapshot');

  INSERT INTO mtg_collection_set_value (account, import_id, series, value_cents, card_count, priced_count, source, calculated_at)
  SELECT
    ac.account,
    p_import_id,
    COALESCE(d.series, ''),
    COALESCE(SUM(ac.amount::BIGINT * lp.price_cents), 0),
    SUM(ac.amount),
    COALESCE(SUM(ac.amount) FILTER (WHERE lp.price_cents IS NOT NULL), 0),
    p_source,
    now()
  FROM mtg_price_import i
  JOIN mtg_account_card ac ON ac.amount > 0 AND (p_account IS NULL OR ac.account = p_account)
  LEFT JOIN mtg_data d ON d.id = ac.card
  LEFT JOIN LATERAL (
    SELECT p.price_cents
    FROM mtg_price p
    WHERE p.mtg_data_id = ac.card AND p.timestamp <= i.price_timestamp
    ORDER BY p.timestamp DESC
    LIMIT 1
  ) lp ON TRUE
  WHERE i.id = p_import_id
    -- Snapshot breakdowns that survived the delete are kept as they are
    AND NOT EXISTS (
      SELECT 1 FROM mtg_collection_set_value k
      WHERE k.account = ac.account AND k.import_id = p_import_id AND k.source = 'snapshot'
    )
  GROUP BY ac.account, COALESCE(d.series, '');

  -- now() is the transaction start, so this selects exactly the breakdowns written above
  INSERT INTO mtg_collection_value (account, import_id, value_cents, card_count, priced_count, source, calculated_at)
  SELECT s.account, s.import_id, SUM(s.value_cents), SUM(s.card_count), SUM(s.priced_count), p_source, now()
  FROM mtg_collection_set_value s
  WHERE s.import_id = p_import_id
    AND s.source = p_source
    AND s.calculated_at = now()
    AND (p_account IS NULL OR s.account = p_account)
  GROUP BY s.account, s.import_id
  ON CONFLICT (account, import_id) DO UPDATE SET
    value_cents = EXCLUDED.value_cents,
    card_count = EXCLUDED.card_count,
    priced_count = EXCLUDED.priced_count,
    source = EXCLUDED.source,
    calculated_at = EXCLUDED.calculated_at
  WHERE mtg_collection_value.source = 'backfill' OR EXCLUDED.source = 'snapshot';
$$;

-- Give every existing total a breakdown. Existing snapshot totals stay as they are; their breakdown can only be an
-- estimate with today's collection. Existing backfill totals are re-estimated along the way.
SELECT compute_collection_values(id, 'backfill') FROM mtg_price_import WHERE finished_at IS NOT NULL ORDER BY id;

COMMIT;
