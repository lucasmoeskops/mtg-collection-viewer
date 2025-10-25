export default interface MagicCardLike {
  id: number;
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
  artist: string;
  text: string;
  manacost: string;
  manacost_amount: number;
  avg_price: number; // Average price for the card, used for sorting and display
  avg_non_foil_price: number; // Average price for the card, used for sorting and display
  current_price_delta: number; // Optional, used for price change indicators
}

export function newEmptyCard(): MagicCardLike {
  return {
    id: 0,
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
    artist: '',
    text: '',
    manacost: '',
    price_estimate: 0,
    avg_price: 0,
    avg_non_foil_price: 0,
    current_price_delta: 0,
    manacost_amount: 0,
  }
}

export function parseManaCostAmount(manaCost: string): number {
  if (!manaCost) return 9999999999;

  const manaSymbols = manaCost.match(/\{[^\}]+\}/g);
  if (!manaSymbols) return 0;

  return manaSymbols.reduce((total, symbol) => {
    const amount = parseInt(symbol.replace(/[^\d]/g, ''), 10);
    return total + (isNaN(amount) ? 1 : amount);
  }, 0);
}