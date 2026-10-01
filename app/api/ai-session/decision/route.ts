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
  const { chapterKey, decision, afterAI, revisionReason } = await req.json();
  if (!["maintain", "revise"].includes(decision)) {
    return NextResponse.json({ error: "請選擇維持或修改" }, { status: 400 });
  }
  const aiSession = await getOrCreateSession(session.cls, session.groupNo, chapterKey);
  if (!aiSession) return NextResponse.json({ error: "找不到此討論" }, { status: 409 });
  if (aiSession.status !== "completed") {
    return NextResponse.json({ error: "請先完成並採用一個版本，才能決定是否修改定稿" }, { status: 409 });
  }
  const finalAfterAI = decision === "maintain" ? aiSession.before_ai : (afterAI || "");
  const pool = getPool();
  await pool.query(
    `UPDATE ai_sessions SET decision=$2, after_ai=$3, revision_reason=$4 WHERE id=$1`,
    [aiSession.id, decision, finalAfterAI, decision === "revise" ? (revisionReason || "") : null]
  );
  await pool.query(
    `INSERT INTO ai_event_log (session_id, event_type, detail, actor) VALUES ($1,'decision_saved',$2,$3)`,
    [aiSession.id, decision === "maintain" ? "決定維持原定稿" : "決定修改定稿", session.name]
  );
  return NextResponse.json({ ok: true });
}
