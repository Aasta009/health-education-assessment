import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { ensureReady, getPool } from "@/lib/db";
import { encodeSession, sessionCookieName } from "@/lib/session";

const TA_CODE = process.env.TA_CODE || "A113120009";
const TEACHER_CODE = process.env.TEACHER_CODE || "T115015";

export async function POST(req: NextRequest) {
  await ensureReady();
  const { studentId } = await req.json();
  if (!studentId || typeof studentId !== "string") {
    return NextResponse.json({ error: "請輸入學號" }, { status: 400 });
  }
  const input = studentId.trim();

  // Staff codes are checked first — they never collide with real student IDs
  // since the roster is all-numeric.
  if (input === TA_CODE) {
    const session = { role: "staff" as const, kind: "ta" as const };
    const res = NextResponse.json({ ok: true, session });
    res.cookies.set(sessionCookieName(), encodeSession(session), {
      httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 300,
    });
    return res;
  }
  if (input === TEACHER_CODE) {
    const session = { role: "staff" as const, kind: "teacher" as const };
    const res = NextResponse.json({ ok: true, session });
    res.cookies.set(sessionCookieName(), encodeSession(session), {
      httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 300,
    });
    return res;
  }

  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT student_id, name, class, group_no, is_leader FROM students WHERE student_id = $1`,
    [input]
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
    maxAge: 60 * 60 * 24 * 300,
  });
  return res;
}
