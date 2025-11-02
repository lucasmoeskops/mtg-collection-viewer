export type CardOwnershipData = {
    setCode: string;
    collectorNumber: string;
    isFoil: boolean;
    amount: number;
}

export function getCardOwnershipCardHash(data: CardOwnershipData): string {
    return `${data.setCode}-${data.collectorNumber}-${data.isFoil ? 'foil' : 'nonfoil'}`;
}