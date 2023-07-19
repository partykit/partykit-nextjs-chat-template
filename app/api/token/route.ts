import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const csrf = req.cookies.get("next-auth.csrf-token")?.value;
  const token = req.cookies.get("next-auth.session-token")?.value;

  if (!token) {
    return NextResponse.json({ error: "No token" }, { status: 401 });
  }

  return NextResponse.json({
    token,
    csrf,
  });
}
