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
  const { chapterKey, roundNo } = await req.json();
  const aiSession = await getOrCreateSession(session.cls, session.groupNo, chapterKey);
  if (!aiSession) return NextResponse.json({ error: "找不到此討論" }, { status: 409 });
  if (aiSession.status !== "open") {
    return NextResponse.json({ error: "這個討論已經完成" }, { status: 409 });
  }
  const pool = getPool();
  const roundRes = await pool.query(
    `SELECT round_no FROM ai_rounds WHERE session_id=$1 AND round_no=$2`,
    [aiSession.id, roundNo]
  );
  if (roundRes.rows.length === 0) {
    return NextResponse.json({ error: "找不到這一輪，至少需要完成一輪討論才能採用" }, { status: 400 });
  }
  await pool.query(
    `UPDATE ai_sessions SET status='completed', final_round=$2, completed_at=now() WHERE id=$1`,
    [aiSession.id, roundNo]
  );
  await pool.query(
    `INSERT INTO ai_event_log (session_id, event_type, detail, actor) VALUES ($1,'finalized',$2,$3)`,
    [aiSession.id, `Round ${roundNo} 標記為最終採用版本`, session.name]
  );
  return NextResponse.json({ ok: true });
}
