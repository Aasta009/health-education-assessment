import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { ensureReady, getPool } from "@/lib/db";
import { readSession } from "@/lib/session";
import { getAIChapter } from "@/lib/ai-chapters";
import { getOrCreateSession, prerequisiteComplete } from "@/lib/ai-session";

export async function GET(req: NextRequest) {
  await ensureReady();
  const session = readSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }
  if (session.groupNo == null) {
    return NextResponse.json({ error: "尚未分組" }, { status: 409 });
  }
  const chapterKey = new URL(req.url).searchParams.get("chapterKey") || "";
  const chapter = getAIChapter(chapterKey);
  if (!chapter) return NextResponse.json({ error: "找不到此討論單元" }, { status: 404 });

  const ok = await prerequisiteComplete(session.cls, session.groupNo, chapterKey);
  if (!ok) {
    return NextResponse.json({ error: "尚未完成前置關卡的組內定稿，無法開始 AI 討論" }, { status: 409 });
  }
  const aiSession = await getOrCreateSession(session.cls, session.groupNo, chapterKey);
  if (!aiSession) {
    return NextResponse.json({ error: "尚未完成前置關卡的組內定稿，無法開始 AI 討論" }, { status: 409 });
  }

  const pool = getPool();
  const rounds = await pool.query(
    `SELECT round_no, prompt, ai_response, judgment, judgment_reason, created_by_name, created_at
     FROM ai_rounds WHERE session_id = $1 ORDER BY round_no ASC`,
    [aiSession.id]
  );

  return NextResponse.json({
    chapterTitle: chapter.title,
    sessionId: aiSession.id,
    status: aiSession.status,
    beforeAI: aiSession.before_ai,
    finalRound: aiSession.final_round,
    decision: aiSession.decision,
    afterAI: aiSession.after_ai,
    revisionReason: aiSession.revision_reason,
    rounds: rounds.rows,
  });
}
