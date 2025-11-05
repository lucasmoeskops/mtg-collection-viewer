'use client';


import { ChangeEvent, ReactNode, useContext, useMemo, useState } from "react"
import { CardSelectionContextContext } from "@/context/CardContextProvider";
import { Autocomplete, Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel, MenuItem, Select, SelectChangeEvent, TextField } from '@mui/material';
import { CardSelectionContext } from "@/types/CardSelectionContext";
import { ViewModeContext } from "@/context/ViewModeContextProvider";
import { debounce } from "lodash";
import { apply, SetSorting } from "@/enums/SetSorting";
import { CardSortingLabels, sortingMethodFromKey, sortingMethodToKey } from "@/enums/CardSorting";

export default function Filters({}): ReactNode {
    const { viewMode: { showColorFilter, showDateFilter, showLegendaryFilter, showRarityFilter, showSetCompletions, showTokenFilter, sortModes } } = useContext(ViewModeContext)
    const { sets, colors, rarities, context: { set, colors: activeColors, rarities: activeRarities, isFoil, isLegendary, isToken, nameQuery, textQuery, typeQuery, artistQuery, releasedAfter, releasedBefore, sortingMethod }, setContext } = useContext(CardSelectionContextContext)
    const setsNewToOld = useMemo(() => apply(SetSorting.CHRONOLOGICAL_BACK, [...sets]), [sets])
    const [currentNameQuery, setCurrentNameQuery] = useState(nameQuery);
    const [currentTypeQuery, setCurrentTypeQuery] = useState(typeQuery);
    const [currentTextQuery, setCurrentTextQuery] = useState(textQuery);
    const [currentArtistQuery, setCurrentArtistQuery] = useState(artistQuery);

    function contextUpdaterForInput<T extends ChangeEvent<HTMLInputElement>>(setter: React.Dispatch<React.SetStateAction<string>> | undefined, key: string, targetProp: "checked" | "value") {
        return (evt: T) => {
            const value = evt.target[targetProp] as string;
            if (setter) setter(value);
            // Throttle the update to avoid too many re-renders
            debounce(() => setContext((ctx: CardSelectionContext) => ({...ctx, [key]: value})), 200)();
        }
    }

    function colorToggler<T extends ChangeEvent<HTMLInputElement>>(key: string) {
        return (evt: T) => setContext((ctx: CardSelectionContext) => {
            const value = evt.target.checked
            const newColors = [...ctx.colors]
            if (value) {
                if (!newColors.includes(key)) {
                    newColors.push(key)
                }
            } else if (newColors.includes(key)) {
                newColors.splice(newColors.indexOf(key), 1)
            }
            return {...ctx, colors: newColors}
        })
    }

    function rarityToggler<T extends ChangeEvent<HTMLInputElement>>(key: string) {
        return (evt: T) => setContext((ctx: CardSelectionContext) => {
            const value = evt.target.checked
            const newRarities = [...ctx.rarities]
            if (value) {
                if (!newRarities.includes(key)) {
                    newRarities.push(key)
                }
            } else if (newRarities.includes(key)) {
                newRarities.splice(newRarities.indexOf(key), 1)
            }
            return {...ctx, rarities: newRarities}
        })
    }

    function setReleasedAfterFromSet(event: SelectChangeEvent) {
        setContext((ctx: CardSelectionContext) => {
            return {
                ...ctx,
                releasedAfter: setsNewToOld.find(s => s.code === event.target.value) || null,
            }
        })
    }

    function setReleasedBeforeFromSet(event: SelectChangeEvent) {
        setContext((ctx: CardSelectionContext) => {
            return {
                ...ctx,
                releasedBefore: setsNewToOld.find(s => s.code === event.target.value) || null,
            }
        })
    }

    function updateSortMethod(event: SelectChangeEvent) {
        setContext((ctx: CardSelectionContext) => ({...ctx, sortingMethod: sortingMethodFromKey(event.target.value) || sortModes[0]}))
    }

    const setOptions = useMemo(() => {
        return sets.map(({ code, name, completionRatio, numberOfCardsOwned, numberOfCards }) => {
            let label;
            if (showSetCompletions) {
                label = `${name} (${Math.round(completionRatio * 100)}%, ${numberOfCardsOwned}/${numberOfCards})`;
            } else {
                label = name;
            }
            return {
                label,
                value: code,
            };
        });
    }, [sets, showSetCompletions]);

    return <div>
        <FormControl sx={{ m: 3 }}>
            <FormLabel>Set</FormLabel>
            <Autocomplete
                options={setOptions}
                sx={{ minWidth: 350 }}
                getOptionLabel={(option) => option.label}
                onChange={(event, newValue) => {
                    if (newValue) {
                        setContext(ctx => ({...ctx, set: newValue.value}));
                    } else {
                        setContext(ctx => ({...ctx, set: ''}));
                    }
                }}
                renderInput={(params) => <TextField {...params} variant="outlined" />}
            />
        </FormControl>
        <FormControl sx={{ m: 3 }}>
            <FormLabel>Special</FormLabel>
            <FormGroup row={true}>
                <FormControlLabel label="Foil" control={<Checkbox checked={isFoil} onChange={contextUpdaterForInput(undefined, 'isFoil', 'checked')} />} />
                {showLegendaryFilter && <FormControlLabel label="Legend" control={<Checkbox checked={isLegendary} onChange={contextUpdaterForInput(undefined, 'isLegendary', 'checked')} />} />}
                {showTokenFilter && <FormControlLabel label="Token" control={<Checkbox checked={isToken} onChange={contextUpdaterForInput(undefined, 'isToken', 'checked')} />} />}
            </FormGroup>
        </FormControl>
        {showColorFilter && (
            <FormControl sx={{ m: 3 }}>
                <FormLabel>Colors</FormLabel>
                <FormGroup row={true}>
                    {colors.map(({ name }, index) => (
                        <FormControlLabel label={name} key={index} control={<Checkbox checked={activeColors.includes(name)} onChange={colorToggler(name)} />} />
                    ))}
                </FormGroup>
            </FormControl>
        )}
        {showRarityFilter && <FormControl sx={{ m: 3 }}>
            <FormLabel>Rarity</FormLabel>
            <FormGroup row={true}>
                {rarities.map(({ name }, index) => (
                    <FormControlLabel label={name} key={index} control={<Checkbox checked={activeRarities.includes(name)} onChange={rarityToggler(name)} />} />
                ))}
            </FormGroup>
        </FormControl>}
        <FormControl sx={{ m: 3 }}>
            <FormLabel>Name</FormLabel>
            <TextField label="Query" variant="outlined" value={currentNameQuery} onChange={contextUpdaterForInput(setCurrentNameQuery, 'nameQuery', 'value')} />
        </FormControl>
        <FormControl sx={{ m: 3 }}>
            <FormLabel>Card type</FormLabel>
            <TextField label="Query" variant="outlined" value={currentTypeQuery} onChange={contextUpdaterForInput(setCurrentTypeQuery, 'typeQuery', 'value')} />
        </FormControl>
        <FormControl sx={{ m: 3 }}>
            <FormLabel>Text</FormLabel>
            <TextField label="Query" variant="outlined" value={currentTextQuery} onChange={contextUpdaterForInput(setCurrentTextQuery, 'textQuery', 'value')} />
        </FormControl>
        <FormControl sx={{ m: 3 }}>
            <FormLabel>Artist</FormLabel>
            <TextField label="Query" variant="outlined" value={currentArtistQuery} onChange={contextUpdaterForInput(setCurrentArtistQuery, 'artistQuery', 'value')} />
        </FormControl>
        {showDateFilter && <><FormControl sx={{ m: 3 }}>
            <FormLabel>Release date from</FormLabel>
            <Select value={releasedAfter?.code || ''} onChange={setReleasedAfterFromSet}>
                <MenuItem value={''} selected={releasedAfter === null}>(None)</MenuItem>
                {setsNewToOld.map(({ code, name, releaseDate }, index) => <MenuItem key={index} value={code}>
                    {name} ({releaseDate.toLocaleDateString()})
                </MenuItem>)}
            </Select>
        </FormControl>
        <FormControl sx={{ m: 3 }}>
            <FormLabel>Release date until</FormLabel>
            <Select value={releasedBefore?.code || ''} onChange={setReleasedBeforeFromSet}>
                <MenuItem value={''} selected={releasedBefore === null}>(None)</MenuItem>
                {setsNewToOld.map(({ code, name, releaseDate }, index) => <MenuItem key={index} value={code}>
                    {name} ({releaseDate.toLocaleDateString()})
                </MenuItem>)}
            </Select>
        </FormControl></>}
        {sortModes.length > 1 && <FormControl sx={{ m: 3 }}>
            <FormLabel>Sort by</FormLabel>
            <Select value={sortingMethodToKey(sortingMethod)} onChange={updateSortMethod}>
                {sortModes.map((mode, index) => <MenuItem key={index} value={sortingMethodToKey(mode)}>{CardSortingLabels[mode]}</MenuItem>)}
            </Select>
        </FormControl>}
    </div>
}