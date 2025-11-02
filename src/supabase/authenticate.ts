'use server';

import { getClient } from "./client";

export default async function getAuthenticatedAccountId(name: string, key: string): Promise<number> {
    const client = getClient();

    if (!client) {
        console.error('Supabase client not initialized');
        throw new Error('Supabase client not initialized');
    }

    const { data, error } = await client
            .from('mtg_account')
            .select('id')
            .eq('username', name)
            .eq('dbkey', key)
            .limit(1)
            .maybeSingle();

    if (error) {
        console.error('Authentication error:', error);
        throw error;
    }

    return data ? data.id : 0;
}