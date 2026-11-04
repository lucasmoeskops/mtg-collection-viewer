import { NextRequest } from "next/server";
import { collectionValueResponse } from "../../../collection-value-response";

/**
 * GET /api/<username>/collection-value/<set code>?from=2026-01-01&to=2026-06-30
 * Header: Authorization: Bearer <api key>
 * Value of the account's cards from one set (Scryfall code, e.g. mh3). Both bounds are optional and inclusive.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ username: string; set: string }> }) {
  const { username, set } = await params;
  return collectionValueResponse(request, username, set);
}
