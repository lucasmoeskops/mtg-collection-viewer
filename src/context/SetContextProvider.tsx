'use client'


import MagicCardLike from "@/interfaces/MagicCardLike"
import { CardSet, fetchSets, getSets } from "@/types/CardSet"
import { createContext, ReactNode, useCallback, useEffect, useState } from "react"

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

    const getSetsCallback = useCallback((cards: MagicCardLike[]) => {
        return getSets(sets, cards)
    }, [sets])

    const value: SetContextProps = {
        getSets: getSetsCallback
    }

    useEffect(() => {
        fetchSets().then(setSets)
    }, [])

    return <SetContext.Provider value={value}>
        {children}
    </SetContext.Provider>
}