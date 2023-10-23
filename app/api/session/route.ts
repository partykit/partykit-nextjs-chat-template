import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { PARTYKIT_URL } from "@/app/env";

const secret = process.env.NEXTAUTH_SECRET;

export async function GET(req: NextRequest) {
  const sessionToken = await getToken({ req, secret, raw: true });
  if (!sessionToken) {
    return NextResponse.json({ error: "No token" }, { status: 401 });
  }

  const session = await getToken({ req, secret });
  if (!session) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }

  return NextResponse.json({
    sessionToken,
    session,
  });
}

export async function POST(req: NextRequest) {
  const roomId = req.nextUrl.searchParams.get("room");
  const connId = req.nextUrl.searchParams.get("_pk");
  const roomAuth = `${PARTYKIT_URL}/parties/chatroom/${roomId}/auth?_pk=${connId}`;
  return fetch(roomAuth, req);
}
