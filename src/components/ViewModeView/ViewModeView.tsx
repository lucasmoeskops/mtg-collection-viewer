'use client';

import CardSelectionContextProvider from "@/context/CardContextProvider";
import Filters from "../Filters/Filters";
import InfoBox from "../InfoBox/InfoBox";
import MagicCardGrid from "../MagicCardGrid/MagicCardGrid";
import { ViewModes } from "@/types/ViewModes";
import ViewModeProvider from "@/context/ViewModeContextProvider";
import { useSearchParams } from "next/navigation";
import { queryParametersToContext } from "@/types/CardSelectionContext";


export function ViewModeView({ viewModeId }: { viewModeId: ViewModes }) {
    const searchParams = useSearchParams();
    const extraContext = queryParametersToContext(Object.fromEntries(searchParams.entries()), []);

    return (
        <ViewModeProvider viewModeId={viewModeId}>
            <CardSelectionContextProvider extraContext={extraContext}>
                <Filters />
                <InfoBox />
                <MagicCardGrid />
            </CardSelectionContextProvider>
        </ViewModeProvider>
    );
}