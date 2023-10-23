import { NextRequest } from "next/server";
import { PARTYKIT_URL } from "@/app/env";

/**
 * The /chat/:roomId/auth route proxies the request directly to the PartyKit server.
 * The server will authenticate by sending the request back to the NextAuth Session API.
 */
export async function POST(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const roomId = params.get("room");
  const roomAuth = `${PARTYKIT_URL}/parties/chatroom/${roomId}/auth?${params}`;
  // forward request with original headers, including cookies!
  return fetch(roomAuth, req);
}
