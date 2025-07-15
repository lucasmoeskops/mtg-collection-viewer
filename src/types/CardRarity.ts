import MagicCardLike from "@/interfaces/MagicCardLike";

export type CardRarity = {
    name: string,
}

export function getRarities(cards: MagicCardLike[]): CardRarity[] {
    const rarities: string[] = []
    for (const card of cards) {
        if (!rarities.includes(card.rarity)) {
            rarities.push(card.rarity)
        }
    }
    return rarities.map(rarity => ({ name: rarity }))
}