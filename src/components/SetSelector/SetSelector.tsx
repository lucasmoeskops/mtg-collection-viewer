'use client';

import { CardSet, fetchSets, setDateSort } from "@/types/CardSet";
import { Autocomplete, FormControl, FormLabel, TextField } from "@mui/material";
import { useEffect, useMemo, useState } from "react";

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

    const setOptions = useMemo(() => {
        return sets.sort(setDateSort).map(s => ({
            label: `${s.name} (${s.releaseDate.getFullYear()})`,
            value: s.code,
        }));
    }, [sets]);

    return (
        <FormControl sx={{ m: 3 }}>
            <FormLabel>Filter by set</FormLabel>
            <Autocomplete
                options={setOptions}
                getOptionLabel={(option) => option.label}
                onChange={(event, newValue) => {
                    setSet(newValue ? sets.find(s => s.code === newValue.value) || null : null);
                }}
                renderInput={(params) => <TextField {...params} variant="outlined" />}
            />
        </FormControl>
    );
}
//                 options={countries}
//             <Select value={set?.code || ''} onChange={(event) => setSet(sets.find(s => s.code === event.target.value) || null)}>
//                 {sets.map(({ code, name, iconSvgUri, releaseDate }, index) => <MenuItem key={index} value={code}>
//                     <Image src={iconSvgUri} alt={code} height="16" width="16" style={{ height: '1em', verticalAlign: 'middle', marginRight: '0.5em' }} /> {name} ({releaseDate.getFullYear()})
//                 </MenuItem>)}
//             </Select>
//         </FormControl>
//     );
// }