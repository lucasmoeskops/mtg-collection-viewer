// Not a "use server" module on purpose: every export of one becomes a client-callable action. This is shared by the
// graph's server action (collection-value.ts) and the API routes.
import { getClient } from "./client";

export type CollectionValueEntry = {
  timestamp: string;
  valueCents: number;
  cardCount: number;
  pricedCount: number;
  /** Computed after the fact with the collection of that later moment */
  estimated: boolean;
};

type HistoryOptions = {
  from?: Date;
  to?: Date;
  /** Scryfall set code (lowercase); omit for the whole collection */
  set?: string;
};

/**
 * Collection value of an account at every finished price import, optionally limited to imports whose price timestamp
 * lies within [from, to] and to the cards of one set. Values are cached in `mtg_collection_value` (totals) and
 * `mtg_collection_set_value` (per set, written together); missing or outdated ones are computed here first. Values
 * computed after the fact use the current collection, so they are marked as estimated (only the updater can record a
 * value at the moment of an import).
 */
export async function loadCollectionValueHistory(
  accountId: number,
  { from, to, set }: HistoryOptions = {},
): Promise<CollectionValueEntry[]> {
  const sql = getClient();
  if (!sql) return [];

  const period = sql`
    ${from ? sql`AND i.price_timestamp >= ${from}` : sql``}
    ${to ? sql`AND i.price_timestamp <= ${to}` : sql``}
  `;

  await sql`
    SELECT compute_collection_values(i.id, 'backfill', ${accountId})
    FROM mtg_price_import i
    LEFT JOIN mtg_collection_value v
      ON v.import_id = i.id AND v.account = ${accountId}
    WHERE i.finished_at IS NOT NULL
      AND (
        v.import_id IS NULL
        OR (v.source = 'backfill' AND v.calculated_at < i.finished_at)
      )
      ${period}
  `;

  // A set not owned at an import has no breakdown row: its value was 0
  const rows = set
    ? await sql`
        SELECT
          i.price_timestamp,
          COALESCE(s.value_cents, 0) AS value_cents,
          COALESCE(s.card_count, 0) AS card_count,
          COALESCE(s.priced_count, 0) AS priced_count,
          COALESCE(s.source, v.source) AS source
        FROM mtg_collection_value v
        JOIN mtg_price_import i ON i.id = v.import_id
        LEFT JOIN mtg_collection_set_value s
          ON s.account = v.account AND s.import_id = v.import_id AND s.series = ${set}
        WHERE v.account = ${accountId} AND i.finished_at IS NOT NULL
          ${period}
        ORDER BY i.price_timestamp ASC
      `
    : await sql`
        SELECT i.price_timestamp, v.value_cents, v.card_count, v.priced_count, v.source
        FROM mtg_collection_value v
        JOIN mtg_price_import i ON i.id = v.import_id
        WHERE v.account = ${accountId} AND i.finished_at IS NOT NULL
          ${period}
        ORDER BY i.price_timestamp ASC
      `;

  return rows.map((row) => ({
    timestamp: (row.price_timestamp as Date).toISOString(),
    valueCents: Number(row.value_cents),
    cardCount: Number(row.card_count),
    pricedCount: Number(row.priced_count),
    estimated: row.source === "backfill",
  }));
}

/** Account id belonging to this username + API key, or null. */
export async function getAccountIdByApiKey(username: string, apiKey: string): Promise<number | null> {
  const sql = getClient();
  if (!sql || !apiKey) return null;

  const rows = await sql`
    SELECT id FROM mtg_account
    WHERE username = ${username} AND api_key = ${apiKey}
    LIMIT 1
  `;

  return rows.length ? Number(rows[0].id) : null;
}

/** Account id belonging to this username, or null. */
export async function getAccountIdByUsername(username: string): Promise<number | null> {
  const sql = getClient();
  if (!sql) return null;

  const rows = await sql`SELECT id FROM mtg_account WHERE username = ${username} LIMIT 1`;
  return rows.length ? Number(rows[0].id) : null;
}

/** Whether any card of this set is in the catalogue. */
export async function setExists(set: string): Promise<boolean> {
  const sql = getClient();
  if (!sql) return false;

  const rows = await sql`SELECT 1 FROM mtg_data WHERE series = ${set} LIMIT 1`;
  return rows.length > 0;
}
