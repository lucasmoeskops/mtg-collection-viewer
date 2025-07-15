'use client'


import MagicCardLike from "@/interfaces/MagicCardLike"
import { CardSet, fetchSets, getSets } from "@/types/CardSet"
import { createContext, ReactNode, useEffect, useState } from "react"

export type SetContextProps = {
    getSets: (cards: MagicCardLike[]) => CardSet[]
}

export type SetContextProviderProps = {
    children: ReactNode | ReactNode[]
}

export const SetContext = createContext<SetContextProps>({
    getSets: () => []
})

export default function SetContextProvider({ children }: SetContextProviderProps) {
    const [sets, setSets] = useState<CardSet[]>([])

    const value: SetContextProps = {
        getSets: (cards) => getSets(sets, cards)
    }

    useEffect(() => {
        fetchSets().then(setSets)
    }, [])

    return <SetContext.Provider value={value}>
        {children}
    </SetContext.Provider>
}