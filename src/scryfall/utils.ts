export const timeBetweenConsecutiveCalls = 250; // milliseconds
export const setsEndpoint = 'https://api.scryfall.com/sets';
export const cardsSearchEndpoint = 'https://api.scryfall.com/cards/search';
let lastCallTime = 0;

export type ScryFallCard = {
    id: string,
    name: string,
    set_name: string,
    set: string,
    collector_number: string,
    image_uris?: {
        normal: string,
        art_crop?: string,
    },
    card_faces?: Array<{
        image_uris?: {
            normal: string,
            art_crop?: string,
        }
    }>,
    color_identity?: string[],
    rarity: string,
    type_line: string,
    prices: {
        usd?: string,
        usd_foil?: string,
        eur?: string,
        eur_foil?: string,
        tix?: string,
    },
    mana_cost?: string,
    artist?: string,
    oracle_text?: string,
    released_at?: string,
    purchase_uris?: {
        cardmarket?: string,
    }
}

export async function rateLimitedFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall < timeBetweenConsecutiveCalls) {
        await new Promise(resolve => setTimeout(resolve, timeBetweenConsecutiveCalls - timeSinceLastCall));
        return rateLimitedFetch(input, init);
    }

    lastCallTime = Date.now();
    return fetch(input, init);
}

export async function fetchDataPaginated<T>(endpoint: string, params: Record<string, string> = {}, limit: number = 0): Promise<T[]> {
    const results: T[] = [];
    let fetchedAll = false;
    let currentEndpoint = endpoint;

    while (!fetchedAll && (limit === 0 || results.length < limit)) {
        const url = new URL(currentEndpoint);
        Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

        const response = await rateLimitedFetch(url.toString());
        if (!response.ok) {
            throw new Error(`Error fetching data: ${response.statusText}`);
        }
        const jsonResponse = await response.json();

        if (!jsonResponse.has_more) {
            fetchedAll = true;
        }

        results.push(...jsonResponse.data);
        currentEndpoint = jsonResponse.next_page;
    }

    return limit > 0 && results.length > limit ? results.slice(0, limit) : results;
}
