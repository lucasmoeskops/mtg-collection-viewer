import { getAccountIdByApiKey, loadCollectionValueHistory, setExists } from "@/db/collection-value-history";
import { NextRequest, NextResponse } from "next/server";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
// Scryfall set codes are mostly 3 characters, but promo and token sets run longer (e.g. "pmkm", "tmh3")
const SET_CODE = /^[a-z0-9]{2,6}$/;

/**
 * Parses a `from`/`to` query parameter: an ISO date or timestamp. A date-only `to` covers that whole day (UTC).
 * Returns undefined when absent and null when invalid.
 */
function parseBound(value: string | null, isEnd: boolean): Date | undefined | null {
  if (!value) return undefined;
  const date = new Date(DATE_ONLY.test(value) && isEnd ? `${value}T23:59:59.999Z` : value);
  return isNaN(date.getTime()) ? null : date;
}

function error(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Shared by the collection value routes: checks the `Authorization: Bearer <api key>` header against the username,
 * parses the optional inclusive `from`/`to` query parameters and returns the value history, optionally for one set.
 */
export async function collectionValueResponse(request: NextRequest, username: string, rawSet?: string) {
  const apiKey = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? "";
  const accountId = await getAccountIdByApiKey(username, apiKey);
  if (accountId === null) {
    return error(401, "Missing or invalid API key");
  }

  const searchParams = request.nextUrl.searchParams;
  const from = parseBound(searchParams.get("from"), false);
  const to = parseBound(searchParams.get("to"), true);
  if (from === null || to === null) {
    return error(400, "from and to must be ISO dates (YYYY-MM-DD) or timestamps");
  }
  if (from && to && from > to) {
    return error(400, "from must not be after to");
  }

  const set = rawSet?.toLowerCase();
  if (set !== undefined) {
    if (!SET_CODE.test(set)) {
      return error(400, "set must be a Scryfall set code, like mh3");
    }
    if (!(await setExists(set))) {
      return error(404, `Unknown set: ${set}`);
    }
  }

  const values = await loadCollectionValueHistory(accountId, { from, to, set });

  return NextResponse.json(
    {
      username,
      ...(set !== undefined && { set }),
      currency: "EUR",
      from: from?.toISOString() ?? null,
      to: to?.toISOString() ?? null,
      values,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
