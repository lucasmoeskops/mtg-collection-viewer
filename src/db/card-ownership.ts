"use server";

import { CardChange } from "@/types/CardChange";
import { CardOwnershipData } from "@/types/CardOwnershipData";
import getAuthenticatedAccountData from "./authenticate";
import { getClient } from "./client";
import getMTGCardId from "./get-mtg-card-id";

export async function getOwnedCardsForSets(
  setCodes: string[],
  accountName: string,
  accountKey: string,
): Promise<CardOwnershipData[]> {
  if (setCodes.length === 0) return [];

  try {
    const accountData = await getAuthenticatedAccountData(accountName, accountKey);
    if (!accountData) throw new Error("Authentication failed");

    const sql = getClient();
    if (!sql) throw new Error("Database client not initialized");

    const rows = await sql`
      SELECT ac.amount, cd.series, cd.cardnumber, cd.is_foil
      FROM mtg_account_card ac
      JOIN mtg_data cd ON ac.card = cd.id
      WHERE ac.account = ${accountData.id}
        AND cd.series = ANY(${setCodes})
        AND ac.amount > 0
    `;

    return rows.map((row) => ({
      setCode: row.series,
      collectorNumber: row.cardnumber,
      isFoil: row.is_foil,
      amount: row.amount,
    }));
  } catch (error) {
    console.error("Error fetching cards:", error);
    throw error;
  }
}

export async function getOwnedCardsForIndividuals(
  cards: { setCode: string; collectorNumber: string }[],
  accountName: string,
  accountKey: string,
): Promise<CardOwnershipData[]> {
  // Always wait 1 second
  await new Promise((resolve) => setTimeout(resolve, 1000));

  try {
    const accountData = await getAuthenticatedAccountData(accountName, accountKey);
    if (!accountData) throw new Error("Authentication failed");

    const sql = getClient();
    if (!sql) throw new Error("Database client not initialized");

    const rows = await sql`
      SELECT ac.amount, cd.series, cd.cardnumber, cd.is_foil
      FROM mtg_account_card ac
      JOIN mtg_data cd ON ac.card = cd.id
      WHERE ac.account = ${accountData.id}
        AND ac.amount > 0
    `;

    return rows.map((row) => ({
      setCode: row.series,
      collectorNumber: row.cardnumber,
      isFoil: row.is_foil,
      amount: row.amount,
    }));
  } catch (error) {
    console.error("Error fetching cards:", error);
    throw error;
  }
}

export async function saveCardChanges(
  accountName: string,
  accountKey: string,
  changes: CardChange[],
): Promise<CardOwnershipData[]> {
  const successfulChanges: CardOwnershipData[] = [];
  if (changes.length === 0) return successfulChanges;

  try {
    const accountData = await getAuthenticatedAccountData(accountName, accountKey);
    if (!accountData) throw new Error("Authentication failed");

    const sql = getClient();
    if (!sql) throw new Error("Database client not initialized");

    const changesWithIds: (CardChange & { cardId: number })[] = [];
    for (const change of changes) {
      changesWithIds.push({
        ...change,
        cardId: await getMTGCardId(change.setId, change.collectorNumber, change.isFoil),
      });
    }

    for (const change of changesWithIds) {
      if (change.newAmount < 0) {
        throw new Error(
          `Invalid amount for card ${change.setId} ${change.collectorNumber} (${change.isFoil ? "foil" : "nonfoil"}): ${change.newAmount}`,
        );
      }

      const existing = await sql`
        SELECT id FROM mtg_account_card
        WHERE account = ${accountData.id} AND card = ${change.cardId}
        LIMIT 1
      `;
      const accountCardId: number | null = existing[0]?.id ?? null;

      console.log(
        "Processing change for cardId", change.cardId,
        "existing accountCardId:", accountCardId,
        "newAmount:", change.newAmount,
      );

      try {
        if (!accountCardId && change.newAmount > 0) {
          await sql`
            INSERT INTO mtg_account_card (account, card, amount)
            VALUES (${accountData.id}, ${change.cardId}, ${change.newAmount})
          `;
        } else if (accountCardId && change.newAmount === 0) {
          await sql`DELETE FROM mtg_account_card WHERE id = ${accountCardId}`;
        } else if (accountCardId && change.newAmount > 0) {
          await sql`UPDATE mtg_account_card SET amount = ${change.newAmount} WHERE id = ${accountCardId}`;
        }
      } catch (err) {
        console.error("Error processing change:", err);
        continue;
      }

      successfulChanges.push({
        setCode: change.setId,
        collectorNumber: change.collectorNumber,
        isFoil: change.isFoil,
        amount: change.newAmount,
      });
    }

    return successfulChanges;
  } catch (error) {
    console.error("Error saving card changes:", error);
    throw error;
  }
}
