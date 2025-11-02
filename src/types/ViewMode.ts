import { CardSorting } from "@/enums/CardSorting";
import { SetSorting } from "@/enums/SetSorting";
import MagicCardLike from "@/interfaces/MagicCardLike";
import { CardSelectionContext } from "@/types/CardSelectionContext";
import { ReactNode } from "react";
import { ViewModes } from "./ViewModes";

export type ViewMode = {
    id: ViewModes,
    label: string,
    title: string | ((context: CardSelectionContext) => string),
    sortModes: CardSorting[],
    description: string,
    showSetCompletions: boolean,
    showColorFilter: boolean,
    showDateFilter: boolean,
    showLegendaryFilter: boolean,
    showRarityFilter: boolean,
    showTokenFilter: boolean,
    setSortingMethod: SetSorting,
    baseContext: Partial<CardSelectionContext>,
    getCardInfo: (card: MagicCardLike) => string | ReactNode | ReactNode[],
    statistics: ((cards: MagicCardLike[], context: CardSelectionContext) => ReactNode) | undefined,
}

export function newViewMode(props: Partial<ViewMode> & { id: ViewModes }): ViewMode {
    return {
        label: "New ViewMode",
        title: "New ViewMode",
        sortModes: [CardSorting.CHRONOLOGICAL_BACK],
        description: "A new view mode",
        showSetCompletions: false,
        showColorFilter: true,
        showLegendaryFilter: true,
        showRarityFilter: true,
        showTokenFilter: true,
        showDateFilter: true,
        setSortingMethod: SetSorting.CHRONOLOGICAL_BACK,
        baseContext: {},
        getCardInfo: () => '',
        statistics: undefined,
        ...props,
    }
}