'use client'


import MagicCardLike from "@/interfaces/MagicCardLike"
import { CardSet, fetchSets, getSets } from "@/types/CardSet"
import { createContext, ReactNode, useEffect, useState } from "react"

export type SetContextProps = {
    getSets: (cards: MagicCardLike[]) => CardSet[],
    setSets: (sets: CardSet[] | ((sets: CardSet[]) => CardSet[])) => void,
    allSets: CardSet[],
}

export type SetContextProviderProps = {
    children: ReactNode | ReactNode[]
}

export const SetContext = createContext<SetContextProps>({
    getSets: () => [],
    setSets: () => {},
    allSets: [],
})

export default function SetContextProvider({ children }: SetContextProviderProps) {
    const [sets, setSets] = useState<CardSet[]>([])

    const value: SetContextProps = {
        getSets: (cards: MagicCardLike[]) => {
            return getSets(sets || [], cards)
        },
        allSets: sets,
        setSets,
    }

    useEffect(() => {
        fetchSets().then(setSets).catch((e) => {
            console.log('Error fetching sets', e)
            setSets([])
        })
    }, [])

    return <SetContext.Provider value={value}>
        {children}
    </SetContext.Provider>
}