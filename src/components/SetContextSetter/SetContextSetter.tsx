'use client';

import { CardEditorContext } from "@/context/CardEditorContextProvider";
import { useContext } from "react";
import { SetSelector } from "../SetSelector/SetSelector";

export function SetContextSetter() {
    const { setSet } = useContext(CardEditorContext);

    return <SetSelector onSetChange={setSet} />;
}