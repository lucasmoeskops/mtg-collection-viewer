import { NextRequest } from "next/server";
import { collectionValueResponse } from "../../collection-value-response";

/**
 * GET /api/<username>/collection-value?from=2026-01-01&to=2026-06-30
 * Header: Authorization: Bearer <api key>
 * Both bounds are optional and inclusive.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return collectionValueResponse(request, username);
}
