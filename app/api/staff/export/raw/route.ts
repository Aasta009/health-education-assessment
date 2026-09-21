import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import ExcelJS from "exceljs";
import { ensureReady, getPool } from "@/lib/db";
import { readSession } from "@/lib/session";
import { FIELDS } from "@/lib/fields";

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
      content: r.content, created_at: r.created_at,
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
      content: r.content, finalized_by_name: r.finalized_by_name, created_at: r.created_at,
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
      content: r.content, updated_at: r.updated_at,
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
