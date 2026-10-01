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
  const { chapterKey, prompt, aiResponse, judgment, judgmentReason } = await req.json();
  const aiSession = await getOrCreateSession(session.cls, session.groupNo, chapterKey);
  if (!aiSession) return NextResponse.json({ error: "找不到此討論，或前置關卡尚未完成" }, { status: 409 });
  if (aiSession.status !== "open") {
    return NextResponse.json({ error: "這個討論已經完成，請先重新開啟才能新增輪次" }, { status: 409 });
  }
  if (!["accept", "partial", "reject"].includes(judgment)) {
    return NextResponse.json({ error: "請選擇判斷結果" }, { status: 400 });
  }

  const pool = getPool();
  const maxRes = await pool.query(`SELECT COALESCE(MAX(round_no), 0) as m FROM ai_rounds WHERE session_id = $1`, [aiSession.id]);
  const nextRound = Number(maxRes.rows[0].m) + 1;

  await pool.query(
    `INSERT INTO ai_rounds (session_id, round_no, prompt, ai_response, judgment, judgment_reason, created_by, created_by_name)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [aiSession.id, nextRound, prompt || "", aiResponse || "", judgment, judgmentReason || "", session.id, session.name]
  );
  await pool.query(
    `INSERT INTO ai_event_log (session_id, event_type, detail, actor) VALUES ($1,'round_added',$2,$3)`,
    [aiSession.id, `建立 Round ${nextRound}`, session.name]
  );

  return NextResponse.json({ ok: true, roundNo: nextRound });
}
