import { CardSorting } from "@/enums/CardSorting";
import { SetSorting } from "@/enums/SetSorting";
import MagicCardLike from "@/interfaces/MagicCardLike";
import { CardSelectionContext } from "@/types/CardSelectionContext";
import { ReactNode } from "react";

export type ViewMode = {
    id: string,
    label: string,
    title: string | ((context: CardSelectionContext) => string),
    sortModes: CardSorting[],
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
        id: "new-view-mode",
        label: "New ViewMode",
        title: "New ViewMode",
        sortModes: [CardSorting.CHRONOLOGICAL_BACK],
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