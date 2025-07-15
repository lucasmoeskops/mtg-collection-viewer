import MagicCardLike from "@/interfaces/MagicCardLike";
import { CardSet } from "./CardSet";

export interface CardSetWithCompletion extends CardSet {
    completionRatio: number,
    numberOfCardsOwned: number,
}

export function setIsWithCompletion(set: CardSet): set is CardSetWithCompletion {
    return typeof set.completionRatio === 'number' && typeof set.numberOfCardsOwned === 'number'
}

export function calculateSetCompletions(sets: CardSet[], cards: MagicCardLike[]): CardSetWithCompletion[] {
    const lookup = new Map<string, Set<number>>()
    for (const card of cards) {
        let s = lookup.get(card.series)
        if (s) {
            s.add(card.cardnumber)
        } else {
            s = new Set<number>
            s.add(card.cardnumber)
            lookup.set(card.series, s)
        }
    }

    return sets.map(set => {
        const owned: number = lookup.get(set.code)?.size || 0
        return {
            ...set,
            completionRatio: owned / Math.max(1, set.numberOfCards),
            numberOfCardsOwned: owned,
        }
    })
}