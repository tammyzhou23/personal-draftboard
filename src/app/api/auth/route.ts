import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, getSessionToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (!verifyPassword(password)) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const token = getSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("draftboard_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("draftboard_session");
  return response;
}
