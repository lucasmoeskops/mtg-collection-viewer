// Not a "use server" module on purpose: every export of one becomes a client-callable action. This is shared by the
// graph's server action (collection-value.ts) and the API route.
import { getClient } from "./client";

export type CollectionValueEntry = {
  timestamp: string;
  valueCents: number;
  cardCount: number;
  pricedCount: number;
  /** Computed after the fact with the collection of that later moment */
  estimated: boolean;
};

/**
 * Collection value of an account at every finished price import, optionally limited to imports whose price timestamp
 * lies within [from, to]. Values are cached in `mtg_collection_value`; missing or outdated ones are computed here first.
 * Values computed after the fact use the current collection, so they are marked as estimated (only the updater can
 * record a value at the moment of an import).
 */
export async function loadCollectionValueHistory(
  accountId: number,
  { from, to }: { from?: Date; to?: Date } = {},
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

  const rows = await sql`
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
