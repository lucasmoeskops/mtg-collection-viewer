'use client'

import { updateQueryParams } from "@/helpers/router"
import MagicCardLike from "@/interfaces/MagicCardLike"
import { clamp } from "lodash"
import { useRouter, useSearchParams } from "next/navigation"
import { ReactNode, createContext } from "react"

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
    const searchParams = useSearchParams()
    const router = useRouter()
    const newPage = searchParams.get('page')
    let page: number = 0;
    if (newPage && !isNaN(parseInt(newPage))) {
        page = clamp(parseInt(newPage) - 1, 0, numPages - 1);
    } else {
        page = 0
    }

    const value: PaginationContextProps = {
        page,
        setPage: (newPage: number) => {
            updateQueryParams(router, searchParams, {
                page: clamp(newPage + 1, 1, numPages),
            })
        },
        numPages,
        perPage,
    }

    return <PaginationContext.Provider value={value}>
        {children}
    </PaginationContext.Provider>
}