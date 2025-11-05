import MagicCardLike from "@/interfaces/MagicCardLike";
import { rateLimitedFetch, setsEndpoint } from "@/scryfall/utils";

export interface CardSet {
    code: string,
    name: string,
    numberOfCards: number,
    releaseDate: Date,
    iconSvgUri: string,
}

const cache = {
    sets: []
}

export function getSets(sets: CardSet[], cards: MagicCardLike[]): CardSet[] {
    const codes = new Set()
    for (const card of cards) {
        codes.add(card.series)
    }
    return sets.filter(({ code }) => codes.has(code))
}

export async function fetchSets(): Promise<CardSet[]> {
    if (!cache.sets.length) {
        let response
        try {
            response = await rateLimitedFetch(setsEndpoint)
        } catch (e) {
            console.log('Error:', e)
            return []
        }
        const json = await response.json()
        cache.sets = json['data'].map(scryfallSetToCardSet).sort(setSort)
    }
    return cache.sets
}

interface ScryFallSet {
    code: string,
    name: string,
    card_count: number,
    printed_size?: number,
    released_at: string,
    icon_svg_uri: string,
}

function scryfallSetToCardSet({ code, name, card_count, printed_size, released_at, icon_svg_uri }: ScryFallSet): CardSet {
    return { code, name, numberOfCards: printed_size ?? card_count, releaseDate: new Date(Date.parse(released_at)), iconSvgUri: icon_svg_uri }
}

function setSort(a: CardSet, b: CardSet) {
    if (a.name !== b.name) {
        return a.name > b.name ? 1 : -1
    }

    return 0
}

export function setDateSort(a: CardSet, b: CardSet) {
    if (a.releaseDate.getTime() !== b.releaseDate.getTime()) {
        return b.releaseDate.getTime() - a.releaseDate.getTime()
    }

    return 0
}

export async function getSetByCode(code: string): Promise<CardSet | undefined> {
    const sets = await fetchSets()
    return sets.find(set => set.code === code)
}
