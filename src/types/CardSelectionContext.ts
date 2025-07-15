import { CardSorting } from "@/enums/CardSorting"

export type CardSelectionContext = {
    set: string,
    colors: string[],
    rarities: string[],
    isFoil: boolean,
    isLegendary: boolean,
    isToken: boolean,
    showDuplicates: boolean,
    onlyOwned: boolean,
    sortingMethod: CardSorting
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
        onlyOwned: true,
        sortingMethod: CardSorting.CHRONOLOGICAL_BACK
    }
}