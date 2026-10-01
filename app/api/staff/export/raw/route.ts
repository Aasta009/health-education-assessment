import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import ExcelJS from "exceljs";
import { ensureReady, getPool } from "@/lib/db";
import { readSession } from "@/lib/session";
import { FIELDS } from "@/lib/fields";
import { ALL_AI_CHAPTERS } from "@/lib/ai-chapters";
import { formatTaipei } from "@/lib/format";

const FIELD_LABEL = new Map(FIELDS.map((f) => [f.key, f.label]));

export async function GET(_req: NextRequest) {
  await ensureReady();
  const session = readSession();
  if (!session || session.role !== "staff") {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }
  const pool = getPool();

  // Full history — every save a student made, including every time they
  // overwrote a previous answer. Nothing is deduplicated or summarized.
  const responseLog = await pool.query(
    `SELECT rl.class, rl.group_no, rl.field_key, rl.student_id, s.name, rl.content, rl.created_at
     FROM response_log rl JOIN students s ON s.student_id = rl.student_id
     ORDER BY rl.class, rl.group_no, rl.field_key, rl.created_at`
  );
  // Full history of every finalize action per group, including re-finalizes.
  const finalizeLog = await pool.query(
    `SELECT class, group_no, field_key, content, finalized_by_name, created_at
     FROM finalize_log ORDER BY class, group_no, field_key, created_at`
  );
  const reflections = await pool.query(
    `SELECT class, group_no, student_id, name, content, updated_at FROM reflections
     ORDER BY class, group_no, student_id`
  );

  const wb = new ExcelJS.Workbook();

  const ws1 = wb.addWorksheet("個人作答歷程");
  ws1.columns = [
    { header: "班級", key: "class", width: 8 },
    { header: "組別", key: "group_no", width: 8 },
    { header: "關卡", key: "field", width: 30 },
    { header: "學號", key: "student_id", width: 14 },
    { header: "姓名", key: "name", width: 12 },
    { header: "本次填寫內容", key: "content", width: 60 },
    { header: "填寫時間", key: "created_at", width: 20 },
  ];
  for (const r of responseLog.rows) {
    ws1.addRow({
      class: r.class, group_no: r.group_no,
      field: FIELD_LABEL.get(r.field_key) || r.field_key,
      student_id: r.student_id, name: r.name,
      content: r.content, created_at: formatTaipei(r.created_at),
    });
  }

  const ws2 = wb.addWorksheet("組別定稿歷程");
  ws2.columns = [
    { header: "班級", key: "class", width: 8 },
    { header: "組別", key: "group_no", width: 8 },
    { header: "關卡", key: "field", width: 30 },
    { header: "本次定稿內容", key: "content", width: 60 },
    { header: "定稿人", key: "finalized_by_name", width: 12 },
    { header: "定稿時間", key: "created_at", width: 20 },
  ];
  for (const r of finalizeLog.rows) {
    ws2.addRow({
      class: r.class, group_no: r.group_no,
      field: FIELD_LABEL.get(r.field_key) || r.field_key,
      content: r.content, finalized_by_name: r.finalized_by_name, created_at: formatTaipei(r.created_at),
    });
  }

  const ws3 = wb.addWorksheet("個人反思心得");
  ws3.columns = [
    { header: "班級", key: "class", width: 8 },
    { header: "組別", key: "group_no", width: 8 },
    { header: "學號", key: "student_id", width: 14 },
    { header: "姓名", key: "name", width: 12 },
    { header: "內容", key: "content", width: 60 },
    { header: "最後更新", key: "updated_at", width: 20 },
  ];
  for (const r of reflections.rows) {
    ws3.addRow({
      class: r.class, group_no: r.group_no, student_id: r.student_id, name: r.name,
      content: r.content, updated_at: formatTaipei(r.updated_at),
    });
  }

  // ---- AI-student iterative reasoning module ----
  const aiChapterTitle = new Map(ALL_AI_CHAPTERS.map((c) => [c.key, c.title]));
  const aiSessions = await pool.query(
    `SELECT * FROM ai_sessions ORDER BY class, group_no, chapter_key`
  );
  const aiRounds = await pool.query(
    `SELECT ar.*, s.class, s.group_no, s.chapter_key
     FROM ai_rounds ar JOIN ai_sessions s ON s.id = ar.session_id
     ORDER BY s.class, s.group_no, s.chapter_key, ar.round_no`
  );
  const aiEvents = await pool.query(
    `SELECT el.*, s.class, s.group_no, s.chapter_key
     FROM ai_event_log el JOIN ai_sessions s ON s.id = el.session_id
     ORDER BY s.class, s.group_no, s.chapter_key, el.created_at`
  );

  const ws4 = wb.addWorksheet("AI Session Summary");
  ws4.columns = [
    { header: "Class", key: "class", width: 8 },
    { header: "Group", key: "group_no", width: 8 },
    { header: "Stage", key: "chapter_key", width: 14 },
    { header: "Stage Title", key: "title", width: 26 },
    { header: "Before AI", key: "before_ai", width: 40 },
    { header: "Start Time", key: "created_at", width: 20 },
    { header: "End Time", key: "completed_at", width: 20 },
    { header: "Total Rounds", key: "total_rounds", width: 12 },
    { header: "Final Round", key: "final_round", width: 10 },
    { header: "Maintain/Revise", key: "decision", width: 14 },
    { header: "After AI", key: "after_ai", width: 40 },
    { header: "Revision Reason", key: "revision_reason", width: 30 },
    { header: "Status", key: "status", width: 12 },
  ];
  const roundCountBySession = new Map<number, number>();
  for (const r of aiRounds.rows) roundCountBySession.set(r.session_id, (roundCountBySession.get(r.session_id) || 0) + 1);
  for (const s of aiSessions.rows) {
    ws4.addRow({
      class: s.class, group_no: s.group_no, chapter_key: s.chapter_key,
      title: aiChapterTitle.get(s.chapter_key) || s.chapter_key,
      before_ai: s.before_ai, created_at: formatTaipei(s.created_at), completed_at: formatTaipei(s.completed_at),
      total_rounds: roundCountBySession.get(s.id) || 0, final_round: s.final_round,
      decision: s.decision, after_ai: s.after_ai, revision_reason: s.revision_reason,
      status: s.status,
    });
  }

  const ws5 = wb.addWorksheet("AI Interaction Log");
  ws5.columns = [
    { header: "Class", key: "class", width: 8 },
    { header: "Group", key: "group_no", width: 8 },
    { header: "Stage", key: "chapter_key", width: 14 },
    { header: "Round", key: "round_no", width: 8 },
    { header: "Prompt", key: "prompt", width: 40 },
    { header: "AI Response", key: "ai_response", width: 40 },
    { header: "Judgment", key: "judgment", width: 12 },
    { header: "Judgment Reason", key: "judgment_reason", width: 30 },
    { header: "By", key: "created_by_name", width: 12 },
    { header: "Timestamp", key: "created_at", width: 20 },
  ];
  for (const r of aiRounds.rows) {
    ws5.addRow({
      class: r.class, group_no: r.group_no, chapter_key: r.chapter_key, round_no: r.round_no,
      prompt: r.prompt, ai_response: r.ai_response, judgment: r.judgment,
      judgment_reason: r.judgment_reason, created_by_name: r.created_by_name, created_at: formatTaipei(r.created_at),
    });
  }

  const ws6 = wb.addWorksheet("AI Event Log");
  ws6.columns = [
    { header: "Class", key: "class", width: 8 },
    { header: "Group", key: "group_no", width: 8 },
    { header: "Stage", key: "chapter_key", width: 14 },
    { header: "Event", key: "event_type", width: 16 },
    { header: "Detail", key: "detail", width: 30 },
    { header: "Actor", key: "actor", width: 12 },
    { header: "Timestamp", key: "created_at", width: 20 },
  ];
  for (const e of aiEvents.rows) {
    ws6.addRow({
      class: e.class, group_no: e.group_no, chapter_key: e.chapter_key,
      event_type: e.event_type, detail: e.detail, actor: e.actor, created_at: formatTaipei(e.created_at),
    });
  }

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="learning-process-export.xlsx"`,
    },
  });
}
