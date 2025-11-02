'use server';
import MagicCardLike, { fromSupabaseCard } from '@/interfaces/MagicCardLike';
import { getClient } from './client';
import { Database } from '../../database.types';
import { PostgrestError } from '@supabase/supabase-js';
import { newSupabaseMagicCardLike } from './utils';
import getAuthenticatedAccountId from './authenticate';

export type EntityRecordWithRpc = Database["public"]["Tables"]["mtg_data"]["Row"];

export async function authenticate(name: string, key: string): Promise<boolean> {
    // Always wait 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
        const userId = await getAuthenticatedAccountId(name, key);
        return userId !== 0;
    } catch (error) {
        console.error('Authentication error:', error);
        throw error;
    }
};

export async function getPriceHistoryForCard(cardId: number): Promise<{ timestamp: string; price: number }[]> {
    const client = getClient()
    if (!client) return [];

    const { data, error } = await client
        .from('mtg_price')
        .select('timestamp, price_cents')
        .eq('mtg_data_id', cardId)
        .order('timestamp', { ascending: true });

    if (error) {
        console.error('Error fetching price history:', error);
        return [];
    }

    return data
        .filter(({timestamp, price_cents}) => timestamp !== null && price_cents !== null)
        .map(({ timestamp, price_cents}) => ({ timestamp, price: price_cents })) || [];
}

export async function getRandomCard(): Promise<MagicCardLike | null> {
    const client = getClient()
    if (!client) return null;

    const { data, error } = await client
        .rpc('random_card')
        .single() as { data: EntityRecordWithRpc, error: PostgrestError | null };

    if (error) {
        console.error('Error fetching random card:', error);
        return null;
    }

    const supabaseCard = {
        ...newSupabaseMagicCardLike(),
        card: data,
    }

    return fromSupabaseCard(supabaseCard);
}