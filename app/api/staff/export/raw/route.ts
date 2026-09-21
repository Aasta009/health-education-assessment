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

  const responses = await pool.query(
    `SELECT r.class, r.group_no, r.field_key, r.student_id, s.name, r.content, r.updated_at
     FROM responses r JOIN students s ON s.student_id = r.student_id
     ORDER BY r.class, r.group_no, r.field_key, r.updated_at`
  );
  const finals = await pool.query(
    `SELECT class, group_no, field_key, content, finalized_by_name, updated_at
     FROM group_finals ORDER BY class, group_no, field_key`
  );
  const reflections = await pool.query(
    `SELECT class, group_no, student_id, name, content, updated_at FROM reflections
     ORDER BY class, group_no, student_id`
  );

  const wb = new ExcelJS.Workbook();

  const ws1 = wb.addWorksheet("個人原始作答");
  ws1.columns = [
    { header: "班級", key: "class", width: 8 },
    { header: "組別", key: "group_no", width: 8 },
    { header: "關卡", key: "field", width: 30 },
    { header: "學號", key: "student_id", width: 14 },
    { header: "姓名", key: "name", width: 12 },
    { header: "內容", key: "content", width: 60 },
    { header: "最後更新", key: "updated_at", width: 20 },
  ];
  for (const r of responses.rows) {
    ws1.addRow({
      class: r.class, group_no: r.group_no,
      field: FIELD_LABEL.get(r.field_key) || r.field_key,
      student_id: r.student_id, name: r.name,
      content: r.content, updated_at: r.updated_at,
    });
  }

  const ws2 = wb.addWorksheet("組別定稿版本");
  ws2.columns = [
    { header: "班級", key: "class", width: 8 },
    { header: "組別", key: "group_no", width: 8 },
    { header: "關卡", key: "field", width: 30 },
    { header: "內容", key: "content", width: 60 },
    { header: "定稿人", key: "finalized_by_name", width: 12 },
    { header: "最後更新", key: "updated_at", width: 20 },
  ];
  for (const r of finals.rows) {
    ws2.addRow({
      class: r.class, group_no: r.group_no,
      field: FIELD_LABEL.get(r.field_key) || r.field_key,
      content: r.content, finalized_by_name: r.finalized_by_name, updated_at: r.updated_at,
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
