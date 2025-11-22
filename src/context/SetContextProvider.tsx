'use client'


import { useAsync } from "@/hooks/useAsync"
import { CardSet, fetchSets } from "@/types/CardSet"
import { ReactNode, createContext } from "react"

export type SetContextProps = {
    sets: CardSet[],
    isLoading: boolean,
}

export type SetContextProviderProps = {
    children: ReactNode | ReactNode[]
}

export const SetContext = createContext<SetContextProps>({
    sets: [],
    isLoading: false,
})

export default function SetContextProvider({ children }: SetContextProviderProps) {
    const { data: sets, isLoading } = useAsync<CardSet[]>(fetchSets);
    
    const value: SetContextProps = {
        sets: sets || [],
        isLoading,
    }

    return <SetContext.Provider value={value}>
        {children}
    </SetContext.Provider>
}