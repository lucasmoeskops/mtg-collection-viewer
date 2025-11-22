"use server";

import { AccountData } from "@/types/AccountData";
import { getClient } from "./client";
import { AccountSettings } from "@/types/AccountSettings";

export default async function getAuthenticatedAccountData(
  name: string,
  key: string,
): Promise<AccountData | null> {
  const client = getClient();

  if (!client) {
    console.error("Supabase client not initialized");
    throw new Error("Supabase client not initialized");
  }

  const { data, error } = await client
    .from("mtg_account")
    .select("id, settings")
    .eq("username", name)
    .eq("dbkey", key)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Authentication error:", error);
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    username: name,
    settings: data.settings as AccountSettings,
  };
}

export async function updateAccountSettings(
  name: string,
  key: string,
  newSettings: AccountSettings,
): Promise<void> {
  const client = getClient();
  console.log("Updating settings for", name, newSettings);

  if (!client) {
    console.error("Supabase client not initialized");
    throw new Error("Supabase client not initialized");
  }

  const { error } = await client
    .from("mtg_account")
    .update({ settings: newSettings })
    .eq("username", name)
    .eq("dbkey", key);

  if (error) {
    console.error("Error updating account settings:", error);
    throw error;
  }
}
