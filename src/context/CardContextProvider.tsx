'use client'

import MagicCardLike from "@/interfaces/MagicCardLike"
import RenderableMagicCardLike from "@/interfaces/RenderableMagicCardLike"
import { allCardSelector } from "@/procedures/card-selectors"
import { CardSelectionContext, cardSelectionContextToHumanReadableString, newCardSelectionContext } from "@/types/CardSelectionContext"
import { createContext, Dispatch, ReactNode, SetStateAction, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { SetContext } from "./SetContextProvider"
import { CardColor, getColors } from "@/types/CardColor"
import { CardRarity, getRarities } from "@/types/CardRarity"
import { calculateSetCompletions, CardSetWithCompletion } from "@/types/SetCompletion"
import { ViewModeContext } from "./ViewModeContextProvider"
import { useRouter, useSearchParams } from "next/navigation"
import { sortingMethodFromKey, sortingMethodToKey } from "@/enums/CardSorting"
import { CardSet } from "@/types/CardSet"
import { updateQueryParams } from "@/helpers/router"
import { ViewMode } from "@/types/ViewMode"
import { AccountContext } from "./AccountContextProvider"
import { apply } from "@/enums/SetSorting"
import { Box, Typography } from "@mui/material"


function partialContextToQueryParameters(context: Partial<CardSelectionContext>): Record<string, string> {
    const parameters: Record<string, string> = {};
    if (context.set !== undefined) {
        parameters.set = context.set;
    }
    if (context.colors !== undefined) {
        parameters.colors = context.colors.join(',');
    }
    if (context.rarities !== undefined) {
        parameters.rarities = context.rarities.join(',');
    }
    if (context.isFoil !== undefined) {
        parameters.foil = context.isFoil ? '1' : '';
    }
    if (context.isLegendary !== undefined) {
        parameters.legendary = context.isLegendary ? '1' : '';
    }
    if (context.isToken !== undefined) {
        parameters.token = context.isToken ? '1' : '';
    }
    // if (context.showDuplicates !== undefined) {
    //     parameters.showDuplicates = context.showDuplicates ? '1' : '';
    // }
    if (context.sortingMethod !== undefined) {
        parameters.sort = sortingMethodToKey(context.sortingMethod);
    }
    if (context.nameQuery !== undefined) {
        parameters.name = context.nameQuery;
    }
    if (context.typeQuery !== undefined) {  
        parameters.type = context.typeQuery;
    }
    if (context.textQuery !== undefined) {
        parameters.text = context.textQuery;
    }
    if (context.artistQuery !== undefined) {
        parameters.artist = context.artistQuery;
    }
    if (context.releasedBefore !== undefined) {
        parameters.releasedBefore = context.releasedBefore?.code || '';
    }
    if (context.releasedAfter !== undefined) {
        parameters.releasedAfter = context.releasedAfter?.code || '';
    }
    return parameters;
}

function queryParametersToContext(query: Record<string, string>, sets: CardSet[], baseContext: Partial<CardSelectionContext>): CardSelectionContext {
    const newContext: Partial<CardSelectionContext> = {
        set: query.set || '',
        colors: (query.colors || '').split(',').filter(Boolean),
        rarities: (query.rarities || '').split(',').filter(Boolean),
        isFoil: query.foil === '1',
        isLegendary: query.legendary === '1',
        isToken: query.token === '1',
        // showDuplicates: query.showDuplicates === '1',
        sortingMethod: sortingMethodFromKey(query.sort) || baseContext.sortingMethod,
        nameQuery: query.name || '',
        typeQuery: query.type || '',
        textQuery: query.text || '',
        artistQuery: query.artist || '',
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

export default function CardSelectionContextProvider({ children }: CardSelectionContextProviderProps) {
    const { cards } = useContext(AccountContext)
    const { getSets } = useContext(SetContext)
    const [currentViewMode, setCurrentViewMode] = useState<ViewMode | null>(null)
    const {viewMode} = useContext(ViewModeContext)
    const [context, setContext] = useState<CardSelectionContext>({...newCardSelectionContext(), ...viewMode.baseContext})
    const [sets, setSets] = useState<CardSetWithCompletion[]>([])
    const colors: CardColor[] = useMemo(() => getColors(cards), [cards])
    const rarities: CardRarity[] = useMemo(() => getRarities(cards), [cards])
    const [selectedCards, setSelectedCards] = useState<RenderableMagicCardLike[]>([])
    const statistics = viewMode.statistics ? viewMode.statistics(selectedCards, context) : undefined
    const showSetCompletions = viewMode.showSetCompletions
    const searchParams = useSearchParams()
    const router = useRouter()

    const updateQuery = useCallback((context: CardSelectionContext, newContext: SetStateAction<Partial<CardSelectionContext>>) => {
        updateQueryParams(router, searchParams, partialContextToQueryParameters(typeof newContext === 'function' ? newContext(context) : newContext))
    }, [router, searchParams])

    useEffect(() => {
        if (currentViewMode !== viewMode) {
            setCurrentViewMode(viewMode)
            updateQuery(context, viewMode.baseContext)
        }
    }, [currentViewMode, viewMode, context, updateQuery])

    useEffect(() => {
        const withCompletions = calculateSetCompletions(getSets(cards), cards)
        apply(viewMode.setSortingMethod, withCompletions)
        setSets(withCompletions)
    }, [cards, getSets, viewMode.setSortingMethod])

    useEffect(() => {
        setContext(ctx => {
            const needsUpdate = Object.entries(viewMode.baseContext).some(([key, value]) => {
                if (key === 'sortingMethod') {
                    return ctx.sortingMethod !== value
                }
                return ctx[key as keyof CardSelectionContext] !== value
            })
            if (!needsUpdate) {
                return ctx
            }
            return {
                ...ctx,
                ...viewMode.baseContext,
            }
        })
        // setContext(ctx => ({...ctx, ...viewMode.baseContext}))
        // setSets(sets => {
        //     const sorted = apply(viewMode.setSortingMethod, sets) as CardSetWithCompletion[]
        //     if (zip(sets || [], sorted || []).some(([a, b]) => a != b)) {
        //         return sorted
        //     }
        //     return sets
        // })
    }, [viewMode])

    useEffect(() => {
        allCardSelector(cards, context).then(setSelectedCards)
    }, [cards, context])

    useEffect(() => {
        const newContext = queryParametersToContext(Object.fromEntries(searchParams.entries()), sets, viewMode.baseContext)
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
        generalInfo: <Box sx={{p: 2}}><Typography>{cardSelectionContextToHumanReadableString(context)}</Typography>{statistics}</Box>,
        setContext: (newContext: SetStateAction<CardSelectionContext>) => {
            updateQuery(context, newContext as Partial<CardSelectionContext>)
        },
    }

    return <CardSelectionContextContext.Provider value={value}>
        {children}
    </CardSelectionContextContext.Provider>
}