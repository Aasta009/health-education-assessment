import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { ensureReady, getPool, getUnlockedLevel } from "@/lib/db";
import { readSession } from "@/lib/session";
import { getField, levelForField } from "@/lib/fields";

async function checkAccess(session: any, key: string) {
  if (!session || session.role !== "student") {
    return { error: NextResponse.json({ error: "請先登入" }, { status: 401 }) };
  }
  const field = getField(key);
  if (!field) return { error: NextResponse.json({ error: "找不到此關卡" }, { status: 404 }) };
  if (session.groupNo == null) {
    return { error: NextResponse.json({ error: "尚未分組，請等待老師指派組別" }, { status: 409 }) };
  }
  if (field.stage === 1) {
    const unlocked = await getUnlockedLevel(session.cls);
    if (levelForField(key) > unlocked) {
      return { error: NextResponse.json({ error: "這一段路還沒開放，請等老師／助教開啟下一關" }, { status: 403 }) };
    }
  }
  return { field };
}

export async function GET(_req: NextRequest, { params }: { params: { key: string } }) {
  await ensureReady();
  const session = readSession();
  const access = await checkAccess(session, params.key);
  if (access.error) return access.error;
  const { field } = access;
  const pool = getPool();
  const me = (session as any).id;

  const mine = await pool.query(
    `SELECT content, updated_at FROM responses WHERE student_id = $1 AND field_key = $2`,
    [me, params.key]
  );
  // Hidden test accounts never show up to other real students — only to
  // themselves (so their own testing flow still looks normal to them).
  const members = await pool.query(
    `SELECT r.student_id, s.name, r.content, r.updated_at
     FROM responses r JOIN students s ON s.student_id = r.student_id
     WHERE r.class = $1 AND r.group_no = $2 AND r.field_key = $3
       AND (s.is_hidden = false OR r.student_id = $4)
     ORDER BY r.updated_at ASC`,
    [(session as any).cls, (session as any).groupNo, params.key, me]
  );
  const final = await pool.query(
    `SELECT content, finalized_by_name, updated_at FROM group_finals
     WHERE class = $1 AND group_no = $2 AND field_key = $3`,
    [(session as any).cls, (session as any).groupNo, params.key]
  );

  return NextResponse.json({
    field,
    mine: mine.rows[0] || null,
    members: members.rows,
    final: final.rows[0] || null,
  });
}

export async function POST(req: NextRequest, { params }: { params: { key: string } }) {
  await ensureReady();
  const session = readSession();
  const access = await checkAccess(session, params.key);
  if (access.error) return access.error;
  const { content } = await req.json();
  const pool = getPool();
  const s = session as any;
  // Keep "current" table for fast reads, but also append to the permanent
  // history log — every save is kept, even repeated overwrites of the same
  // field, so the full editing process is always exportable later.
  await pool.query(
    `INSERT INTO responses (student_id, class, group_no, field_key, content, updated_at)
     VALUES ($1,$2,$3,$4,$5, now())
     ON CONFLICT (student_id, field_key)
     DO UPDATE SET content = EXCLUDED.content, updated_at = now(), class = EXCLUDED.class, group_no = EXCLUDED.group_no`,
    [s.id, s.cls, s.groupNo, params.key, content ?? ""]
  );
  await pool.query(
    `INSERT INTO response_log (student_id, class, group_no, field_key, content, created_at)
     VALUES ($1,$2,$3,$4,$5, now())`,
    [s.id, s.cls, s.groupNo, params.key, content ?? ""]
  );
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest, { params }: { params: { key: string } }) {
  await ensureReady();
  const session = readSession();
  const access = await checkAccess(session, params.key);
  if (access.error) return access.error;
  const { content } = await req.json();
  const pool = getPool();
  const s = session as any;
  await pool.query(
    `INSERT INTO group_finals (class, group_no, field_key, content, finalized_by, finalized_by_name, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6, now())
     ON CONFLICT (class, group_no, field_key)
     DO UPDATE SET content = EXCLUDED.content, finalized_by = EXCLUDED.finalized_by,
                   finalized_by_name = EXCLUDED.finalized_by_name, updated_at = now()`,
    [s.cls, s.groupNo, params.key, content ?? "", s.id, s.name]
  );
  await pool.query(
    `INSERT INTO finalize_log (class, group_no, field_key, content, finalized_by, finalized_by_name, created_at)
     VALUES ($1,$2,$3,$4,$5,$6, now())`,
    [s.cls, s.groupNo, params.key, content ?? "", s.id, s.name]
  );
  return NextResponse.json({ ok: true });
}
