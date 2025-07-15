import MagicCardLike from "@/interfaces/MagicCardLike"

export enum CardSorting {
    CHRONOLOGICAL,
    CHRONOLOGICAL_BACK,
    NAME,
    PRICE_BACK,
    CARD_TYPE
}

export function sortChronological(a: MagicCardLike, b: MagicCardLike): number {
    if (a.release_date !== b.release_date) {
        return a.release_date > b.release_date ? 1 : -1
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