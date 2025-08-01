import MagicCardLike from "@/interfaces/MagicCardLike"

export enum CardSorting {
    CHRONOLOGICAL,
    CHRONOLOGICAL_BACK,
    NAME,
    PRICE_BACK,
    CARD_TYPE,
    AVG_PRICE,
    AVG_NON_FOIL_PRICE,
    PRICE_DELTA,
    MANA_COST,
    ARTIST,
}

export const CardSortingValues: CardSorting[] = [
    CardSorting.CHRONOLOGICAL,
    CardSorting.CHRONOLOGICAL_BACK,
    CardSorting.NAME,
    CardSorting.PRICE_BACK,
    CardSorting.CARD_TYPE,
    CardSorting.AVG_PRICE,
    CardSorting.AVG_NON_FOIL_PRICE,
    CardSorting.PRICE_DELTA,
    CardSorting.MANA_COST,
    CardSorting.ARTIST,
]

export const CardSortingLabels: Record<CardSorting, string> = {
    [CardSorting.CHRONOLOGICAL]: "Chronological",
    [CardSorting.CHRONOLOGICAL_BACK]: "Chronological (Backwards)",
    [CardSorting.NAME]: "Name",
    [CardSorting.PRICE_BACK]: "Price (Backwards)",
    [CardSorting.CARD_TYPE]: "Card Type",
    [CardSorting.AVG_PRICE]: "Average Price",
    [CardSorting.AVG_NON_FOIL_PRICE]: "Average Non-Foil Price",
    [CardSorting.PRICE_DELTA]: "Price Change",
    [CardSorting.MANA_COST]: "Mana Cost",
    [CardSorting.ARTIST]: "Artist",
}

export function sortingMethodToKey(method: CardSorting): string {
    return CardSortingValues.findIndex(key => key === method)?.toString() || "Unknown"
}

export function sortingMethodFromKey(key: string): CardSorting | undefined {
    const index = parseInt(key, 10)
    if (isNaN(index) || index < 0 || index >= CardSortingValues.length) {
        return undefined
    }
    return CardSortingValues[index]
}

export function sortChronological(a: MagicCardLike, b: MagicCardLike): number {
    if (a.release_date.getTime() !== b.release_date.getTime()) {
        return a.release_date.getTime() > b.release_date.getTime() ? 1 : -1
    }

    if (a.series !== b.series) {
        return a.series > b.series ? 1 : -1
    }

    return a.cardnumber - b.cardnumber
}

export function sortChronologicalBack(a: MagicCardLike, b: MagicCardLike): number {
    if (a.release_date !== b.release_date) {
        return a.release_date < b.release_date ? 1 : -1
    }

    if (a.series !== b.series) {
        return a.series > b.series ? 1 : -1
    }

    return a.cardnumber - b.cardnumber
}

export function sortName(a: MagicCardLike, b: MagicCardLike): number {
    if (a.name !== b.name) {
        return a.name > b.name ? 1 : -1
    }
    
    return sortChronological(a, b)
}

export function sortPriceBack(a: MagicCardLike, b: MagicCardLike): number {
    if (a.price_estimate !== b.price_estimate) {
        return a.price_estimate > b.price_estimate ? -1 : 1
    }

    return sortChronologicalBack(a, b)
}

export function sortCardType(a: MagicCardLike, b: MagicCardLike): number {
    if (a.card_type !== b.card_type) {
        return a.card_type > b.card_type ? 1 : -1
    }

    return sortName(a, b)
}

export function sortAvgPrice(a: MagicCardLike, b: MagicCardLike): number {
    if (a.avg_price !== b.avg_price) {
        return a.avg_price > b.avg_price ? -1 : 1
    }

    return sortChronologicalBack(a, b)
}

export function sortAvgNonFoilPrice(a: MagicCardLike, b: MagicCardLike): number {
    if (a.avg_non_foil_price !== b.avg_non_foil_price) {
        return a.avg_non_foil_price > b.avg_non_foil_price ? -1 : 1
    }

    return sortChronologicalBack(a, b)
}

export function sortByPriceDelta(a: MagicCardLike, b: MagicCardLike): number {
    if (a.current_price_delta !== b.current_price_delta) {
        return a.current_price_delta > b.current_price_delta ? -1 : 1
    }

    return sortChronologicalBack(a, b)
}

export function sortManaCost(a: MagicCardLike, b: MagicCardLike): number {
    if (a.manacost_amount !== b.manacost_amount) {
        return a.manacost_amount > b.manacost_amount ? 1 : -1
    }

    return sortChronological(a, b)
}

export function artistSort(a: MagicCardLike, b: MagicCardLike): number {
    if (a.artist !== b.artist) {
        return a.artist > b.artist ? 1 : -1
    }

    return sortChronological(a, b)
}
