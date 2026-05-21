import MagicCardLike from "@/interfaces/MagicCardLike";

export type CardDeck = {
  id: number;
  name: string;
  description: string;
  cards: CardDeckCard[];
  basicLands: Record<string, number>;
};

export type CardDeckCard = {
  card: MagicCardLike;
  role: "commander" | "mainboard" | "sideboard";
};