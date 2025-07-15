import { SetSorting } from "@/enums/SetSorting";
import MagicCardLike from "@/interfaces/MagicCardLike";
import { CardSelectionContext } from "@/types/CardSelectionContext";
import { ReactNode } from "react";

export type ViewMode = {
    label: string,
    title: string | ((context: CardSelectionContext) => string),
    description: string,
    showSetCompletions: boolean,
    showColorFilter: boolean,
    showLegendaryFilter: boolean,
    showRarityFilter: boolean,
    showTokenFilter: boolean,
    setSortingMethod: SetSorting,
    baseContext: Partial<CardSelectionContext>,
    getCardInfo: (card: MagicCardLike) => string | ReactNode | ReactNode[],
    statistics: ((cards: MagicCardLike[]) => ReactNode) | undefined,
}

export function newViewMode(props: Partial<ViewMode>): ViewMode {
    return {
        label: "New ViewMode",
        title: "New ViewMode",
        description: "A new view mode",
        showSetCompletions: false,
        showColorFilter: true,
        showLegendaryFilter: true,
        showRarityFilter: true,
        showTokenFilter: true,
        setSortingMethod: SetSorting.CHRONOLOGICAL_BACK,
        baseContext: {},
        getCardInfo: () => '',
        statistics: undefined,
        ...props,
    }
}