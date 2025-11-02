import { getClient } from "./client";
import insertNewMtgCard from "./insert-new-mtg-card";

export default async function getMTGCardId(setId: string, collectorNumber: string, isFoil: boolean): Promise<number> {
    const client = getClient();

    if (!client) {
        console.error('Supabase client not initialized');
        throw new Error('Supabase client not initialized');
    }

    const { data, error } = await client
            .from('mtg_data')
            .select('id')
            .eq('series', setId)
            .eq('cardnumber', parseInt(collectorNumber))
            .eq('is_foil', isFoil)
            .limit(1)
            .maybeSingle();

    if (error) {
        console.error('Authentication error:', error);
        throw error;
    }

    if (!data || !data.id) {
        return insertNewMtgCard(setId, collectorNumber, isFoil);
    }

    return data.id;
}