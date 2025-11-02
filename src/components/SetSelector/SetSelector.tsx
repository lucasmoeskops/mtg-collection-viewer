'use client';

import { CardSet, fetchSets } from "@/types/CardSet";
import { FormControl, FormLabel, MenuItem, Select } from "@mui/material";
import Image from "next/image";
import { useEffect, useState } from "react";

type SetSelectorProps = {
    onSetChange: (set: CardSet | null) => void;
};

export function SetSelector({ onSetChange }: SetSelectorProps) {
    const [sets, setSets] = useState<CardSet[]>([]);
    const [set, setSet] = useState<CardSet | null>(null);

    useEffect(() => {
        onSetChange(set);
    }, [set, onSetChange]);

    useEffect(() => {
        async function loadSets() {
            const sets = await fetchSets();
            setSets(sets);
        }
        loadSets();
    }, []);

    return (
        <FormControl sx={{ m: 3 }}>
            <FormLabel>Filter by set</FormLabel>
            <Select value={set?.code || ''} onChange={(event) => setSet(sets.find(s => s.code === event.target.value) || null)}>
                {sets.map(({ code, name, iconSvgUri, releaseDate }, index) => <MenuItem key={index} value={code}>
                    <Image src={iconSvgUri} alt={code} height="16" width="16" style={{ height: '1em', verticalAlign: 'middle', marginRight: '0.5em' }} /> {name} ({releaseDate.getFullYear()})
                </MenuItem>)}
            </Select>
        </FormControl>
    );
}