import MagicCardLike from "@/interfaces/MagicCardLike";

export type CardDeck = {
  id: number;
  name: string;
  description: string;
  cover_image_url?: string;
  cards: CardDeckCard[];
};

export type CardDeckCard = {
  card: MagicCardLike;
  role: string;
};