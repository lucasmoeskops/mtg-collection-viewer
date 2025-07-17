import { CardSorting } from "@/enums/CardSorting"
import { Price } from "@/components/Price/Price"
import { newViewMode, ViewMode } from "@/types/ViewMode"
import { SetSorting } from "@/enums/SetSorting"
import { Box, Typography } from "@mui/material"

export const views: ViewMode[] = [
    newViewMode({
        label: "Browse Mode",
        title: "Browse Mode",
        description: "In this view all owned cards are shown, starting with the most recent cards",
        baseContext: {
            showDuplicates: false,
            onlyOwned: true,
            sortingMethod: CardSorting.NAME,
        },
        getCardInfo: (card) => <>
            {card.amount_owned > 1 ? `${card.amount_owned} copies` : ''}
            {card.amount_owned > 1 && card.is_foil && ', '}
            {card.is_foil ? <>Foil</> : null}
        </>,
        statistics: (cards) => <Box sx={{p: 2}}>
            <Typography>Total cards selected: {cards.length}</Typography>
        </Box>
    }),
    newViewMode({
        label: "Merchant Mode",
        title: "Merchant Mode",
        description: "In this view cards are ordered by their price value. Duplicate cards are also shown",
        baseContext: {
            showDuplicates: true,
            onlyOwned: true,
            sortingMethod: CardSorting.PRICE_BACK,
        },
        setSortingMethod: SetSorting.NAME,
        getCardInfo: (card) => <><Price priceEstimate={card.price_estimate} />{card.is_foil ? <>, Foil</> : null}</>,
        statistics: (cards) => <Box sx={{p: 2}}>
            <div>Total cards selected: {cards.map(card => card.amount_owned).reduce((acc, n) => acc + n, 0)}</div>
            <div>Total card value: <Price priceEstimate={cards.map(card => card.price_estimate).reduce((acc, n) => acc + n, 0)} /></div>
        </Box>
    }),
    newViewMode({
        label: "Collection Mode",
        title: "Collection Mode",
        description: "In this view all magic cards are shown, but the cards that are not owned are fainted.",
        baseContext: {
            showDuplicates: false,
            onlyOwned: false,
            sortingMethod: CardSorting.CHRONOLOGICAL,
        },
        setSortingMethod: SetSorting.COMPLETION_BACK,
        showSetCompletions: true,
        showColorFilter: false,
        showRarityFilter: false,
        showTokenFilter: false,
    }),
]
