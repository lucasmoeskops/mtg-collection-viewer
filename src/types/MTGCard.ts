import { cardsSearchEndpoint, fetchDataPaginated, ScryFallCard } from "@/scryfall/utils";

export type MTGCard = {
    id: string,
    name: string,
    series: string,
    setId: string,
    collectorNumber: string,
    imageUrl: string,
    color: string,
    rarity: string,
}

const cache = {
    bySet: new Map<string, MTGCard[]>()
}

export function getCardHash(card: MTGCard, isFoil: boolean): string {
    return `${card.setId}-${card.collectorNumber}-${isFoil ? 'foil' : 'nonfoil'}`;
}

export async function getCardsForSet(setId: string): Promise<MTGCard[]> {
    const cached = cache.bySet.get(setId);
    if (cached) {
        return cached;
    }
    return _getCardsForSet(setId);
}

export async function getCardsByQuery(query: string, setId: string | undefined): Promise<MTGCard[]> {
    const finalSetId = setId && !query.match(/\be:[a-z0-9]{3,}/i) ? setId : undefined;
    const params = {
        order: 'set',
        q: finalSetId ? `e:${finalSetId} ${query}` : query,
        unique: 'prints'
    };
    try {
        const scryfallCards = await fetchDataPaginated<ScryFallCard>(cardsSearchEndpoint, params, 500);
        return scryfallCards.map(fromScryfallCard);
    } catch (error) {
        console.error('Error fetching cards by query:', error);
        return [];
    }
}

async function _getCardsForSet(setId: string): Promise<MTGCard[]> {
    const params = {
        order: 'set',
        q: `e:${setId}`,
        unique: 'prints'
    };
    const scryfallCards = await fetchDataPaginated<ScryFallCard>(cardsSearchEndpoint, params);
    const cards = scryfallCards.map(fromScryfallCard);
    cache.bySet.set(setId, cards);
    return cards;
}

export async function getCard(setId: string, collectorNumber: string): Promise<MTGCard | null> {
    const cards = await getCardsForSet(setId);
    const card = cards.find(c => c.collectorNumber === collectorNumber);
    return card || null;
}

function fromScryfallCard(card: ScryFallCard): MTGCard {
    return {
        id: card.id,
        name: card.name,
        setId: card.set,
        series: card.set_name,
        collectorNumber: card.collector_number,
        imageUrl: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || '',
        color: card.color_identity?.join('') || 'C',
        rarity: card.rarity,
    };
}
