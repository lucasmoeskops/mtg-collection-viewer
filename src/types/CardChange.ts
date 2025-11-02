import { MTGCard } from "./MTGCard";

export type CardChange = {
    setId: string;
    collectorNumber: string;
    isFoil: boolean;
    newAmount: number;
};

export function fromCard(card: MTGCard, isFoil: boolean, newAmount: number): CardChange {
    return {
        setId: card.setId,
        collectorNumber: card.collectorNumber,
        isFoil,
        newAmount,
    };
}

export function getCardChangeHash(change: CardChange): string {
    return `${change.setId}-${change.collectorNumber}-${change.isFoil ? 'foil' : 'nonfoil'}`;
}