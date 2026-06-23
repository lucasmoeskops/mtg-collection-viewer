export type DeckHistoryEntry = {
  id: number;
  cardId: number | null;
  cardName: string | null;
  fromRole: string | null;
  toRole: string | null;
  createdAt: string;
};
