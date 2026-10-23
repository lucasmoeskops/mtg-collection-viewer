export type DeckHistoryEntry = {
  id: number;
  cardId: number | null;
  cardName: string | null;
  fromRole: string | null;
  toRole: string | null;
  actionType: string;
  fromQuantity: number | null;
  toQuantity: number | null;
  createdAt: string;
};
