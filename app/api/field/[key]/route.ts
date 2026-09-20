import { NextRequest, NextResponse } from "next/server";
import { ensureReady, getPool } from "@/lib/db";
import { readSession } from "@/lib/session";
import { getField } from "@/lib/fields";

export async function GET(_req: NextRequest, { params }: { params: { key: string } }) {
  await ensureReady();
  const session = readSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }
  const field = getField(params.key);
  if (!field) return NextResponse.json({ error: "找不到此關卡" }, { status: 404 });
  if (session.groupNo == null) {
    return NextResponse.json({ error: "尚未分組，請等待老師指派組別" }, { status: 409 });
  }
  const pool = getPool();

  const mine = await pool.query(
    `SELECT content, updated_at FROM responses WHERE student_id = $1 AND field_key = $2`,
    [session.id, params.key]
  );
  const members = await pool.query(
    `SELECT r.student_id, s.name, r.content, r.updated_at
     FROM responses r JOIN students s ON s.student_id = r.student_id
     WHERE r.class = $1 AND r.group_no = $2 AND r.field_key = $3
     ORDER BY r.updated_at ASC`,
    [session.cls, session.groupNo, params.key]
  );
  const final = await pool.query(
    `SELECT content, finalized_by_name, updated_at FROM group_finals
     WHERE class = $1 AND group_no = $2 AND field_key = $3`,
    [session.cls, session.groupNo, params.key]
  );

  return NextResponse.json({
    field,
    mine: mine.rows[0] || null,
    members: members.rows,
    final: final.rows[0] || null,
  });
}

export async function POST(req: NextRequest, { params }: { params: { key: string } }) {
  // Save my own individual raw answer.
  await ensureReady();
  const session = readSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }
  if (session.groupNo == null) {
    return NextResponse.json({ error: "尚未分組，請等待老師指派組別" }, { status: 409 });
  }
  const field = getField(params.key);
  if (!field) return NextResponse.json({ error: "找不到此關卡" }, { status: 404 });
  const { content } = await req.json();
  const pool = getPool();
  await pool.query(
    `INSERT INTO responses (student_id, class, group_no, field_key, content, updated_at)
     VALUES ($1,$2,$3,$4,$5, now())
     ON CONFLICT (student_id, field_key)
     DO UPDATE SET content = EXCLUDED.content, updated_at = now(), class = EXCLUDED.class, group_no = EXCLUDED.group_no`,
    [session.id, session.cls, session.groupNo, params.key, content ?? ""]
  );
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest, { params }: { params: { key: string } }) {
  // Finalize the group's version for this field. Any member may call this.
  await ensureReady();
  const session = readSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }
  if (session.groupNo == null) {
    return NextResponse.json({ error: "尚未分組，請等待老師指派組別" }, { status: 409 });
  }
  const field = getField(params.key);
  if (!field) return NextResponse.json({ error: "找不到此關卡" }, { status: 404 });
  const { content } = await req.json();
  const pool = getPool();
  await pool.query(
    `INSERT INTO group_finals (class, group_no, field_key, content, finalized_by, finalized_by_name, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6, now())
     ON CONFLICT (class, group_no, field_key)
     DO UPDATE SET content = EXCLUDED.content, finalized_by = EXCLUDED.finalized_by,
                   finalized_by_name = EXCLUDED.finalized_by_name, updated_at = now()`,
    [session.cls, session.groupNo, params.key, content ?? "", session.id, session.name]
  );
  return NextResponse.json({ ok: true });
}
