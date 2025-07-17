'use client';


import { ReactNode, useContext } from "react"
import { CardSelectionContextContext } from "@/context/CardContextProvider";
import { Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel, MenuItem, Select, Stack, TextField } from '@mui/material';
import { CardSelectionContext } from "@/types/CardSelectionContext";
import { ViewModeContext } from "@/context/ViewModeContextProvider";
import { throttle } from "lodash";

export default function Filters({}): ReactNode {
    const { viewMode: { showColorFilter, showLegendaryFilter, showRarityFilter, showSetCompletions, showTokenFilter } } = useContext(ViewModeContext)
    const { sets, colors, rarities, context: { set, colors: activeColors, rarities: activeRarities, isFoil, isLegendary, isToken, nameQuery, typeQuery }, setContext } = useContext(CardSelectionContextContext)

    function contextUpdater(key: string, targetProp: string) {
        return evt => setContext((ctx: CardSelectionContext) => ({...ctx, [key]: evt.target[targetProp]}))
    }

    function colorToggler(key: string, targetProp: string) {
        return evt => setContext((ctx: CardSelectionContext) => {
            const current: string[] = ctx.colors
            const value = evt.target[targetProp]
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

    function rarityToggler(key: string, targetProp: string) {
        return evt => setContext((ctx: CardSelectionContext) => {
            const current: string[] = ctx.rarities
            const value = evt.target[targetProp]
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

    return <div>
        <FormControl sx={{ m: 3 }}>
            <FormLabel>Set</FormLabel>
            <Select value={set} onChange={contextUpdater('set', 'value')}>
                <MenuItem value={''} selected={set === ''}>(All sets)</MenuItem>
                {sets.map(({ code, name, completionRatio, numberOfCardsOwned, numberOfCards }, index) => <MenuItem key={index} value={code}>
                    {showSetCompletions ? `${name} (${Math.round(completionRatio * 100)}%, ${numberOfCardsOwned}/${numberOfCards})` : name}
                </MenuItem>)}
            </Select>
        </FormControl>
        <FormControl sx={{ m: 3 }}>
            <FormLabel>Special</FormLabel>
            <FormGroup row={true}>
                <FormControlLabel label="Is foil" control={<Checkbox checked={isFoil} onChange={contextUpdater('isFoil', 'checked')} />} />
                {showLegendaryFilter && <FormControlLabel label="Is legend" control={<Checkbox checked={isLegendary} onChange={contextUpdater('isLegendary', 'checked')} />} />}
                {showTokenFilter && <FormControlLabel label="Is token" control={<Checkbox checked={isToken} onChange={contextUpdater('isToken', 'checked')} />} />}
            </FormGroup>
        </FormControl>
        {showColorFilter && (
            <FormControl sx={{ m: 3 }}>
                <FormLabel>Colors</FormLabel>
                <FormGroup row={true}>
                    {colors.map(({ name }, index) => (
                        <FormControlLabel label={name} key={index} control={<Checkbox checked={activeColors.includes(name)} onChange={colorToggler(name, 'checked')} />} />
                    ))}
                </FormGroup>
            </FormControl>
        )}
        {showRarityFilter && <FormControl sx={{ m: 3 }}>
            <FormLabel>Rarity</FormLabel>
            <FormGroup row={true}>
                {rarities.map(({ name }, index) => (
                    <FormControlLabel label={name} key={index} control={<Checkbox checked={activeRarities.includes(name)} onChange={rarityToggler(name, 'checked')} />} />
                ))}
            </FormGroup>
        </FormControl>}
        <FormControl sx={{ m: 3 }}>
            <FormLabel>Name</FormLabel>
            <TextField label="Query" variant="outlined" value={nameQuery} onChange={throttle(contextUpdater('nameQuery', 'value'), 200)} />
        </FormControl>
        <FormControl sx={{ m: 3 }}>
            <FormLabel>Card type</FormLabel>
            <TextField label="Query" variant="outlined" value={typeQuery} onChange={throttle(contextUpdater('typeQuery', 'value'), 400)} />
        </FormControl>
    </div>
}