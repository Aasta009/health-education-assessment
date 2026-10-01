import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { ensureReady, getPool } from "@/lib/db";
import { readSession } from "@/lib/session";
import { getOrCreateSession } from "@/lib/ai-session";

export async function POST(req: NextRequest) {
  await ensureReady();
  const session = readSession();
  if (!session || session.role !== "student" || session.groupNo == null) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }
  const { chapterKey } = await req.json();
  const aiSession = await getOrCreateSession(session.cls, session.groupNo, chapterKey);
  if (!aiSession) return NextResponse.json({ error: "找不到此討論" }, { status: 409 });
  if (aiSession.status !== "completed") {
    return NextResponse.json({ error: "這個討論還沒完成，不需要重新開啟" }, { status: 409 });
  }
  const pool = getPool();
  // Reopening never clears final_round/decision/after_ai — those stay as the
  // historical record until a *new* finalize/decision overwrites them.
  await pool.query(`UPDATE ai_sessions SET status='open' WHERE id=$1`, [aiSession.id]);
  await pool.query(
    `INSERT INTO ai_event_log (session_id, event_type, detail, actor) VALUES ($1,'reopened',$2,$3)`,
    [aiSession.id, "討論重新開啟", session.name]
  );
  return NextResponse.json({ ok: true });
}
