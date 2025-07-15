'use client'


import MagicCardLike from "@/interfaces/MagicCardLike"
import { createContext, ReactNode, useEffect, useState } from "react"

export type PaginationContextProps = {
    page: number,
    setPage: (page: number) => void,
    numPages: number,
    perPage: number,
}

export type PaginationContextProviderProps = {
    items: MagicCardLike[],
    perPage: number,
    children: ReactNode | ReactNode[]
}

export const PaginationContext = createContext<PaginationContextProps>({
    page: 0,
    setPage: () => {},
    numPages: 1,
    perPage: 60
})

export default function PaginationContextProvider({ children, items, perPage = 60 }: PaginationContextProviderProps) {
    const numPages = Math.ceil(items.length / perPage)
    const [page, setPage] = useState<number>(0)

    const value: PaginationContextProps = {
        page,
        setPage,
        numPages,
        perPage,
    }

    useEffect(() => {
        setPage(0)
    }, [items])

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [page])

    return <PaginationContext.Provider value={value}>
        {children}
    </PaginationContext.Provider>
}