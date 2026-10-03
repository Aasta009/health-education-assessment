import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { ensureReady, getPool } from "@/lib/db";
import { readSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  await ensureReady();
  const session = readSession();
  if (!session || session.role !== "student" || session.groupNo == null) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }
  const { itemId, stance, reason } = await req.json();
  if (!["agree", "disagree"].includes(stance)) {
    return NextResponse.json({ error: "請選擇贊同或不贊同" }, { status: 400 });
  }
  const pool = getPool();
  const itemRes = await pool.query(`SELECT class, group_no, status FROM consistency_items WHERE id=$1`, [itemId]);
  const item = itemRes.rows[0];
  if (!item || item.class !== session.cls || item.group_no !== session.groupNo) {
    return NextResponse.json({ error: "找不到這個項目" }, { status: 404 });
  }
  if (item.status !== "flagged") {
    return NextResponse.json({ error: "這個項目已經解決了" }, { status: 409 });
  }
  await pool.query(
    `INSERT INTO consistency_responses (item_id, student_id, stance, reason, updated_at)
     VALUES ($1,$2,$3,$4, now())
     ON CONFLICT (item_id, student_id) DO UPDATE SET stance = EXCLUDED.stance, reason = EXCLUDED.reason, updated_at = now()`,
    [itemId, session.id, stance, reason || ""]
  );
  return NextResponse.json({ ok: true });
}
