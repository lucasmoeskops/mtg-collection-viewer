import MagicCardLike from "@/interfaces/MagicCardLike";
import { getClient } from "./client";


type SupabaseMagicCardLike = {
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
        rarity: card.rarity
    }
}


export async function getAllCards(): Promise<MagicCardLike[]> {
    const client = getClient()
    let cards: MagicCardLike[] = [];

    if (client) {
        const { data, error } = await client
            .from('mtg_data')
            .select('series, cardnumber, card_type, name, image_url, amount_owned, is_foil, is_token, release_date, price_estimate, colors, rarity')
            .order('series, cardnumber')
            .limit(10000)

        if (error) {
            console.log(error)
            throw new Error('Supabase error: see console')
        }
    
        if (data) {
            cards = data.map(cardTransformer)
        }
    }

    return cards
}