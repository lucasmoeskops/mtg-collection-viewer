"use server";

import { fromDbCard } from "@/interfaces/MagicCardLike";
import { CardDeck } from "@/types/CardDeckData";
import { CardDeckPreview } from "@/types/CardDeckPreview";
import { getClient } from "./client";
import { DbMagicCardLike } from "./types";

export async function getDeckList(account_id: number): Promise<CardDeckPreview[]> {
  const sql = getClient();
  if (!sql) return [];

  const rows = await sql`
    SELECT id, name, description
    FROM mtg_deck
    WHERE account = ${account_id}
  `;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
  }));
}

export async function getDeck(account_id: number, deck_id: number): Promise<CardDeck | null> {
  const sql = getClient();
  if (!sql) return null;

  const deckRows = await sql`
    SELECT id, name, description
    FROM mtg_deck
    WHERE account = ${account_id} AND id = ${deck_id}
    LIMIT 1
  `;

  if (!deckRows.length) return null;

  const deck = deckRows[0];

  const cardRows = await sql`
    SELECT
      dc.role,
      cd.id, cd.series, cd.cardnumber, cd.card_type, cd.name,
      cd.image_url, cd.is_foil, cd.is_token, cd.release_date,
      cd.price_estimate, cd.colors, cd.rarity, cd.manacost,
      cd.artist, cd.scryfall_id, cd.text
    FROM mtg_deck_card dc
    JOIN mtg_data cd ON dc.card = cd.id
    WHERE dc.deck = ${deck_id}
  `;

  const cards = cardRows.map((row) => ({
    card: fromDbCard({
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
      } as DbMagicCardLike,
      amount: 1,
    }),
    role: row.role || "unknown",
  }));

  return {
    id: deck.id,
    name: deck.name,
    description: deck.description,
    cards,
  } as CardDeck;
}

