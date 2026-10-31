"use server";

import { PricePoint } from "@/types/PricePoint";
import { getClient } from "./client";

/**
 * Collection value of an account at every finished price import. Values are cached in `mtg_collection_value`;
 * missing or outdated ones are computed here first. Values computed after the fact use the current collection,
 * so they are marked as estimated (only the updater can record a value at the moment of an import).
 */
export async function getCollectionValueHistory(
  accountId: number,
): Promise<PricePoint[]> {
  const sql = getClient();
  if (!sql) return [];

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
  `;

  const rows = await sql`
    SELECT i.price_timestamp, v.value_cents, v.source
    FROM mtg_collection_value v
    JOIN mtg_price_import i ON i.id = v.import_id
    WHERE v.account = ${accountId} AND i.finished_at IS NOT NULL
    ORDER BY i.price_timestamp ASC
  `;

  return rows.map((row) => ({
    timestamp: (row.price_timestamp as Date).toISOString(),
    price: Number(row.value_cents),
    estimated: row.source === "backfill",
  }));
}
