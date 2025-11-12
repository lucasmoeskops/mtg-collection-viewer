'use client';

import { CardEditorContext } from "@/context/CardEditorContextProvider";
import { useContext, useState } from "react";
import { FormControl, FormLabel, Input } from "@mui/material";
import { debounce } from "lodash";

export function QueryContextSetter() {
    const { query, setQuery } = useContext(CardEditorContext);
    const [value, setValue] = useState(query);

    const debouncedSetQuery = debounce(setQuery, 500);

    const handleChange = (newQuery: string) => {
        setValue(newQuery);
        debouncedSetQuery(newQuery);
    };

    return (
        <FormControl sx={{ m: 3, flexGrow: 1 }}>
            <FormLabel>Filter by query</FormLabel>
            <Input
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="supports Scryfall query syntax"
            />
        </FormControl>
    );
}