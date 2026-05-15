import {
  ScryFallCard,
  cardsSearchEndpoint,
  fetchDataPaginated,
} from "@/scryfall/utils";
import { getClient } from "./client";

export default async function insertNewMtgCard(
  setId: string,
  collectorNumber: string,
  isFoil: boolean,
): Promise<number> {
  const sql = getClient();

  if (!sql) {
    console.error("Database client not initialized");
    throw new Error("Database client not initialized");
  }

  const card: ScryFallCard | undefined = await fetchDataPaginated<ScryFallCard>(
    cardsSearchEndpoint,
    {
      order: "set",
      q: `e:${setId} cn:"${collectorNumber}"`,
      unique: "prints",
    },
  ).then((cards) => cards.find((c) => c.collector_number === collectorNumber));

  if (!card) {
    console.error("Card not found");
    throw new Error("Card not found");
  }

  const rows = await sql`
    INSERT INTO mtg_data (
      amount_owned, artist, card_type, cardmarket_url, cardnumber,
      colors, image_url, is_foil, is_token, manacost, name,
      price_estimate, rarity, release_date, series, text, scryfall_id
    ) VALUES (
      ${0},
      ${card.artist || ""},
      ${card.type_line},
      ${""},
      ${card.collector_number},
      ${card.color_identity ?? []},
      ${card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || ""},
      ${isFoil},
      ${card.type_line.toLowerCase().split(" ").includes("token")},
      ${card.mana_cost || ""},
      ${card.name},
      ${isFoil
        ? card.prices.eur_foil ? parseInt(card.prices.eur_foil.replace(".", "")) : 1
        : card.prices.eur ? parseInt(card.prices.eur.replace(".", "")) : 1},
      ${card.rarity},
      ${card.released_at || ""},
      ${card.set},
      ${card.oracle_text || ""},
      ${card.id}
    )
    ON CONFLICT (series, cardnumber, is_foil) DO UPDATE SET
      name = EXCLUDED.name,
      card_type = EXCLUDED.card_type,
      artist = EXCLUDED.artist,
      image_url = EXCLUDED.image_url,
      manacost = EXCLUDED.manacost,
      colors = EXCLUDED.colors,
      rarity = EXCLUDED.rarity,
      release_date = EXCLUDED.release_date,
      price_estimate = EXCLUDED.price_estimate,
      text = EXCLUDED.text,
      scryfall_id = EXCLUDED.scryfall_id
    RETURNING id
  `;

  return rows[0]?.id ?? 0;
}
