import { CardSelectionContext } from "@/types/CardSelectionContext";
import RenderableMagicCardLike, { makeRenderable } from "@/interfaces/RenderableMagicCardLike";
import MagicCardLike, { newEmptyCard } from "@/interfaces/MagicCardLike";
import { flatMap, times } from "lodash"
import { CardSorting, sortCardType, sortChronological, sortChronologicalBack, sortName, sortPriceBack } from "@/enums/CardSorting";
import { getSetByCode } from "@/types/CardSet";

const isOfColor = (card: MagicCardLike) => (color: string) => {
    if (color === '-' && !card.colors.length) {
        return true
    }

    if (card.colors.includes(color)) {
        return true
    }

    return false
}

export async function allCardSelector(cards: MagicCardLike[], context: CardSelectionContext): Promise<RenderableMagicCardLike[]> {
    let selectedCards = Array.from(cards)

    if (context.set !== '') {
        selectedCards = selectedCards.filter(card => card.series === context.set)
    }

    if (context.colors.length) {
        const colors = context.colors
        selectedCards = selectedCards.filter(card => colors.every(isOfColor(card)))
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

    if (context.onlyOwned) {
        selectedCards = selectedCards.filter(card => card.amount_owned > 0)
    }
    
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
    }

    if (context.showDuplicates) {
        selectedCards = flatMap(selectedCards, (card: MagicCardLike) =>
            times(Math.min(100, card.amount_owned), () => card)
        );
    }

    if (!context.onlyOwned && context.set && context.sortingMethod === CardSorting.CHRONOLOGICAL) {
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

    return selectedCards.map(card => makeRenderable(card))
}

export async function allUniqueCardsIncludingPlaceholdersSelector(context: CardSelectionContext): Promise<RenderableMagicCardLike[]> {
    return []
}
