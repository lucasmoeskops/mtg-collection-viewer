import MagicCardLike from "@/interfaces/MagicCardLike";
import { getClient } from "./client";


type SupabaseMagicCardLike = {
    id: number;
    name: string;
    series: string;
    colors: string[];
    rarity: string;
    cardnumber: number;
    card_type: string;
    image_url: string;
    amount_owned: number;
    is_foil: boolean;
    is_token: boolean;
    release_date: string;
    price_estimate: number;
    avg_price?: number;
    avg_non_foil_price?: number;
    // mtg_price: {
    //     avg_price: number;
    //     avg_non_foil_price: number;
    // }[];
}


function cardTransformer(card: SupabaseMagicCardLike): MagicCardLike {
    return {
        series: card.series,
        cardnumber: card.cardnumber,
        card_type: card.card_type,
        name: card.name,
        image_url: card.image_url,
        amount_owned: card.amount_owned,
        is_foil: card.is_foil,
        is_token: card.is_token,
        release_date: new Date(card.release_date),
        price_estimate: card.price_estimate,
        colors: card.colors,
        rarity: card.rarity,
        avg_price: Math.floor(card.avg_price ?? 0),
        avg_non_foil_price: Math.floor(card.avg_non_foil_price ?? 0),
        current_price_delta: card.price_estimate && card.avg_price ? Math.floor(card.price_estimate - card.avg_price) : 0,
    }
}


export async function getAllCards(): Promise<MagicCardLike[]> {
    const client = getClient()
    let cards: MagicCardLike[] = [];

    if (client) {
        const { data, error } = await client
            .from('mtg_data')
            .select(`
                id,
                series,
                cardnumber,
                card_type,
                name,
                image_url,
                amount_owned,
                is_foil,
                is_token,
                release_date,
                price_estimate,
                colors,
                rarity
            `)
            .gt('amount_owned', 0)
            .order('series, cardnumber')
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
                const prices = priceMap.get(card.id);
                if (prices) {
                    card.avg_price = prices.avg_price;
                    card.avg_non_foil_price = prices.avg_non_foil_price;
                } else {
                    card.avg_price = 0;
                    card.avg_non_foil_price = 0;
                }
            });
            cards = data.map(cardTransformer)
        }
    }

    return cards
}