import { getClient } from "./client";
import { cardsSearchEndpoint, fetchDataPaginated, ScryFallCard } from "@/scryfall/utils";

export default async function insertNewMtgCard(setId: string, collectorNumber: string, isFoil: boolean) {
    const client = getClient();
    const card: ScryFallCard | undefined = await fetchDataPaginated<ScryFallCard>(cardsSearchEndpoint, {
        order: 'set',
        q: `e:${setId} cn:${collectorNumber}`,
        unique: 'prints'
    }).then(cards => cards.find(c => c.collector_number === collectorNumber));
    if (!client) {
        console.error('Supabase client not initialized');
        throw new Error('Supabase client not initialized');
    }
    if (!card) {
        console.error('Card not found');
        throw new Error('Card not found');
    }
    const { data, error } = await client
            .from('mtg_data')
            .upsert({
                amount_owned: 0,
                artist: card.artist || '',
                card_type: card.type_line,
                cardmarket_url: '', // deprecated
                cardnumber: parseInt(card.collector_number),
                colors: card.color_identity ?? [],
                image_url: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || '',
                is_foil: isFoil,
                is_token: card.type_line.toLowerCase().split(' ').includes('token'),
                manacost: card.mana_cost || '',
                name: card.name,
                price_estimate: isFoil ? (card.prices.eur_foil ? parseInt(card.prices.eur_foil.replace('.', '')) : 1) : (card.prices.eur ? parseInt(card.prices.eur.replace('.', '')) : 1),
                rarity: card.rarity,
                release_date: card.released_at || '',
                series: card.set,
                text: card.oracle_text || '',
            })
            .select('id')
            .limit(1)
            .maybeSingle();

    if (error) {
        console.error('Error inserting card:', error);
        throw error;
    }

    return data ? data.id : 0;
}
