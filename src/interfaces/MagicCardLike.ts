export default interface MagicCardLike {
  name: string;
  series: string;
  colors: string[];
  rarity: string;
  cardnumber: number;
  card_type: string;
  image_url: string;
  amount_owned: number;
  is_foil: boolean;
  is_token: boolean;
  release_date: Date;
  price_estimate: number;
}

export function newEmptyCard(): MagicCardLike {
  return {
    name: '?',
    series: '?',
    colors: [],
    rarity: 'unknown',
    cardnumber: 0,
    card_type: '',
    image_url: '/mtg-card-back.webp',
    amount_owned: 0,
    is_foil: false,
    is_token: false,
    release_date: new Date(),
    price_estimate: 0
  }
}