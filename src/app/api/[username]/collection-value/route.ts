import { getAccountIdByApiKey, loadCollectionValueHistory } from "@/db/collection-value-history";
import { NextRequest, NextResponse } from "next/server";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

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
 * GET /api/<username>/collection-value?from=2026-01-01&to=2026-06-30
 * Header: Authorization: Bearer <api key>
 * Both bounds are optional and inclusive.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

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

  const values = await loadCollectionValueHistory(accountId, { from, to });

  return NextResponse.json(
    {
      username,
      currency: "EUR",
      from: from?.toISOString() ?? null,
      to: to?.toISOString() ?? null,
      values,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
