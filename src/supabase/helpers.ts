'use server'

import MagicCardLike, { parseManaCostAmount } from "@/interfaces/MagicCardLike";
import { getClient } from "./client";


type SupabaseMagicCardLike = {
    card: {
        id: number;
        name: string;
        series: string;
        colors: string[];
        rarity: string;
        cardnumber: number;
        card_type: string;
        image_url: string | null;
        is_foil: boolean;
        is_token: boolean;
        artist?: string;
        text?: string;
        manacost?: string;
        release_date: string;
        price_estimate: number;
    }
    amount: number;
    avg_price?: number;
    avg_non_foil_price?: number;
    // mtg_price: {
    //     avg_price: number;
    //     avg_non_foil_price: number;
    // }[];
}


function cardTransformer(card: SupabaseMagicCardLike): MagicCardLike {
    const cardData = card.card;
    return {
        series: cardData.series,
        cardnumber: cardData.cardnumber,
        card_type: cardData.card_type,
        name: cardData.name,
        image_url: cardData.image_url || '',
        amount_owned: card.amount,
        is_foil: cardData.is_foil,
        is_token: cardData.is_token,
        release_date: new Date(cardData.release_date),
        price_estimate: cardData.price_estimate,
        colors: cardData.colors,
        rarity: cardData.rarity,
        artist: cardData.artist || '',
        text: cardData.text || '',
        manacost: cardData.manacost || '',
        manacost_amount: parseManaCostAmount(cardData.manacost || ''),
        avg_price: Math.floor(card.avg_price ?? 0),
        avg_non_foil_price: Math.floor(card.avg_non_foil_price ?? 0),
        current_price_delta: cardData.price_estimate && card.avg_price ? Math.floor(cardData.price_estimate - card.avg_price) : 0,
    }
}


export async function getAllCards(accountId: number): Promise<MagicCardLike[]> {
    'use server'

    const client = getClient()
    let cards: MagicCardLike[] = [];

    if (client) {
        const { data, error } = await client
            .from('mtg_account_card')
            .select(`
                card (
                    id,
                    series,
                    cardnumber,
                    card_type,
                    name,
                    image_url,
                    is_foil,
                    is_token,
                    release_date,
                    price_estimate,
                    colors,
                    rarity,
                    manacost,
                    artist,
                    text
                ),
                amount
            `)
            .eq('account', accountId)
            .gt('amount', 0)
            .limit(10000)

        const { data: mtgPriceData, error: mtgPriceError } = await client
            .from('mtg_price')
            .select(`
                mtg_data_id,
                avg_price: price_cents.avg(),
                avg_non_foil_price: non_foil_price_cents.avg()
            `)
            .order('mtg_data_id')
            .limit(10000)
        if (mtgPriceError) {
            console.log(mtgPriceError)
            throw new Error('Supabase error: see console')
        }

        if (error) {
            console.log(error)
            throw new Error('Supabase error: see console')
        }
    
        if (data && mtgPriceData) {
            const priceMap = new Map<number, { avg_price: number; avg_non_foil_price: number }>();
            mtgPriceData.forEach(price => {
                priceMap.set(price.mtg_data_id, {
                    avg_price: price.avg_price ?? 0,
                    avg_non_foil_price: price.avg_non_foil_price ?? 0
                });
            });
            data.forEach((card: SupabaseMagicCardLike) => {
                const prices = priceMap.get(card.card.id);
                if (prices) {
                    card.avg_price = prices.avg_price;
                    card.avg_non_foil_price = prices.avg_non_foil_price;
                } else {
                    card.avg_price = card.card.price_estimate;
                    card.avg_non_foil_price = card.card.is_foil ? 0 : card.card.price_estimate;
                }
            });
            cards = data.map(cardTransformer)
        }
    }

    return cards
}

export async function getAccountIdByUsername(username: string): Promise<number | null> {
    'use server'

    const client = getClient()
    if (!client) return null;

    const { data, error } = await client
        .from('mtg_account')
        .select('id')
        .eq('username', username)
        .single();

    if (error) {
        console.error('Error fetching account ID:', error);
        return null;
    }

    return data ? data.id : null;
}