import { NextRequest, NextResponse } from "next/server";
import { ensureReady, getPool } from "@/lib/db";
import { encodeSession, sessionCookieName } from "@/lib/session";

export async function POST(req: NextRequest) {
  await ensureReady();
  const { studentId } = await req.json();
  if (!studentId || typeof studentId !== "string") {
    return NextResponse.json({ error: "請輸入學號" }, { status: 400 });
  }
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT student_id, name, class, group_no, is_leader FROM students WHERE student_id = $1`,
    [studentId.trim()]
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: "查無此學號，請確認輸入是否正確" }, { status: 404 });
  }
  const s = rows[0];
  const session = {
    role: "student" as const,
    id: s.student_id,
    name: s.name,
    cls: s.class,
    groupNo: s.group_no,
    isLeader: s.is_leader,
  };
  const res = NextResponse.json({ ok: true, session });
  res.cookies.set(sessionCookieName(), encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 300, // ~10 months, spans the whole semester
  });
  return res;
}
