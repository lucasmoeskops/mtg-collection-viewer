'use client'

import { views } from "@/configuration/grid-views"
import { createContext, ReactNode, useState } from "react"
import { ViewMode } from "@/types/ViewMode"

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

    const value: ViewModeContextProps = {
        viewModeIndex,
        viewMode,
        setViewModeIndex,
    }

    return <ViewModeContext.Provider value={value}>
        {children}
    </ViewModeContext.Provider>
}