'use client'

import { getViewModeById, views } from "@/configuration/grid-views"
import { ReactNode, createContext, useContext, useEffect } from "react"
import { ViewMode } from "@/types/ViewMode"
import { SetContext } from "./SetContextProvider"
import { applySorting } from "@/enums/SetSorting"
import { CardSet } from "@/types/CardSet"
import { ViewModes } from "@/types/ViewModes"
import { AccountContext } from "./AccountContextProvider"
import { useMemo } from "react"

export type ViewModeContextProps = {
    viewMode: ViewMode,
    sortedSets: CardSet[],
}

export type ViewModeProviderProps = {
    children: ReactNode | ReactNode[],
    sortedSets: CardSet[],
    viewModeId: ViewModes,
}

export const ViewModeContext = createContext<ViewModeContextProps>({
    viewMode: views[0],
    sortedSets: [],
})

export default function ViewModeProvider({ children, viewModeId }: ViewModeProviderProps) {
    const { sets } = useContext(SetContext);
    const { setCardDataNeeded } = useContext(AccountContext);
    const viewMode = getViewModeById(viewModeId);
    const sortedSets = useMemo(() => {
        return applySorting(viewMode.setSortingMethod, sets);
    }, [sets, viewMode.setSortingMethod]);

    useEffect(() => {
        setCardDataNeeded(true);
    }, [setCardDataNeeded]);
    
    const value: ViewModeContextProps = {
        viewMode,
        sortedSets,
    }

    return <ViewModeContext.Provider value={value}>
        {children}
    </ViewModeContext.Provider>
}