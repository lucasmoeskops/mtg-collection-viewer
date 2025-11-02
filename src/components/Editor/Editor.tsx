'use client';

import { Stack } from "@mui/material";
import { SetContextSetter } from "../SetContextSetter/SetContextSetter";
import { CardContextSetter } from "../CardContextSetter/CardContextSetter";
import { useContext, useEffect } from "react";
import { AccountContext } from "@/context/AccountContextProvider";

export default function Editor() {
    const { setCardDataNeeded } = useContext(AccountContext);

    useEffect(() => {
        setCardDataNeeded(false);
    }, [setCardDataNeeded]);

    return (
        <Stack direction="column" spacing={2} alignItems="bottom" justifyContent="flex-start">
            <p>Collections are edited by set. Please first select a set to work on. Loading of set data can take a few seconds.</p>
            <SetContextSetter />
            <CardContextSetter />
        </Stack>
    )
}