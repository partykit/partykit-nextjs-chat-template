import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

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
