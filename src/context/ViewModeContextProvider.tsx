'use client'

import { getViewModeById, views } from "@/configuration/grid-views"
import { createContext, ReactNode, useContext, useEffect } from "react"
import { ViewMode } from "@/types/ViewMode"
import { SetContext } from "./SetContextProvider"
import { apply } from "@/enums/SetSorting"
import { CardSet } from "@/types/CardSet"
import { ViewModes } from "@/types/ViewModes"
import { AccountContext } from "./AccountContextProvider"

export type ViewModeContextProps = {
    viewMode: ViewMode,
}

export type ViewModeProviderProps = {
    children: ReactNode | ReactNode[],
    viewModeId: ViewModes,
}

export const ViewModeContext = createContext<ViewModeContextProps>({
    viewMode: views[0],
})

export default function ViewModeProvider({ children, viewModeId }: ViewModeProviderProps) {
    const { setSets } = useContext(SetContext);
    const { setCardDataNeeded } = useContext(AccountContext);
    const viewMode = getViewModeById(viewModeId);

    useEffect(() => {
        setCardDataNeeded(true);
    }, [setCardDataNeeded]);

    const value: ViewModeContextProps = {
        viewMode,
    }

    useEffect(() => {
        setSets((allSets: CardSet[]) => {
            if (!allSets || allSets.length === 0) {
                return allSets
            }
            
            return [...apply(viewMode.setSortingMethod, allSets)]
        })
    }, [setSets, viewMode.setSortingMethod])

    return <ViewModeContext.Provider value={value}>
        {children}
    </ViewModeContext.Provider>
}