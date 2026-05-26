import MagicCardLike from "@/interfaces/MagicCardLike";

export type CardDeck = {
  id: number;
  name: string;
  description: string;
  cards: CardDeckCard[];
  basicLands: Record<string, number>;
  packages: DeckPackage[];
};

export type CardDeckCard = {
  card: MagicCardLike;
  role: "commander" | "mainboard" | "sideboard" | "garbage_bin";
};

export type DeckPackage = {
  id: number;
  name: string;
  description: string;
  target?: number;
  cardIds: number[];
};
