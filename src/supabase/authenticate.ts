'use server';

import { AccountData } from "@/types/AccountData";
import { getClient } from "./client";

export default async function getAuthenticatedAccountData(name: string, key: string): Promise<AccountData | null> {
    const client = getClient();

    if (!client) {
        console.error('Supabase client not initialized');
        throw new Error('Supabase client not initialized');
    }

    const { data, error } = await client
            .from('mtg_account')
            .select('id', 'settings')
            .eq('username', name)
            .eq('dbkey', key)
            .limit(1)
            .maybeSingle();

    if (error) {
        console.error('Authentication error:', error);
        throw error;
    }

    if (!data) {
        return null;
    }

    return {
        id: data.id,
        username: name,
        settings: data.settings,
    };
}