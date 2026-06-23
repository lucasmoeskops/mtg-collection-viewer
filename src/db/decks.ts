"use server";

import { fromDbCard } from "@/interfaces/MagicCardLike";
import { computeDeckCardCount } from "@/procedures/deck-card-count";
import { CardDeck } from "@/types/CardDeckData";
import { CardDeckPreview } from "@/types/CardDeckPreview";
import { DeckHistoryEntry } from "@/types/DeckHistoryEntry";
import getAuthenticatedAccountData from "./authenticate";
import { getClient } from "./client";
import getMTGCardId from "./get-mtg-card-id";
import { DbMagicCardLike } from "./types";

export async function getDeckList(
  account_id: number,
): Promise<CardDeckPreview[]> {
  const sql = getClient();
  if (!sql) return [];

  const rows = await sql`
    SELECT DISTINCT ON (d.id)
      d.id, d.name, d.description,
      c.name AS commander_name,
      c.image_url AS commander_image_url,
      c.colors AS commander_colors,
      COALESCE(card_counts.count, 0) AS mainboard_and_commander_count,
      COALESCE(land_totals.basic_lands, '{}'::jsonb) AS basic_lands
    FROM mtg_deck d
    LEFT JOIN mtg_deck_card dc ON d.id = dc.deck AND dc.role = 'commander'
    LEFT JOIN mtg_data c ON dc.card = c.id
    LEFT JOIN (
      SELECT deck, COUNT(*) AS count
      FROM mtg_deck_card
      WHERE role IN ('commander', 'mainboard')
      GROUP BY deck
    ) card_counts ON d.id = card_counts.deck
    LEFT JOIN (
      SELECT deck, jsonb_object_agg(land_type, quantity) AS basic_lands
      FROM mtg_deck_basic_land
      GROUP BY deck
    ) land_totals ON d.id = land_totals.deck
    WHERE d.account = ${account_id}
    ORDER BY d.id
  `;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    commander_name: row.commander_name ?? undefined,
    commander_image_url: row.commander_image_url ?? undefined,
    card_count: computeDeckCardCount(
      Number(row.mainboard_and_commander_count),
      (row.basic_lands ?? {}) as Record<string, number>,
      (row.commander_colors ?? []) as string[],
    ),
  }));
}

export async function getDeck(
  account_id: number,
  deck_id: number,
): Promise<CardDeck | null> {
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
        id: Number(row.id),
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

  const packageRows = await sql`
    SELECT
      p.id, p.name, p.description, p.target,
      COALESCE(array_agg(pc.card ORDER BY pc.card) FILTER (WHERE pc.card IS NOT NULL), '{}') AS card_ids
    FROM mtg_deck_package p
    LEFT JOIN mtg_deck_package_card pc ON p.id = pc.package
    WHERE p.deck = ${deck_id}
    GROUP BY p.id
    ORDER BY p.id
  `;

  const packages = packageRows.map((row) => ({
    id: Number(row.id),
    name: row.name as string,
    description: (row.description ?? "") as string,
    target: row.target != null ? Number(row.target) : undefined,
    cardIds: (row.card_ids as unknown[]).map(Number),
  }));

  return {
    id: deck.id,
    name: deck.name,
    description: deck.description,
    cards,
    basicLands,
    packages,
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

export async function deleteDeck(
  accountId: number,
  deckId: number,
): Promise<void> {
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

async function logDeckAction(
  deckId: number,
  cardId: number | null,
  cardName: string | null,
  fromRole: string | null,
  toRole: string | null,
): Promise<void> {
  const sql = getClient();
  if (!sql) return;
  await sql`
    INSERT INTO mtg_deck_history (deck_id, card_id, card_name, from_role, to_role)
    VALUES (${deckId}, ${cardId}, ${cardName}, ${fromRole}, ${toRole})
  `;
}

export async function addCardToDeck(
  deckId: number,
  cardId: number,
  role: "commander" | "mainboard" | "sideboard" | "garbage_bin",
): Promise<void> {
  const sql = getClient();
  if (!sql) throw new Error("Database client not initialized");

  let oldCommander: { id: number; name: string } | null = null;

  if (role === "commander") {
    const oldCommanderRows = await sql`
      SELECT dc.card, d.name
      FROM mtg_deck_card dc
      JOIN mtg_data d ON dc.card = d.id
      WHERE dc.deck = ${deckId} AND dc.role = 'commander'
      LIMIT 1
    `;
    if (oldCommanderRows.length > 0 && Number(oldCommanderRows[0].card) !== cardId) {
      oldCommander = { id: Number(oldCommanderRows[0].card), name: oldCommanderRows[0].name as string };
    }
    await sql`
      UPDATE mtg_deck_card SET role = 'mainboard'
      WHERE deck = ${deckId} AND role = 'commander'
    `;
  }

  const [existingRows, cardNameRows] = await Promise.all([
    sql`SELECT role FROM mtg_deck_card WHERE deck = ${deckId} AND card = ${cardId} LIMIT 1`,
    sql`SELECT name FROM mtg_data WHERE id = ${cardId} LIMIT 1`,
  ]);
  const fromRole = existingRows.length > 0 ? (existingRows[0].role as string) : null;
  const cardName = cardNameRows.length > 0 ? (cardNameRows[0].name as string) : null;

  if (existingRows.length > 0) {
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

  if (oldCommander) {
    await logDeckAction(deckId, oldCommander.id, oldCommander.name, "commander", "mainboard");
  }
  await logDeckAction(deckId, cardId, cardName, fromRole, role);
}

export async function setBasicLandCount(
  deckId: number,
  landType: string,
  quantity: number,
): Promise<void> {
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

export async function removeCardFromDeck(
  deckId: number,
  cardId: number,
): Promise<void> {
  const sql = getClient();
  if (!sql) throw new Error("Database client not initialized");

  const rows = await sql`
    SELECT dc.role, d.name
    FROM mtg_deck_card dc
    JOIN mtg_data d ON dc.card = d.id
    WHERE dc.deck = ${deckId} AND dc.card = ${cardId}
    LIMIT 1
  `;
  const fromRole = rows.length > 0 ? (rows[0].role as string) : null;
  const cardName = rows.length > 0 ? (rows[0].name as string) : null;

  await sql`DELETE FROM mtg_deck_card WHERE deck = ${deckId} AND card = ${cardId}`;

  if (fromRole !== null) {
    await logDeckAction(deckId, cardId, cardName, fromRole, null);
  }
}

export async function emptyGarbageBin(deckId: number): Promise<void> {
  const sql = getClient();
  if (!sql) throw new Error("Database client not initialized");

  const rows = await sql`
    SELECT dc.card, d.name
    FROM mtg_deck_card dc
    JOIN mtg_data d ON dc.card = d.id
    WHERE dc.deck = ${deckId} AND dc.role = 'garbage_bin'
  `;

  await sql`DELETE FROM mtg_deck_card WHERE deck = ${deckId} AND role = 'garbage_bin'`;

  for (const row of rows) {
    await logDeckAction(deckId, Number(row.card), row.name as string, "garbage_bin", null);
  }
}

export async function addImportedCardsToDeck(
  accountName: string,
  accountKey: string,
  deckId: number,
  role: "mainboard" | "sideboard",
  cards: { setId: string; collectorNumber: string; isFoil: boolean }[],
): Promise<number> {
  const accountData = await getAuthenticatedAccountData(
    accountName,
    accountKey,
  );
  if (!accountData) throw new Error("Authentication failed");

  const sql = getClient();
  if (!sql) throw new Error("Database client not initialized");

  const deckRows = await sql`
    SELECT id FROM mtg_deck WHERE id = ${deckId} AND account = ${accountData.id} LIMIT 1
  `;
  if (!deckRows.length) throw new Error("Deck not found");

  let added = 0;
  for (const card of cards) {
    const cardId = await getMTGCardId(
      card.setId,
      card.collectorNumber,
      card.isFoil,
    );
    await addCardToDeck(deckId, cardId, role);
    added++;
  }

  return added;
}

export async function copyDeck(accountId: number, sourceDeckId: number): Promise<number> {
  const sql = getClient();
  if (!sql) throw new Error("Database client not initialized");

  // ── What this function copies ──────────────────────────────────────────────────────────────
  // If you add a new deck-related table, extend this function accordingly.
  //   ✓ mtg_deck              (creates new row with "Copy of …" name)
  //   ✓ mtg_deck_card
  //   ✓ mtg_deck_basic_land
  //   ✓ mtg_deck_package      (old→new ID mapping required for mtg_deck_package_card)
  //   ✓ mtg_deck_package_card
  //   ✓ mtg_deck_history
  // ──────────────────────────────────────────────────────────────────────────────────────────

  return await sql.begin(async (tx) => {
    const sourceRows = await tx`
      SELECT name, description FROM mtg_deck WHERE id = ${sourceDeckId} AND account = ${accountId} LIMIT 1
    `;
    if (!sourceRows.length) throw new Error("Deck not found");
    const { name, description } = sourceRows[0];

    const newDeckRows = await tx`
      INSERT INTO mtg_deck (account, name, description)
      VALUES (${accountId}, ${"Copy of " + name}, ${description})
      RETURNING id
    `;
    const newDeckId = Number(newDeckRows[0].id);

    await tx`
      INSERT INTO mtg_deck_card (deck, card, role)
      SELECT ${newDeckId}, card, role FROM mtg_deck_card WHERE deck = ${sourceDeckId}
    `;

    await tx`
      INSERT INTO mtg_deck_basic_land (deck, land_type, quantity)
      SELECT ${newDeckId}, land_type, quantity FROM mtg_deck_basic_land WHERE deck = ${sourceDeckId}
    `;

    const oldPackages = await tx`
      SELECT id, name, description, target FROM mtg_deck_package WHERE deck = ${sourceDeckId} ORDER BY id
    `;
    for (const pkg of oldPackages) {
      const newPkgRows = await tx`
        INSERT INTO mtg_deck_package (deck, name, description, target)
        VALUES (${newDeckId}, ${pkg.name as string}, ${pkg.description}, ${pkg.target})
        RETURNING id
      `;
      const newPkgId = Number(newPkgRows[0].id);
      await tx`
        INSERT INTO mtg_deck_package_card (package, card)
        SELECT ${newPkgId}, card FROM mtg_deck_package_card WHERE package = ${Number(pkg.id)}
      `;
    }

    await tx`
      INSERT INTO mtg_deck_history (deck_id, card_id, card_name, from_role, to_role, created_at)
      SELECT ${newDeckId}, card_id, card_name, from_role, to_role, created_at
      FROM mtg_deck_history WHERE deck_id = ${sourceDeckId}
    `;

    return newDeckId;
  });
}

export async function getDeckHistory(
  deckId: number,
  page: number,
  pageSize: number,
): Promise<{ entries: DeckHistoryEntry[]; total: number }> {
  const sql = getClient();
  if (!sql) return { entries: [], total: 0 };

  const offset = page * pageSize;

  const [countRows, rows] = await Promise.all([
    sql`SELECT COUNT(*) AS count FROM mtg_deck_history WHERE deck_id = ${deckId}`,
    sql`
      SELECT id, card_id, card_name, from_role, to_role, created_at
      FROM mtg_deck_history
      WHERE deck_id = ${deckId}
      ORDER BY created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `,
  ]);

  return {
    total: Number(countRows[0].count),
    entries: rows.map((row) => ({
      id: Number(row.id),
      cardId: row.card_id != null ? Number(row.card_id) : null,
      cardName: (row.card_name as string) ?? null,
      fromRole: (row.from_role as string) ?? null,
      toRole: (row.to_role as string) ?? null,
      createdAt: (row.created_at as Date).toISOString(),
    })),
  };
}
