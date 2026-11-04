"use server";

import { PricePoint } from "@/types/PricePoint";
import { getAccountIdByUsername, loadCollectionValueHistory } from "./collection-value-history";

/** Collection value of an account at every finished price import, as graph points. */
export async function getCollectionValueHistory(
  username: string,
): Promise<PricePoint[]> {
  const accountId = await getAccountIdByUsername(username);
  if (accountId === null) return [];

  const entries = await loadCollectionValueHistory(accountId);

  return entries.map((entry) => ({
    timestamp: entry.timestamp,
    price: entry.valueCents,
    estimated: entry.estimated,
  }));
}
