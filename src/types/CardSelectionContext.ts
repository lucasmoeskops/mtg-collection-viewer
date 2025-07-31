import { CardSorting } from "@/enums/CardSorting"
import { CardSet } from "./CardSet"

export type CardSelectionContext = {
    set: string,
    colors: string[],
    rarities: string[],
    isFoil: boolean,
    isLegendary: boolean,
    isToken: boolean,
    showDuplicates: boolean,
    sortingMethod: CardSorting,
    nameQuery: string,
    typeQuery: string,
    releasedBefore: CardSet | null,
    releasedAfter: CardSet | null,
}

export function newCardSelectionContext (): CardSelectionContext {
    return {
        set: '',
        rarities: [],
        colors: [],
        isFoil: false,
        isLegendary: false,
        isToken: false,
        showDuplicates: true,
        sortingMethod: CardSorting.CHRONOLOGICAL_BACK,
        nameQuery: '',
        typeQuery: '',
        releasedBefore: null,
        releasedAfter: null,
    }
}