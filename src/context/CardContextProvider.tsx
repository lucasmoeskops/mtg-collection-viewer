'use client'

import { zip } from "lodash"
import MagicCardLike from "@/interfaces/MagicCardLike"
import RenderableMagicCardLike from "@/interfaces/RenderableMagicCardLike"
import { allCardSelector } from "@/procedures/card-selectors"
import { CardSelectionContext, newCardSelectionContext } from "@/types/CardSelectionContext"
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useMemo, useState } from "react"
import { SetContext } from "./SetContextProvider"
import { CardColor, getColors } from "@/types/CardColor"
import { CardRarity, getRarities } from "@/types/CardRarity"
import { calculateSetCompletions, CardSetWithCompletion } from "@/types/SetCompletion"
import { apply } from "@/enums/SetSorting"
import { ViewModeContext } from "./ViewModeContextProvider"
import { useRouter, useSearchParams } from "next/navigation"
import { sortingMethodFromKey, sortingMethodToKey } from "@/enums/CardSorting"
import { CardSet } from "@/types/CardSet"
import { updateQueryParams } from "@/helpers/router"

function contextToQueryParameters(context: CardSelectionContext): Record<string, string> {
    return {
        set: context.set,
        colors: context.colors.join(','),
        rarities: context.rarities.join(','),
        isFoil: context.isFoil ? '1': '',
        isLegendary: context.isLegendary ? '1' : '',
        isToken: context.isToken ? '1' : '',
        // showDuplicates: context.showDuplicates ? '1' : '',
        sortingMethod: sortingMethodToKey(context.sortingMethod),
        nameQuery: context.nameQuery,
        typeQuery: context.typeQuery,
        releasedBefore: context.releasedBefore?.code || '',
        releasedAfter: context.releasedAfter?.code || '',
    }
}

function queryParametersToContext(query: Record<string, string>, sets: CardSet[], baseContext: Partial<CardSelectionContext>): CardSelectionContext {
    const newContext: Partial<CardSelectionContext> = {
        set: query.set || '',
        colors: (query.colors || '').split(',').filter(Boolean),
        rarities: (query.rarities || '').split(',').filter(Boolean),
        isFoil: query.isFoil === '1',
        isLegendary: query.isLegendary === '1',
        isToken: query.isToken === '1',
        // showDuplicates: query.showDuplicates === '1',
        sortingMethod: sortingMethodFromKey(query.sortingMethod) || baseContext.sortingMethod,
        nameQuery: query.nameQuery || '',
        typeQuery: query.typeQuery || '',
        releasedBefore: query.releasedBefore ? sets.find(set => set.code === query.releasedBefore) ?? null : null,
        releasedAfter: query.releasedAfter ? sets.find(set => set.code === query.releasedAfter) ?? null : null,
    }

    return {
        ...newCardSelectionContext(),
        ...baseContext,
        ...Object.fromEntries(Object.entries(newContext).filter(([key, value]) => key && value)),
    }
}

export type CardSelectionContextContextProps = {
    context: CardSelectionContext,
    cards: RenderableMagicCardLike[],
    sets: CardSetWithCompletion[],
    colors: CardColor[],
    rarities: CardRarity[],
    showSetCompletions: boolean,
    getCardInfo: (card: MagicCardLike) => string | ReactNode | ReactNode[],
    generalInfo: ReactNode | undefined,
    setContext: Dispatch<SetStateAction<CardSelectionContext>>,
}

export type CardSelectionContextProviderProps = {
    cards: MagicCardLike[],
    children: ReactNode | ReactNode[]
}

export const CardSelectionContextContext = createContext<CardSelectionContextContextProps>({
    context: newCardSelectionContext(),
    cards: [],
    sets: [],
    colors: [],
    rarities: [],
    showSetCompletions: false,
    getCardInfo: () => '',
    generalInfo: undefined,
    setContext: () => {},
})

export default function CardSelectionContextProvider({ cards, children }: CardSelectionContextProviderProps) {
    const { getSets } = useContext(SetContext)
    const {viewMode} = useContext(ViewModeContext)
    const [context, setContext] = useState<CardSelectionContext>({...newCardSelectionContext(), ...viewMode.baseContext})
    const [sets, setSets] = useState<CardSetWithCompletion[]>([])
    const colors: CardColor[] = useMemo(() => getColors(cards), [cards])
    const rarities: CardRarity[] = useMemo(() => getRarities(cards), [cards])
    const [selectedCards, setSelectedCards] = useState<RenderableMagicCardLike[]>([])
    const statistics = viewMode.statistics ? viewMode.statistics(selectedCards) : undefined
    const showSetCompletions = viewMode.showSetCompletions
    const searchParams = useSearchParams()
    const router = useRouter()

    useEffect(() => {
        setSets(calculateSetCompletions(getSets(cards), cards))
    }, [cards, getSets])

    useEffect(() => {
        setContext(ctx => ({...ctx, ...viewMode.baseContext}))
        setSets(sets => {
            const sorted = apply(viewMode.setSortingMethod, sets) as CardSetWithCompletion[]
            if (zip(sets || [], sorted || []).some(([a, b]) => a != b)) {
                return sorted
            }
            return sets
        })
    }, [sets, viewMode])

    useEffect(() => {
        allCardSelector(cards, context).then(setSelectedCards)
    }, [cards, context])

    useEffect(() => {
        const newContext = queryParametersToContext(Object.fromEntries(searchParams.entries()), sets, viewMode.baseContext)
        console.log('Updating context from query parameters?', JSON.stringify(context), JSON.stringify(newContext))
        if (JSON.stringify(newContext) !== JSON.stringify(context)) {
            setContext(newContext)
        }
    }, [searchParams, sets, viewMode.baseContext, context])

    const value: CardSelectionContextContextProps = {
        context,
        cards: selectedCards,
        sets,
        colors,
        rarities,
        showSetCompletions,
        getCardInfo: viewMode.getCardInfo,
        generalInfo: statistics,
        setContext: (newContext: SetStateAction<CardSelectionContext>) => {
            updateQueryParams(router, searchParams, contextToQueryParameters(typeof newContext === 'function' ? newContext(context) : newContext))
        },  
    }

    return <CardSelectionContextContext.Provider value={value}>
        {children}
    </CardSelectionContextContext.Provider>
}