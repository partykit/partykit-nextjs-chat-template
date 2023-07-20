import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("next-auth.session-token")?.value;
  const csrf = req.cookies.get("next-auth.csrf-token")?.value;

  if (!session) {
    return NextResponse.json({ error: "No token" }, { status: 401 });
  }

  return NextResponse.json({
    session,
    csrf,
  });
}
