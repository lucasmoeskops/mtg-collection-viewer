export type DbMagicCardLike = {
  id: number;
  scryfall_id: string | null;
  name: string;
  series: string;
  colors: string[];
  rarity: string;
  cardnumber: string;
  card_type: string;
  image_url: string | null;
  is_foil: boolean;
  is_token: boolean;
  artist?: string;
  text?: string;
  manacost?: string;
  release_date: string;
  price_estimate: number;
};

export type DbBoundMagicCardLike = {
  card: DbMagicCardLike;
  amount: number;
  avg_price?: number;
  avg_non_foil_price?: number;
};

export function newDbBoundMagicCardLike(): DbBoundMagicCardLike {
  return {
    card: {
      id: 0,
      scryfall_id: null,
      name: "",
      series: "",
      colors: [],
      rarity: "",
      cardnumber: "0",
      card_type: "",
      image_url: null,
      is_foil: false,
      is_token: false,
      release_date: "",
      price_estimate: 0,
    },
    amount: 0,
  };
}
