import { cardsSearchEndpoint, fetchDataPaginated, ScryFallCard } from "@/scryfall/utils";
import { SupabaseBoundMagicCardLike } from "@/supabase/utils";

export default interface MagicCardLike {
  id: number;
  name: string;
  series: string;
  colors: string[];
  rarity: string;
  cardnumber: number;
  card_type: string;
  image_url: string;
  art_crop_url: string;
  amount_owned: number;
  is_foil: boolean;
  is_token: boolean;
  release_date: Date;
  price_estimate: number;
  artist: string;
  text: string;
  manacost: string;
  manacost_amount: number;
  cardmarket_url: string;
  avg_price: number; // Average price for the card, used for sorting and display
  avg_non_foil_price: number; // Average price for the card, used for sorting and display
  current_price_delta: number; // Optional, used for price change indicators
}

export function newEmptyCard(updates: Partial<MagicCardLike> = {}): MagicCardLike {
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
    art_crop_url: '/mtg-card-back.webp',
    cardmarket_url: '',
    ...updates,
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


const cache = {
    byHash: new Map<string, MagicCardLike>()
}

export function getCardHash(card: MagicCardLike, isFoil: boolean): string {
    return `${card.series}-${card.cardnumber}-${isFoil ? 'foil' : 'nonfoil'}`;
}

export async function getCard(setId: string, cardNumber: string): Promise<MagicCardLike | null> {
    const hash = getCardHash({ series: setId, cardnumber: parseInt(cardNumber) } as MagicCardLike, false);
    const cached = cache.byHash.get(hash);
    if (cached) {
        return cached;
    }
    return _getCard(setId, cardNumber);
}

async function _getCard(setId: string, cardNumber: string): Promise<MagicCardLike | null> {
    const params = {
        order: 'set',
        q: `e:${setId} cn:${cardNumber}`,
        unique: 'prints',
        
    };
    const scryfallCards = await fetchDataPaginated<ScryFallCard>(cardsSearchEndpoint, params);
    if (!scryfallCards.length) {
        return null;
    }
    const firstCard = scryfallCards[0];
    const card = {
        ...newEmptyCard(),
        name: firstCard.name,
        setId: firstCard.set,
        series: firstCard.set_name,
        collectorNumber: firstCard.collector_number,
        imageUrl: firstCard.image_uris?.normal || firstCard.card_faces?.[0]?.image_uris?.normal || '',
        color: firstCard.color_identity?.join('') || 'C',
        rarity: firstCard.rarity,
        art_crop_url: firstCard.image_uris?.art_crop || firstCard.card_faces?.[0]?.image_uris?.art_crop || '',
        artist: firstCard.artist || '',
        cardmarket_url: firstCard.purchase_uris?.cardmarket || '',
    };
    const hash = getCardHash({ series: setId, cardnumber: parseInt(cardNumber) } as MagicCardLike, false);
    cache.byHash.set(hash, card);
    return card;
}

export function fromSupabaseCard(card: SupabaseBoundMagicCardLike): MagicCardLike {
    const cardData = card.card;
    return {
        id: cardData.id,
        series: cardData.series,
        cardnumber: cardData.cardnumber,
        card_type: cardData.card_type,
        name: cardData.name,
        image_url: cardData.image_url || '',
        art_crop_url: '', // Supabase does not store art crop URL
        amount_owned: card.amount,
        is_foil: cardData.is_foil,
        is_token: cardData.is_token,
        release_date: new Date(cardData.release_date),
        price_estimate: cardData.price_estimate,
        colors: cardData.colors,
        rarity: cardData.rarity,
        artist: cardData.artist || '',
        text: cardData.text || '',
        manacost: cardData.manacost || '',
        manacost_amount: parseManaCostAmount(cardData.manacost || ''),
        avg_price: Math.floor(card.avg_price ?? 0),
        avg_non_foil_price: Math.floor(card.avg_non_foil_price ?? 0),
        current_price_delta: cardData.price_estimate && card.avg_price ? Math.floor(cardData.price_estimate - card.avg_price) : 0,
        cardmarket_url: '',
    }
}