'use server';
import { getClient } from './client';


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