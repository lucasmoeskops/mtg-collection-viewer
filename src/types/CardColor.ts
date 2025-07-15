import MagicCardLike from "@/interfaces/MagicCardLike";

export type CardColor = {
    name: string,
}

export function getColors(cards: MagicCardLike[]): CardColor[] {
    const colors: string[] = []
    for (const card of cards) {
        for (const color of card.colors) {
            if (!colors.includes(color)) {
                colors.push(color)
            }
        }
    }
    colors.push('-')
    return colors.map(color => ({ name: color }))
}