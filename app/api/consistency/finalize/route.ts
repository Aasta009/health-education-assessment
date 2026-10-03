import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { ensureReady, getPool } from "@/lib/db";
import { readSession } from "@/lib/session";

export async function PUT(req: NextRequest) {
  await ensureReady();
  const session = readSession();
  if (!session || session.role !== "student" || session.groupNo == null) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }
  const { itemId, stance, reason } = await req.json();
  if (!["agree", "disagree"].includes(stance)) {
    return NextResponse.json({ error: "請選擇贊同或不贊同" }, { status: 400 });
  }
  if (stance === "disagree" && !(reason || "").trim()) {
    return NextResponse.json({ error: "不贊同時請說明理由" }, { status: 400 });
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
    `INSERT INTO consistency_finals (item_id, stance, reason, finalized_by, finalized_by_name, updated_at)
     VALUES ($1,$2,$3,$4,$5, now())
     ON CONFLICT (item_id) DO UPDATE SET stance = EXCLUDED.stance, reason = EXCLUDED.reason,
                   finalized_by = EXCLUDED.finalized_by, finalized_by_name = EXCLUDED.finalized_by_name, updated_at = now()`,
    [itemId, stance, reason || "", session.id, session.name]
  );

  if (stance === "disagree") {
    // Explaining why you disagree is itself the resolution — no AI recheck needed.
    await pool.query(
      `UPDATE consistency_items SET status='resolved', resolution='disagree', updated_at=now() WHERE id=$1`,
      [itemId]
    );
  } else {
    // Agreeing means the group will go fix the activity plan, then trigger a recheck.
    await pool.query(
      `UPDATE consistency_items SET resolution='revise_pending', updated_at=now() WHERE id=$1`,
      [itemId]
    );
  }
  return NextResponse.json({ ok: true });
}
