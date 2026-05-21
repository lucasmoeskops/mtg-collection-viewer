"use server";

import { fromDbCard } from "@/interfaces/MagicCardLike";
import { CardDeck } from "@/types/CardDeckData";
import { CardDeckPreview } from "@/types/CardDeckPreview";
import getAuthenticatedAccountData from "./authenticate";
import { getClient } from "./client";
import getMTGCardId from "./get-mtg-card-id";
import { DbMagicCardLike } from "./types";

export async function getDeckList(account_id: number): Promise<CardDeckPreview[]> {
  const sql = getClient();
  if (!sql) return [];

  const rows = await sql`
    SELECT DISTINCT ON (d.id)
      d.id, d.name, d.description,
      c.name AS commander_name,
      c.image_url AS commander_image_url
    FROM mtg_deck d
    LEFT JOIN mtg_deck_card dc ON d.id = dc.deck AND dc.role = 'commander'
    LEFT JOIN mtg_data c ON dc.card = c.id
    WHERE d.account = ${account_id}
    ORDER BY d.id
  `;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    commander_name: row.commander_name ?? undefined,
    commander_image_url: row.commander_image_url ?? undefined,
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
    ORDER BY dc.role DESC, cd.name
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
    role: row.role || "mainboard",
  }));

  const landRows = await sql`
    SELECT land_type, quantity FROM mtg_deck_basic_land WHERE deck = ${deck_id}
  `;
  const basicLands: Record<string, number> = {};
  for (const row of landRows) {
    basicLands[row.land_type] = Number(row.quantity);
  }

  return {
    id: deck.id,
    name: deck.name,
    description: deck.description,
    cards,
    basicLands,
  } as CardDeck;
}

export async function createDeck(
  accountId: number,
  name: string,
  description: string,
): Promise<number> {
  const sql = getClient();
  if (!sql) throw new Error("Database client not initialized");

  const rows = await sql`
    INSERT INTO mtg_deck (account, name, description)
    VALUES (${accountId}, ${name}, ${description})
    RETURNING id
  `;
  return Number(rows[0].id);
}

export async function deleteDeck(accountId: number, deckId: number): Promise<void> {
  const sql = getClient();
  if (!sql) throw new Error("Database client not initialized");

  await sql.begin(async (tx) => {
    await tx`DELETE FROM mtg_deck_card WHERE deck = ${deckId}`;
    await tx`DELETE FROM mtg_deck_basic_land WHERE deck = ${deckId}`;
    await tx`DELETE FROM mtg_deck WHERE id = ${deckId} AND account = ${accountId}`;
  });
}

export async function updateDeck(
  accountId: number,
  deckId: number,
  name: string,
  description: string,
): Promise<void> {
  const sql = getClient();
  if (!sql) throw new Error("Database client not initialized");

  await sql`
    UPDATE mtg_deck
    SET name = ${name}, description = ${description}
    WHERE id = ${deckId} AND account = ${accountId}
  `;
}

export async function addCardToDeck(
  deckId: number,
  cardId: number,
  role: "commander" | "mainboard" | "sideboard",
): Promise<void> {
  const sql = getClient();
  if (!sql) throw new Error("Database client not initialized");

  if (role === "commander") {
    // Demote any existing commander to mainboard first
    await sql`
      UPDATE mtg_deck_card SET role = 'mainboard'
      WHERE deck = ${deckId} AND role = 'commander'
    `;
  }

  const existing = await sql`
    SELECT id FROM mtg_deck_card WHERE deck = ${deckId} AND card = ${cardId} LIMIT 1
  `;

  if (existing.length > 0) {
    await sql`
      UPDATE mtg_deck_card SET role = ${role}
      WHERE deck = ${deckId} AND card = ${cardId}
    `;
  } else {
    await sql`
      INSERT INTO mtg_deck_card (deck, card, role)
      VALUES (${deckId}, ${cardId}, ${role})
    `;
  }
}

export async function setBasicLandCount(deckId: number, landType: string, quantity: number): Promise<void> {
  const sql = getClient();
  if (!sql) throw new Error("Database client not initialized");

  if (quantity <= 0) {
    await sql`DELETE FROM mtg_deck_basic_land WHERE deck = ${deckId} AND land_type = ${landType}`;
  } else {
    await sql`
      INSERT INTO mtg_deck_basic_land (deck, land_type, quantity)
      VALUES (${deckId}, ${landType}, ${quantity})
      ON CONFLICT (deck, land_type) DO UPDATE SET quantity = EXCLUDED.quantity
    `;
  }
}

export async function removeCardFromDeck(deckId: number, cardId: number): Promise<void> {
  const sql = getClient();
  if (!sql) throw new Error("Database client not initialized");

  await sql`DELETE FROM mtg_deck_card WHERE deck = ${deckId} AND card = ${cardId}`;
}

export async function addImportedCardsToDeck(
  accountName: string,
  accountKey: string,
  deckId: number,
  role: "mainboard" | "sideboard",
  cards: { setId: string; collectorNumber: string; isFoil: boolean }[],
): Promise<number> {
  const accountData = await getAuthenticatedAccountData(accountName, accountKey);
  if (!accountData) throw new Error("Authentication failed");

  const sql = getClient();
  if (!sql) throw new Error("Database client not initialized");

  const deckRows = await sql`
    SELECT id FROM mtg_deck WHERE id = ${deckId} AND account = ${accountData.id} LIMIT 1
  `;
  if (!deckRows.length) throw new Error("Deck not found");

  let added = 0;
  for (const card of cards) {
    const cardId = await getMTGCardId(card.setId, card.collectorNumber, card.isFoil);
    await addCardToDeck(deckId, cardId, role);
    added++;
  }

  return added;
}
