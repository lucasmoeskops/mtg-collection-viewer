export const timeBetweenConsecutiveCalls = 500; // milliseconds (Scryfall allows max 2 card fetches/second)
export const setsEndpoint = "https://api.scryfall.com/sets";
export const cardsSearchEndpoint = "https://api.scryfall.com/cards/search";
export const cardsCollectionEndpoint = "https://api.scryfall.com/cards/collection";
let lastCallTime = 0;

export type ScryFallCard = {
  id: string;
  name: string;
  set_name: string;
  set: string;
  collector_number: string;
  image_uris?: {
    normal: string;
    art_crop?: string;
  };
  card_faces?: Array<{
    image_uris?: {
      normal: string;
      art_crop?: string;
    };
  }>;
  color_identity?: string[];
  rarity: string;
  type_line: string;
  prices: {
    usd?: string;
    usd_foil?: string;
    eur?: string;
    eur_foil?: string;
    tix?: string;
  };
  mana_cost?: string;
  artist?: string;
  oracle_text?: string;
  released_at?: string;
  purchase_uris?: {
    cardmarket?: string;
  };
};

export async function rateLimitedFetch(
  input: RequestInfo,
  init?: RequestInit,
): Promise<Response> {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;

  if (timeSinceLastCall < timeBetweenConsecutiveCalls) {
    await new Promise((resolve) =>
      setTimeout(resolve, timeBetweenConsecutiveCalls - timeSinceLastCall),
    );
    return rateLimitedFetch(input, init);
  }

  lastCallTime = Date.now();
  return fetch(input, init);
}

export type CollectionIdentifier = {
  set: string;
  collector_number: string;
};

export async function fetchDataPaginated<T>(
  endpoint: string,
  params: Record<string, string> = {},
  limit: number = 0,
): Promise<T[]> {
  const results: T[] = [];
  let fetchedAll = false;
  let currentEndpoint = endpoint;
  let retriesForCurrentPage = 0;
  const maxRetries = 3;

  while (!fetchedAll && (limit === 0 || results.length < limit)) {
    const url = new URL(currentEndpoint);
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.append(key, value),
    );

    const response = await rateLimitedFetch(url.toString());

    if (response.status === 404) {
      return results;
    }

    if (response.status === 429 && retriesForCurrentPage < maxRetries) {
      retriesForCurrentPage++;
      const retryAfterSeconds = parseInt(response.headers.get("Retry-After") || "5", 10);
      await new Promise((resolve) => setTimeout(resolve, retryAfterSeconds * 1000));
      continue;
    }

    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText}`);
    }

    retriesForCurrentPage = 0;
    const jsonResponse = await response.json();

    if (!jsonResponse.has_more) {
      fetchedAll = true;
    }

    results.push(...jsonResponse.data);
    currentEndpoint = jsonResponse.next_page;
  }

  return limit > 0 && results.length > limit
    ? results.slice(0, limit)
    : results;
}

export async function fetchCardsCollection(
  identifiers: CollectionIdentifier[],
): Promise<{ found: ScryFallCard[]; notFound: CollectionIdentifier[] }> {
  const found: ScryFallCard[] = [];
  const notFound: CollectionIdentifier[] = [];
  const batchSize = 75;

  for (let i = 0; i < identifiers.length; i += batchSize) {
    const batch = identifiers.slice(i, i + batchSize);
    let retries = 0;

    while (true) {
      const response = await rateLimitedFetch(cardsCollectionEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifiers: batch }),
      });

      if (response.status === 429 && retries < 3) {
        retries++;
        const delay = parseInt(response.headers.get("Retry-After") || "5", 10) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      if (!response.ok) {
        throw new Error(`Error fetching card collection: ${response.statusText}`);
      }

      const json = await response.json();
      found.push(...json.data);
      if (json.not_found?.length) {
        notFound.push(...json.not_found);
      }
      break;
    }
  }

  return { found, notFound };
}
