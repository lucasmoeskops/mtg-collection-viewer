"use server";

import { getClient } from "./client";

export async function createPackage(
  deckId: number,
  name: string,
  description: string,
  target?: number,
): Promise<number> {
  const sql = getClient();
  if (!sql) throw new Error("Database client not initialized");

  const rows = await sql`
    INSERT INTO mtg_deck_package (deck, name, description, target)
    VALUES (${deckId}, ${name}, ${description}, ${target ?? null})
    RETURNING id
  `;
  return Number(rows[0].id);
}

export async function updatePackage(
  packageId: number,
  name: string,
  description: string,
  target?: number,
): Promise<void> {
  const sql = getClient();
  if (!sql) throw new Error("Database client not initialized");

  await sql`
    UPDATE mtg_deck_package
    SET name = ${name}, description = ${description}, target = ${target ?? null}
    WHERE id = ${packageId}
  `;
}

export async function deletePackage(packageId: number): Promise<void> {
  const sql = getClient();
  if (!sql) throw new Error("Database client not initialized");

  await sql.begin(async (tx) => {
    await tx`DELETE FROM mtg_deck_package_card WHERE package = ${packageId}`;
    await tx`DELETE FROM mtg_deck_package WHERE id = ${packageId}`;
  });
}

export async function addCardToPackage(packageId: number, cardId: number): Promise<void> {
  const sql = getClient();
  if (!sql) throw new Error("Database client not initialized");

  await sql`
    INSERT INTO mtg_deck_package_card (package, card)
    VALUES (${packageId}, ${cardId})
    ON CONFLICT DO NOTHING
  `;
}

export async function removeCardFromPackage(packageId: number, cardId: number): Promise<void> {
  const sql = getClient();
  if (!sql) throw new Error("Database client not initialized");

  await sql`DELETE FROM mtg_deck_package_card WHERE package = ${packageId} AND card = ${cardId}`;
}
