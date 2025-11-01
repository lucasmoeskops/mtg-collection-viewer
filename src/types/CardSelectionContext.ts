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
    textQuery: string,
    artistQuery: string,
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
        textQuery: '',
        artistQuery: '',
        releasedBefore: null,
        releasedAfter: null,
    }
}

export function cardSelectionContextToHumanReadableString(context: CardSelectionContext): string {
    const parts: string[] = []
    if (context.nameQuery) {
        parts.push(`name contains "${context.nameQuery}"`)
    }
    if (context.typeQuery) {
        parts.push(`card type contains "${context.typeQuery}"`)
    }
    if (context.textQuery) {
        parts.push(`card text contains "${context.textQuery}"`)
    }
    if (context.artistQuery) {
        parts.push(`artist contains "${context.artistQuery}"`)
    }
    if (context.colors.length > 0) {
        parts.push(`colors are within "${context.colors.join(', ')}"`)
    }
    if (context.rarities.length > 0) {
        parts.push(`rarities include ${context.rarities.join(', ')}`)
    }
    if (context.isFoil) {
        parts.push(`it is foil`)
    }
    if (context.isLegendary) {
        parts.push(`it is legendary`)
    }
    if (context.isToken) {
        parts.push(`it is a token`)
    }
    if (context.set) {
        parts.push(`within the set "${context.set}"`)
    }
    if (context.releasedAfter) {
        parts.push(`released after the set ${context.releasedAfter.name} (${context.releasedAfter.releaseDate.toISOString().split('T')[0]})`)
    }
    if (context.releasedBefore) {
        parts.push(`released before the set ${context.releasedBefore.name} (${context.releasedBefore.releaseDate.toISOString().split('T')[0]})`)
    }
    if (parts.length === 0) {
        return '';
    }
    if (parts.length > 1) {
        const lastPart = parts.pop();
        return `Filters: ${parts.join(', ')} and ${lastPart}.`;
    }
    return `Filter: ${parts[0]}.`;
}
