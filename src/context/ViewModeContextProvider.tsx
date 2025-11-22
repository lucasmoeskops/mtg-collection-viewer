"use client";

import { getViewModeById, views } from "@/configuration/grid-views";
import { ReactNode, createContext, useContext, useEffect } from "react";
import { ViewMode } from "@/types/ViewMode";
import { SetContext } from "./SetContextProvider";
import { applySorting } from "@/enums/SetSorting";
import { CardSet } from "@/types/CardSet";
import { ViewModes } from "@/types/ViewModes";
import { AccountContext } from "./AccountContextProvider";
import { useMemo } from "react";
import { CardSorting } from "@/enums/CardSorting";

export type ViewModeContextProps = {
  viewMode: ViewMode;
  preferredSortingMethod: CardSorting | null;
  sortedSets: CardSet[];
};

export type ViewModeProviderProps = {
  children: ReactNode | ReactNode[];
  viewModeId: ViewModes;
};

export const ViewModeContext = createContext<ViewModeContextProps>({
  viewMode: views[0],
  preferredSortingMethod: null,
  sortedSets: [],
});

export default function ViewModeProvider({
  children,
  viewModeId,
}: ViewModeProviderProps) {
  const { sets } = useContext(SetContext);
  const {
    setCardDataNeeded,
    settings: { browseModeDefaultOrdering, merchantModeDefaultOrdering },
  } = useContext(AccountContext);
  const viewMode = getViewModeById(viewModeId);
  const sortedSets = useMemo(() => {
    return applySorting(viewMode.setSortingMethod, sets);
  }, [sets, viewMode.setSortingMethod]);

  useEffect(() => {
    setCardDataNeeded(true);
  }, [setCardDataNeeded]);

  const value: ViewModeContextProps = {
    viewMode,
    preferredSortingMethod:
      viewModeId === ViewModes.BROWSE
        ? browseModeDefaultOrdering
        : viewModeId === ViewModes.MERCHANT
          ? merchantModeDefaultOrdering
          : null,
    sortedSets,
  };

  return (
    <ViewModeContext.Provider value={value}>
      {children}
    </ViewModeContext.Provider>
  );
}
