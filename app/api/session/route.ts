import { NextRequest } from "next/server";
import { PARTYKIT_URL } from "@/app/env";

export async function POST(req: NextRequest) {
  const roomId = req.nextUrl.searchParams.get("room");
  const connId = req.nextUrl.searchParams.get("_pk");
  const roomAuth = `${PARTYKIT_URL}/parties/chatroom/${roomId}/auth?_pk=${connId}`;
  return fetch(roomAuth, req);
}
