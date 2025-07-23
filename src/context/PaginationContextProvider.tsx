'use client'


import { updateQueryParams } from "@/helpers/router"
import MagicCardLike from "@/interfaces/MagicCardLike"
import { clamp } from "lodash"
import { useSearchParams, useRouter } from "next/navigation"
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
    const searchParams = useSearchParams()
    const router = useRouter()

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

    // useEffect(() => {
    //     updateQueryParams(router, searchParams, {
    //         page: 1,
    //     })
    // }, [items, router, searchParams])

    useEffect(() => {
        const newPage = searchParams.get('page')
        if (newPage && !isNaN(parseInt(newPage))) {
            const intPage = clamp(parseInt(newPage) - 1, 0, numPages - 1)
            if (intPage !== page) {
                setPage(intPage)
            }
        }
    }, [searchParams, numPages, page])

    return <PaginationContext.Provider value={value}>
        {children}
    </PaginationContext.Provider>
}