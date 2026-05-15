"use server";

import MagicCardLike, { fromDbCard } from "@/interfaces/MagicCardLike";
import getAuthenticatedAccountData from "./authenticate";
import { getClient } from "./client";
import { newDbBoundMagicCardLike } from "./types";

export async function authenticate(
  name: string,
  key: string,
): Promise<boolean> {
  // Always wait 1 second
  await new Promise((resolve) => setTimeout(resolve, 1000));
  try {
    const accountData = await getAuthenticatedAccountData(name, key);
    return accountData ? accountData.username === name : false;
  } catch (error) {
    console.error("Authentication error:", error);
    throw error;
  }
}

export async function getPriceHistoryForCard(
  cardId: number,
): Promise<{ timestamp: string; price: number }[]> {
  const sql = getClient();
  if (!sql) return [];

  const rows = await sql`
    SELECT timestamp, price_cents
    FROM mtg_price
    WHERE mtg_data_id = ${cardId}
    ORDER BY timestamp ASC
  `;

  return rows
    .filter((row) => row.timestamp !== null && row.price_cents !== null)
    .map((row) => ({ timestamp: row.timestamp, price: row.price_cents }));
}

export async function getRandomCard(): Promise<MagicCardLike | null> {
  const sql = getClient();
  if (!sql) return null;

  const rows = await sql`
    SELECT
      id, series, cardnumber, card_type, name,
      image_url, is_foil, is_token, release_date,
      price_estimate, colors, rarity, manacost,
      artist, scryfall_id, text
    FROM mtg_data
    ORDER BY RANDOM()
    LIMIT 1
  `;

  if (!rows.length) return null;

  const row = rows[0];
  const bound = {
    ...newDbBoundMagicCardLike(),
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
  };

  return fromDbCard(bound);
}
