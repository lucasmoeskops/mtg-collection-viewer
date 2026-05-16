import { getClient } from "./client";
import insertNewMtgCard from "./insert-new-mtg-card";

export default async function getMTGCardId(
  setId: string,
  collectorNumber: string,
  isFoil: boolean,
): Promise<number> {
  const sql = getClient();

  if (!sql) {
    console.error("Database client not initialized");
    throw new Error("Database client not initialized");
  }

  const rows = await sql`
    SELECT id
    FROM mtg_data
    WHERE series = ${setId} AND cardnumber = ${collectorNumber} AND is_foil = ${isFoil}
    LIMIT 1
  `;

  if (!rows.length || !rows[0].id) {
    return insertNewMtgCard(setId, collectorNumber, isFoil);
  }

  return rows[0].id;
}
