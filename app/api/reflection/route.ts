import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { ensureReady, getPool, getUnlockedLevel } from "@/lib/db";
import { readSession } from "@/lib/session";
import { MAX_LEVEL } from "@/lib/fields";

export async function GET() {
  await ensureReady();
  const session = readSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }
  if (session.groupNo == null) {
    return NextResponse.json({ error: "尚未分組" }, { status: 409 });
  }
  const unlocked = await getUnlockedLevel(session.cls);
  if (unlocked < MAX_LEVEL) {
    return NextResponse.json({ error: "這一段路還沒開放，請等老師／助教開啟最後一關" }, { status: 403 });
  }
  const pool = getPool();
  const mine = await pool.query(
    `SELECT content, updated_at FROM reflections WHERE student_id = $1`,
    [session.id]
  );
  const members = await pool.query(
    `SELECT r.student_id, s.name, r.content, r.updated_at
     FROM reflections r JOIN students s ON s.student_id = r.student_id
     WHERE r.class = $1 AND r.group_no = $2 AND (s.is_hidden = false OR r.student_id = $3)
     ORDER BY r.updated_at ASC`,
    [session.cls, session.groupNo, session.id]
  );
  return NextResponse.json({ mine: mine.rows[0] || null, members: members.rows });
}

export async function POST(req: NextRequest) {
  await ensureReady();
  const session = readSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }
  if (session.groupNo == null) {
    return NextResponse.json({ error: "尚未分組" }, { status: 409 });
  }
  const unlocked = await getUnlockedLevel(session.cls);
  if (unlocked < MAX_LEVEL) {
    return NextResponse.json({ error: "這一段路還沒開放" }, { status: 403 });
  }
  const { content } = await req.json();
  const pool = getPool();
  await pool.query(
    `INSERT INTO reflections (student_id, name, class, group_no, content, updated_at)
     VALUES ($1,$2,$3,$4,$5, now())
     ON CONFLICT (student_id)
     DO UPDATE SET content = EXCLUDED.content, updated_at = now()`,
    [session.id, session.name, session.cls, session.groupNo, content ?? ""]
  );
  return NextResponse.json({ ok: true });
}
