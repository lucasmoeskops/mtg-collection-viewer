'use client';


import { ChangeEvent, ReactNode, useContext, useMemo } from "react"
import { CardSelectionContextContext } from "@/context/CardContextProvider";
import { Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel, MenuItem, Select, SelectChangeEvent, TextField } from '@mui/material';
import { CardSelectionContext } from "@/types/CardSelectionContext";
import { ViewModeContext } from "@/context/ViewModeContextProvider";
import { throttle } from "lodash";
import { apply, SetSorting } from "@/enums/SetSorting";

export default function Filters({}): ReactNode {
    const { viewMode: { showColorFilter, showLegendaryFilter, showRarityFilter, showSetCompletions, showTokenFilter } } = useContext(ViewModeContext)
    const { sets, colors, rarities, context: { set, colors: activeColors, rarities: activeRarities, isFoil, isLegendary, isToken, nameQuery, typeQuery, releasedAfter, releasedBefore }, setContext } = useContext(CardSelectionContextContext)
    const setsNewToOld = useMemo(() => apply(SetSorting.CHRONOLOGICAL_BACK, [...sets]), [sets])

    function contextUpdaterForInput<T extends ChangeEvent<HTMLInputElement>>(key: string, targetProp: "checked" | "value") {
        return (evt: T) => setContext((ctx: CardSelectionContext) => ({...ctx, [key]: evt.target[targetProp]}))
    }

    function contextUpdaterForSelect<T extends SelectChangeEvent>(key: string) {
        return (evt: T) => setContext((ctx: CardSelectionContext) => ({...ctx, [key]: evt.target.value}))
    }

    function colorToggler<T extends ChangeEvent<HTMLInputElement>>(key: string) {
        return (evt: T) => setContext((ctx: CardSelectionContext) => {
            const current: string[] = ctx.colors
            const value = evt.target.checked
            if (value) {
                if (!current.includes(key)) {
                    current.push(key)
                }
            } else if (current.includes(key)) {
                current.splice(current.indexOf(key), 1)
            }
            return {...ctx}
        })
    }

    function rarityToggler<T extends ChangeEvent<HTMLInputElement>>(key: string) {
        return (evt: T) => setContext((ctx: CardSelectionContext) => {
            const current: string[] = ctx.rarities
            const value = evt.target.checked
            if (value) {
                if (!current.includes(key)) {
                    current.push(key)
                }
            } else if (current.includes(key)) {
                current.splice(current.indexOf(key), 1)
            }
            return {...ctx}
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

    return <div>
        <FormControl sx={{ m: 3 }}>
            <FormLabel>Set</FormLabel>
            <Select value={set} onChange={contextUpdaterForSelect('set')}>
                <MenuItem value={''} selected={set === ''}>(All sets)</MenuItem>
                {sets.map(({ code, name, completionRatio, numberOfCardsOwned, numberOfCards }, index) => <MenuItem key={index} value={code}>
                    {showSetCompletions ? `${name} (${Math.round(completionRatio * 100)}%, ${numberOfCardsOwned}/${numberOfCards})` : name}
                </MenuItem>)}
            </Select>
        </FormControl>
        <FormControl sx={{ m: 3 }}>
            <FormLabel>Special</FormLabel>
            <FormGroup row={true}>
                <FormControlLabel label="Is foil" control={<Checkbox checked={isFoil} onChange={contextUpdaterForInput('isFoil', 'checked')} />} />
                {showLegendaryFilter && <FormControlLabel label="Is legend" control={<Checkbox checked={isLegendary} onChange={contextUpdaterForInput('isLegendary', 'checked')} />} />}
                {showTokenFilter && <FormControlLabel label="Is token" control={<Checkbox checked={isToken} onChange={contextUpdaterForInput('isToken', 'checked')} />} />}
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
            <TextField label="Query" variant="outlined" value={nameQuery} onChange={throttle(contextUpdaterForInput('nameQuery', 'value'), 200)} />
        </FormControl>
        <FormControl sx={{ m: 3 }}>
            <FormLabel>Card type</FormLabel>
            <TextField label="Query" variant="outlined" value={typeQuery} onChange={throttle(contextUpdaterForInput('typeQuery', 'value'), 400)} />
        </FormControl>
        <FormControl sx={{ m: 3 }}>
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
        </FormControl>
    </div>
}