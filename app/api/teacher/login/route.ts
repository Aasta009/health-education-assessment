import { NextRequest, NextResponse } from "next/server";
import { encodeSession, sessionCookieName } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { passcode } = await req.json();
  const expected = process.env.TEACHER_PASSCODE || "edu2025";
  if (passcode !== expected) {
    return NextResponse.json({ error: "通關碼錯誤" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookieName(), encodeSession({ role: "teacher" }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 300,
  });
  return res;
}
