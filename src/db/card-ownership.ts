"use server";

import { ScryFallCard, fetchCardsCollection } from "@/scryfall/utils";
import { CardChange } from "@/types/CardChange";
import { CardOwnershipData } from "@/types/CardOwnershipData";
import getAuthenticatedAccountData from "./authenticate";
import { getClient } from "./client";
import { insertMtgCardFromScryfall } from "./insert-new-mtg-card";

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

export type SaveCardChangesResult = {
  successful: CardOwnershipData[];
  failed: { setId: string; collectorNumber: string; isFoil: boolean }[];
};

export async function saveCardChanges(
  accountName: string,
  accountKey: string,
  changes: CardChange[],
): Promise<SaveCardChangesResult> {
  const successfulChanges: CardOwnershipData[] = [];
  const failedChanges: SaveCardChangesResult["failed"] = [];
  if (changes.length === 0) return { successful: successfulChanges, failed: failedChanges };

  try {
    const accountData = await getAuthenticatedAccountData(accountName, accountKey);
    if (!accountData) throw new Error("Authentication failed");

    const sql = getClient();
    if (!sql) throw new Error("Database client not initialized");

    // Series is stored lowercase in the DB (Scryfall's card.set is lowercase).
    // Normalize all comparisons to lowercase to avoid misses from user input in uppercase.
    const cardKey = (setId: string, collectorNumber: string, isFoil: boolean) =>
      `${setId.toLowerCase()}-${collectorNumber}-${isFoil}`;

    // Step 1: Bulk DB lookup — find cards already in mtg_data
    const uniqueSetCodes = [...new Set(changes.map((c) => c.setId.toLowerCase()))];
    const uniqueCollectorNumbers = [...new Set(changes.map((c) => c.collectorNumber))];
    const neededKeys = new Set(changes.map((c) => cardKey(c.setId, c.collectorNumber, c.isFoil)));

    const existingRows = await sql`
      SELECT id, series, cardnumber, is_foil
      FROM mtg_data
      WHERE series = ANY(${uniqueSetCodes})
        AND cardnumber = ANY(${uniqueCollectorNumbers})
    `;

    const cardIdMap = new Map<string, number>();
    for (const row of existingRows) {
      const key = cardKey(row.series, row.cardnumber, row.is_foil);
      if (neededKeys.has(key)) {
        cardIdMap.set(key, Number(row.id));
      }
    }

    // Step 2: Fetch cards not in DB from Scryfall /cards/collection (up to 75 per request)
    const missingCards = changes.filter((c) => !cardIdMap.has(cardKey(c.setId, c.collectorNumber, c.isFoil)));

    if (missingCards.length > 0) {
      const uniqueScryfallIdentifiers = new Map<string, { setId: string; collectorNumber: string }>();
      for (const card of missingCards) {
        const key = `${card.setId.toLowerCase()}-${card.collectorNumber}`;
        if (!uniqueScryfallIdentifiers.has(key)) {
          uniqueScryfallIdentifiers.set(key, { setId: card.setId, collectorNumber: card.collectorNumber });
        }
      }

      const { found, notFound } = await fetchCardsCollection(
        Array.from(uniqueScryfallIdentifiers.values()).map((c) => ({
          set: c.setId.toLowerCase(),
          collector_number: c.collectorNumber,
        })),
      );

      const scryfallNotFoundKeys = new Set(notFound.map((nf) => `${nf.set.toLowerCase()}-${nf.collector_number}`));
      const scryfallCardMap = new Map<string, ScryFallCard>();
      for (const card of found) {
        scryfallCardMap.set(`${card.set.toLowerCase()}-${card.collector_number}`, card);
      }

      // Step 3: Insert fetched cards into DB (once per foil/non-foil combination needed)
      for (const missingCard of missingCards) {
        const scryfallKey = `${missingCard.setId.toLowerCase()}-${missingCard.collectorNumber}`;

        if (scryfallNotFoundKeys.has(scryfallKey)) {
          failedChanges.push({ setId: missingCard.setId, collectorNumber: missingCard.collectorNumber, isFoil: missingCard.isFoil });
          continue;
        }

        const scryfallCard = scryfallCardMap.get(scryfallKey);
        if (!scryfallCard) {
          failedChanges.push({ setId: missingCard.setId, collectorNumber: missingCard.collectorNumber, isFoil: missingCard.isFoil });
          continue;
        }

        try {
          const newId = await insertMtgCardFromScryfall(scryfallCard, missingCard.isFoil);
          cardIdMap.set(cardKey(missingCard.setId, missingCard.collectorNumber, missingCard.isFoil), newId);
        } catch (err) {
          console.error("Error inserting card:", err);
          failedChanges.push({ setId: missingCard.setId, collectorNumber: missingCard.collectorNumber, isFoil: missingCard.isFoil });
        }
      }
    }

    // Step 4: Process ownership changes for all successfully resolved cards
    const failedKeys = new Set(failedChanges.map((f) => cardKey(f.setId, f.collectorNumber, f.isFoil)));

    for (const change of changes) {
      const key = cardKey(change.setId, change.collectorNumber, change.isFoil);
      if (failedKeys.has(key)) continue;

      const cardId = cardIdMap.get(key);
      if (!cardId) {
        failedChanges.push({ setId: change.setId, collectorNumber: change.collectorNumber, isFoil: change.isFoil });
        continue;
      }

      if (change.newAmount < 0) {
        throw new Error(
          `Invalid amount for card ${change.setId} ${change.collectorNumber} (${change.isFoil ? "foil" : "nonfoil"}): ${change.newAmount}`,
        );
      }

      const existing = await sql`
        SELECT id FROM mtg_account_card
        WHERE account = ${accountData.id} AND card = ${cardId}
        LIMIT 1
      `;
      const accountCardId: number | null = existing[0]?.id ?? null;

      try {
        if (!accountCardId && change.newAmount > 0) {
          await sql`
            INSERT INTO mtg_account_card (account, card, amount)
            VALUES (${accountData.id}, ${cardId}, ${change.newAmount})
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

    return { successful: successfulChanges, failed: failedChanges };
  } catch (error) {
    console.error("Error saving card changes:", error);
    throw error;
  }
}
