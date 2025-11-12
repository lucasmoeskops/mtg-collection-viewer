import { CardSorting } from "@/enums/CardSorting"
import { Price } from "@/components/Price/Price"
import { newViewMode, ViewMode } from "@/types/ViewMode"
import { SetSorting } from "@/enums/SetSorting"
import { Typography } from "@mui/material"
import { PriceDelta } from "@/components/PriceDelta/PriceDelta"
import { getAverageTotalValue, getTotalCardValue } from "@/procedures/card-selectors"
import MagicCardLike from "@/interfaces/MagicCardLike"
import { CardSelectionContext } from "@/types/CardSelectionContext"
import { ViewModes } from "@/types/ViewModes"

export const Browse: ViewMode = newViewMode({
    id: ViewModes.BROWSE,
    label: "Browse Mode",
    title: "Browse Mode",
    description: "In this view all owned cards are shown, starting with the most recent cards",
    sortModes: [CardSorting.CHRONOLOGICAL_BACK, CardSorting.CARD_TYPE, CardSorting.NAME, CardSorting.AVG_NON_FOIL_PRICE, CardSorting.MANA_COST, CardSorting.ARTIST],
    baseContext: {
        showDuplicates: false,
        sortingMethod: CardSorting.NAME,
    },
    getCardInfo: (card) => <>
        {card.amount_owned > 1 ? `${card.amount_owned} copies` : ''}
        {card.amount_owned > 1 && card.is_foil && ', '}
        {card.is_foil ? <>Foil</> : null}
    </>,
    statistics: (cards) => <Typography>Total cards selected: {cards.length}</Typography>
})

export const Merchant: ViewMode = newViewMode({
    id: ViewModes.MERCHANT,
    label: "Merchant Mode",
    title: "Merchant Mode",
    description: "In this view cards are ordered by their price value. Duplicate cards are also shown",
    sortModes: [CardSorting.PRICE_BACK, CardSorting.NAME, CardSorting.ARTIST, CardSorting.AVG_PRICE, CardSorting.AVG_NON_FOIL_PRICE, CardSorting.PRICE_DELTA],
    baseContext: {
        showDuplicates: true,
        sortingMethod: CardSorting.AVG_PRICE,
    },
    setSortingMethod: SetSorting.NAME,
    getCardInfo: (card) => <><Price label="Card price" priceEstimate={card.price_estimate} />{card.is_foil ? <>, Foil</> : null}, <PriceDelta label="Price change since july 2025" price={card.price_estimate} avgPrice={card.avg_price} history={{ cardId: card.id, cardName: card.name }} /></>,
    statistics: (cards: MagicCardLike[], context: CardSelectionContext) => <>
        <div>Total cards selected: {cards.length}</div>
        <div>Total card value: <Price label="Total card value" priceEstimate={getTotalCardValue(cards, context)} />, <PriceDelta label="Total card value change since july 2025" price={getTotalCardValue(cards, context)} avgPrice={getAverageTotalValue(cards, context)} /></div>
    </>
})

export const Collection: ViewMode = newViewMode({
    id: ViewModes.COLLECTION,
    label: "Collection Mode",
    title: "Collection Mode",
    description: "In this view all magic cards are shown, but the cards that are not owned are fainted.",
    sortModes: [CardSorting.CHRONOLOGICAL],
    baseContext: {
        showDuplicates: false,
        sortingMethod: CardSorting.CHRONOLOGICAL,
    },
    setSortingMethod: SetSorting.COMPLETION_BACK,
    showSetCompletions: true,
    showColorFilter: false,
    showDateFilter: false,
    showLegendaryFilter: false,
    showRarityFilter: false,
    showTokenFilter: false,
})

export const views: ViewMode[] = [
    Browse,
    Merchant,
    Collection,
]

export function getViewModeById(id: ViewModes): ViewMode {
    switch (id) {
        case ViewModes.BROWSE:
            return Browse
        case ViewModes.MERCHANT:
            return Merchant
        case ViewModes.COLLECTION:
            return Collection
        default:
            return Browse
    }
}