'use client';

import { useContext } from "react";
import { CardEditGridSimple } from "@/components/CardEditGridSimple/CardEditGridSimple";
import { CardEditorContext } from "@/context/CardEditorContextProvider";

export function CardContextSetter() {
    const { set, cards } = useContext(CardEditorContext);

    return <div>
        <h2>{set?.name}</h2>
        <CardEditGridSimple cards={cards} />
    </div>
}