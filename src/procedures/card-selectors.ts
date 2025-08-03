import { CardSelectionContext } from "@/types/CardSelectionContext";
import RenderableMagicCardLike, { makeRenderable } from "@/interfaces/RenderableMagicCardLike";
import MagicCardLike, { newEmptyCard } from "@/interfaces/MagicCardLike";
import { flatMap, times } from "lodash"
import { artistSort, CardSorting, sortAvgNonFoilPrice, sortAvgPrice, sortByPriceDelta, sortCardType, sortChronological, sortChronologicalBack, sortManaCost, sortName, sortPriceBack } from "@/enums/CardSorting";
import { getSetByCode } from "@/types/CardSet";
import { RenderMode } from "@/enums/RenderMode";
import { RenderEffect } from "@/enums/RenderEffect";

export async function allCardSelector(cards: MagicCardLike[], context: CardSelectionContext): Promise<RenderableMagicCardLike[]> {
    let selectedCards = Array.from(cards)

    if (context.set !== '') {
        selectedCards = selectedCards.filter(card => card.series === context.set)
    }

    if (context.colors.length) {
        const colors = context.colors
        selectedCards = selectedCards.filter(card => card.colors.every(color => colors.includes(color)))
    }

    if (context.rarities.length) {
        const rarities = context.rarities
        selectedCards = selectedCards.filter(card => rarities.includes(card.rarity))
    }

    if (context.isFoil) {
        selectedCards = selectedCards.filter(card => card.is_foil)
    }

    if (context.isLegendary) {
        selectedCards = selectedCards.filter(card => card.card_type.includes('Legend'))
    }

    if (context.isToken) {
        selectedCards = selectedCards.filter(card => card.is_token)
    }

    if (context.releasedBefore?.releaseDate) {
        const date: Date = context.releasedBefore.releaseDate
        selectedCards = selectedCards.filter(card => card.release_date <= date)
    }

    if (context.releasedAfter?.releaseDate) {
        const date: Date = context.releasedAfter.releaseDate
        selectedCards = selectedCards.filter(card => card.release_date >= date)
    }

    if (context.nameQuery !== '') {
        const query = context.nameQuery.toLowerCase()
        selectedCards = selectedCards.filter(card => card.name.toLowerCase().includes(query))
    }

    if (context.typeQuery !== '') {
        const query = context.typeQuery.toLowerCase()
        selectedCards = selectedCards.filter(card => card.card_type.toLowerCase().includes(query))
    }

    if (context.artistQuery !== '') {
        const query = context.artistQuery.toLowerCase()
        selectedCards = selectedCards.filter(card => card.artist.toLowerCase().includes(query))
    }

    if (context.textQuery !== '') {
        const query = context.textQuery.toLowerCase()
        selectedCards = selectedCards.filter(card => card.text.toLowerCase().includes(query))
    }

    console.log(`Selected ${selectedCards.length} cards from ${cards.length} total.`)

    switch (context.sortingMethod) {
    case CardSorting.CARD_TYPE:
        selectedCards = selectedCards.sort(sortCardType)
        break
    case CardSorting.CHRONOLOGICAL:
        selectedCards = selectedCards.sort(sortChronological)
        break
    case CardSorting.CHRONOLOGICAL_BACK:
        selectedCards = selectedCards.sort(sortChronologicalBack)
        break
    case CardSorting.NAME:
        selectedCards = selectedCards.sort(sortName)
        break
    case CardSorting.PRICE_BACK:
        selectedCards = selectedCards.sort(sortPriceBack)
        break
    case CardSorting.AVG_PRICE:
        selectedCards = selectedCards.sort(sortAvgPrice)
        break
    case CardSorting.AVG_NON_FOIL_PRICE:
        selectedCards = selectedCards.sort(sortAvgNonFoilPrice)
        break
    case CardSorting.PRICE_DELTA:
        selectedCards = selectedCards.sort(sortByPriceDelta)
        break
    case CardSorting.MANA_COST:
        selectedCards = selectedCards.sort(sortManaCost)
        break
    case CardSorting.ARTIST:
        selectedCards = selectedCards.sort(artistSort)
        break
    default:
        throw new Error(`Unknown sorting method: ${context.sortingMethod}`)
    }

    if (context.showDuplicates) {
        selectedCards = flatMap(selectedCards, (card: MagicCardLike) =>
            times(Math.min(100, card.amount_owned), () => card)
        );
    }

    if (context.set && context.sortingMethod === CardSorting.CHRONOLOGICAL) {
        const cardSet = await getSetByCode(context.set)
        if (cardSet) {
            const outcards: MagicCardLike[] = []
            const emptyCard: MagicCardLike = newEmptyCard()
            let lastPosition = 0
            for (let i = 0; i < selectedCards.length; i++) {
                const expectedLast = selectedCards[i].cardnumber - 1
                while (lastPosition < expectedLast) {
                    outcards.push(emptyCard)
                    lastPosition += 1
                }
                if (lastPosition < selectedCards[i].cardnumber) {
                    outcards.push(selectedCards[i])
                    lastPosition += 1
                }
            }
            while (lastPosition < cardSet.numberOfCards) {
                outcards.push(emptyCard)
                lastPosition += 1
            }
    
            selectedCards = outcards
        }
    }

    return selectedCards.map(card => {
        const effects = card.is_foil ? [RenderEffect.FOIL] : []
        return makeRenderable(card, RenderMode.DEFAULT, effects)
    })
}

export function getTotalCardValue(cards: MagicCardLike[], context: CardSelectionContext): number {
    if (context.showDuplicates) {
        return cards.reduce((total, card) => total + card.price_estimate, 0)
    } else {
        return cards.reduce((total, card) => total + card.price_estimate * card.amount_owned, 0)
    }
}

export function getAverageTotalValue(cards: MagicCardLike[], context: CardSelectionContext): number {
    if (context.showDuplicates) {
        return cards.reduce((total, card) => total + card.avg_price, 0)
    } else {
        return cards.reduce((total, card) => total + card.avg_price * card.amount_owned, 0)
    }
}