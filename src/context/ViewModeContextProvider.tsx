'use client'

import { views } from "@/configuration/grid-views"
import { createContext, ReactNode, useEffect, useState } from "react"
import { ViewMode } from "@/types/ViewMode"
import { useRouter, useSearchParams } from "next/navigation"
import { updateQueryParams } from "@/helpers/router"

export type ViewModeContextProps = {
    viewModeIndex: number,
    viewMode: ViewMode,
    setViewModeIndex: (index: number) => void,
}

export type ViewModeProviderProps = {
    children: ReactNode | ReactNode[]
}

export const ViewModeContext = createContext<ViewModeContextProps>({
    viewModeIndex: 0,
    viewMode: views[0],
    setViewModeIndex: () => {},
})

export default function ViewModeProvider({ children }: ViewModeProviderProps) {
    const [viewModeIndex, setViewModeIndex] = useState<number>(0)
    const viewMode = views[viewModeIndex]
    const searchParams = useSearchParams()
    const router = useRouter()

    const value: ViewModeContextProps = {
        viewModeIndex,
        viewMode,
        setViewModeIndex: (viewModeIndex: number) => {
            updateQueryParams(router, searchParams, {
                viewMode: views[viewModeIndex].id,
            })
        },
    }

    useEffect(() => {
        const newViewMode = searchParams.get('viewMode')
        if (newViewMode) {
            const foundIndex = views.findIndex(view => view.id === newViewMode)
            if (foundIndex !== -1 && foundIndex !== viewModeIndex) {
                setViewModeIndex(foundIndex)
            }
        }
    }, [searchParams, viewModeIndex])

    return <ViewModeContext.Provider value={value}>
        {children}
    </ViewModeContext.Provider>
}