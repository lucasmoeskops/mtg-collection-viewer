'use client'

import { zip } from "lodash"
import { views } from "@/configuration/grid-views"
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

    const value: CardSelectionContextContextProps = {
        context,
        cards: selectedCards,
        sets,
        colors,
        rarities,
        showSetCompletions,
        getCardInfo: viewMode.getCardInfo,
        generalInfo: statistics,
        setContext,
    }

    return <CardSelectionContextContext.Provider value={value}>
        {children}
    </CardSelectionContextContext.Provider>
}