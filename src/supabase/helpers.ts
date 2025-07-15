import MagicCardLike from "@/interfaces/MagicCardLike";
import { getClient } from "./client";

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
            cards = data
        }
    }

    return cards
}