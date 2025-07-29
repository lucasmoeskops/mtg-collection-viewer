import { CardSorting } from "@/enums/CardSorting"
import { Price } from "@/components/Price/Price"
import { newViewMode, ViewMode } from "@/types/ViewMode"
import { SetSorting } from "@/enums/SetSorting"
import { Box, Typography } from "@mui/material"

export const views: ViewMode[] = [
    newViewMode({
        id: "browse",
        label: "Browse Mode",
        title: "Browse Mode",
        description: "In this view all owned cards are shown, starting with the most recent cards",
        sortModes: [CardSorting.CHRONOLOGICAL_BACK, CardSorting.CARD_TYPE, CardSorting.NAME, CardSorting.AVG_NON_FOIL_PRICE],
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
        id: "merchant",
        label: "Merchant Mode",
        title: "Merchant Mode",
        description: "In this view cards are ordered by their price value. Duplicate cards are also shown",
        sortModes: [CardSorting.PRICE_BACK, CardSorting.NAME, CardSorting.AVG_PRICE, CardSorting.AVG_NON_FOIL_PRICE, CardSorting.PRICE_DELTA],
        baseContext: {
            showDuplicates: true,
            onlyOwned: true,
            sortingMethod: CardSorting.AVG_PRICE,
        },
        setSortingMethod: SetSorting.NAME,
        getCardInfo: (card) => <><Price priceEstimate={card.price_estimate} />{card.is_foil ? <>, Foil</> : null} {card.current_price_delta ? <span style={{ color: card.current_price_delta ? (card.current_price_delta > 0 ? 'green' : 'red') : 'inherit' }}>(<Price priceEstimate={card.current_price_delta ?? 0} />)</span> : null}</>,
        statistics: (cards) => <Box sx={{p: 2}}>
            <div>Total cards selected: {cards.map(card => card.amount_owned).reduce((acc, n) => acc + n, 0)}</div>
            <div>Total card value: <Price priceEstimate={cards.map(card => card.price_estimate).reduce((acc, n) => acc + n, 0)} /></div>
        </Box>
    }),
    newViewMode({
        id: "collection",
        label: "Collection Mode",
        title: "Collection Mode",
        description: "In this view all magic cards are shown, but the cards that are not owned are fainted.",
        sortModes: [CardSorting.CHRONOLOGICAL],
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
