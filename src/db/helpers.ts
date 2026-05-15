"use server";

import MagicCardLike, { fromDbCard } from "@/interfaces/MagicCardLike";
import { AccountData } from "@/types/AccountData";
import { AccountSettings } from "@/types/AccountSettings";
import { getClient } from "./client";
import { DbBoundMagicCardLike } from "./types";

export async function getAllCards(accountId: number): Promise<MagicCardLike[]> {
  console.log("getAllCards called for accountId", accountId);

  const sql = getClient();
  if (!sql) return [];

  const [cardRows, priceRows] = await Promise.all([
    sql`
      SELECT
        ac.amount,
        cd.id, cd.series, cd.cardnumber, cd.card_type, cd.name,
        cd.image_url, cd.is_foil, cd.is_token, cd.release_date,
        cd.price_estimate, cd.colors, cd.rarity, cd.manacost,
        cd.artist, cd.scryfall_id, cd.text
      FROM mtg_account_card ac
      JOIN mtg_data cd ON ac.card = cd.id
      WHERE ac.account = ${accountId} AND ac.amount > 0
      LIMIT 10000
    `,
    sql`
      SELECT
        mtg_data_id,
        AVG(price_cents)::float AS avg_price,
        AVG(non_foil_price_cents)::float AS avg_non_foil_price
      FROM mtg_price
      GROUP BY mtg_data_id
    `,
  ]);

  const priceMap = new Map<number, { avg_price: number; avg_non_foil_price: number }>();
  for (const row of priceRows) {
    priceMap.set(Number(row.mtg_data_id), {
      avg_price: row.avg_price ?? 0,
      avg_non_foil_price: row.avg_non_foil_price ?? 0,
    });
  }

  return cardRows.map((row) => {
    const prices = priceMap.get(Number(row.id));
    const bound: DbBoundMagicCardLike = {
      card: {
        id: row.id,
        scryfall_id: row.scryfall_id,
        name: row.name,
        series: row.series,
        colors: row.colors,
        rarity: row.rarity,
        cardnumber: row.cardnumber,
        card_type: row.card_type,
        image_url: row.image_url,
        is_foil: row.is_foil,
        is_token: row.is_token,
        release_date: row.release_date,
        price_estimate: row.price_estimate,
        artist: row.artist,
        text: row.text,
        manacost: row.manacost,
      },
      amount: row.amount,
      avg_price: prices?.avg_price ?? row.price_estimate,
      avg_non_foil_price: prices?.avg_non_foil_price ?? (row.is_foil ? 0 : row.price_estimate),
    };
    return fromDbCard(bound);
  });
}

export async function getAccountByUsername(
  username: string,
): Promise<AccountData | null> {
  "use server";

  const sql = getClient();
  if (!sql) return null;

  const rows = await sql`
    SELECT id, settings
    FROM mtg_account
    WHERE username = ${username}
    LIMIT 1
  `;

  if (!rows.length) return null;

  return {
    id: rows[0].id,
    username,
    settings: rows[0].settings as AccountSettings,
  };
}
