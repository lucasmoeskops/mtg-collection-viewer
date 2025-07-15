import { CardSet } from "@/types/CardSet"
import { CardSetWithCompletion, setIsWithCompletion } from "@/types/SetCompletion"

export enum SetSorting {
    CHRONOLOGICAL,
    CHRONOLOGICAL_BACK,
    NAME,
    COMPLETION_BACK,
}

export function apply(sorting: SetSorting, sets: CardSet[]) {
    if (sorting === SetSorting.CHRONOLOGICAL)
        return sets.sort(sortChronological)
    if (sorting === SetSorting.CHRONOLOGICAL_BACK)
        return sets.sort(sortChronologicalBack)
    if (sorting === SetSorting.COMPLETION_BACK && sets.every(setIsWithCompletion)) {
        return sets.sort(sortCompletionBack)
    }
    return sets.sort(sortName)
}

export function sortChronological(a: CardSet, b: CardSet): number {
    if (a.releaseDate !== b.releaseDate) {
        return a.releaseDate > b.releaseDate ? 1 : -1
    }

    if (a.name !== b.name) {
        return a.name > b.name ? 1 : -1
    }

    return 0
}

export function sortChronologicalBack(a: CardSet, b: CardSet): number {
    if (a.releaseDate !== b.releaseDate) {
        return a.releaseDate < b.releaseDate ? 1 : -1
    }

    if (a.name !== b.name) {
        return a.name > b.name ? 1 : -1
    }

    return 0
}

export function sortName(a: CardSet, b: CardSet): number {
    if (a.name !== b.name) {
        return a.name > b.name ? 1 : -1
    }
    
    return sortChronological(a, b)
}

export function sortCompletionBack(a: CardSetWithCompletion, b: CardSetWithCompletion): number {
    if (a.completionRatio !== b.completionRatio) {
        return a.completionRatio > b.completionRatio ? -1 : 1
    }

    return sortName(a, b)
}