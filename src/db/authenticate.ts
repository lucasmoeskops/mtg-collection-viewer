"use server";

import { AccountData } from "@/types/AccountData";
import { AccountSettings } from "@/types/AccountSettings";
import { getClient } from "./client";

export default async function getAuthenticatedAccountData(
  name: string,
  key: string,
): Promise<AccountData | null> {
  const sql = getClient();

  if (!sql) {
    console.error("Database client not initialized");
    throw new Error("Database client not initialized");
  }

  const rows = await sql`
    SELECT id, settings
    FROM mtg_account
    WHERE username = ${name} AND dbkey = ${key}
    LIMIT 1
  `;

  if (!rows.length) {
    return null;
  }

  return {
    id: rows[0].id,
    username: name,
    settings: rows[0].settings as AccountSettings,
  };
}

export async function updateAccountSettings(
  name: string,
  key: string,
  newSettings: AccountSettings,
): Promise<void> {
  const sql = getClient();
  console.log("Updating settings for", name, newSettings);

  if (!sql) {
    console.error("Database client not initialized");
    throw new Error("Database client not initialized");
  }

  await sql`
    UPDATE mtg_account
    SET settings = ${sql.json(newSettings)}
    WHERE username = ${name} AND dbkey = ${key}
  `;
}
