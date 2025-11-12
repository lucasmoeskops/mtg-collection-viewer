'use client';

import { Stack } from "@mui/material";
import { SetContextSetter } from "../SetContextSetter/SetContextSetter";
import { CardContextSetter } from "../CardContextSetter/CardContextSetter";
import { useContext, useEffect } from "react";
import { AccountContext } from "@/context/AccountContextProvider";
import { QueryContextSetter } from "../QueryContextSetter/QueryContextSetter";

export default function Editor() {
    const { setCardDataNeeded } = useContext(AccountContext);

    useEffect(() => {
        setCardDataNeeded(false);
    }, [setCardDataNeeded]);

    return (
        <Stack direction="column" spacing={2} alignItems="bottom" justifyContent="flex-start">
            <p>Depending on the size of the query results, loading the data can take a few seconds. At most 500 results will be loaded.</p>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                <SetContextSetter />
                <QueryContextSetter />
            </Stack>
            <CardContextSetter />
        </Stack>
    )
}