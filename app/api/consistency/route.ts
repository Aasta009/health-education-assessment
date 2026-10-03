import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { ensureReady, getPool } from "@/lib/db";
import { readSession } from "@/lib/session";
import { getABText, getItems, hasRunCheck } from "@/lib/consistency";

export async function GET(_req: NextRequest) {
  await ensureReady();
  const session = readSession();
  if (!session || session.role !== "student" || session.groupNo == null) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }
  const ab = await getABText(session.cls, session.groupNo);
  if (!ab) {
    return NextResponse.json({ error: "請先完成第四關與第五關" }, { status: 409 });
  }
  const items = await getItems(session.cls, session.groupNo);
  const ran = await hasRunCheck(session.cls, session.groupNo);

  const pool = getPool();
  const me = session.id;
  const itemIds = items.map((i) => i.id);
  let mineByItem = new Map<number, any>();
  let membersByItem = new Map<number, any[]>();
  let finalByItem = new Map<number, any>();
  if (itemIds.length > 0) {
    const mineRes = await pool.query(
      `SELECT item_id, stance, reason FROM consistency_responses WHERE item_id = ANY($1) AND student_id = $2`,
      [itemIds, me]
    );
    mineByItem = new Map(mineRes.rows.map((r) => [r.item_id, r]));
    const membersRes = await pool.query(
      `SELECT r.item_id, r.student_id, s.name, r.stance, r.reason, r.updated_at
       FROM consistency_responses r JOIN students s ON s.student_id = r.student_id
       WHERE r.item_id = ANY($1) AND (s.is_hidden = false OR r.student_id = $2)
       ORDER BY r.updated_at ASC`,
      [itemIds, me]
    );
    for (const r of membersRes.rows) {
      if (!membersByItem.has(r.item_id)) membersByItem.set(r.item_id, []);
      membersByItem.get(r.item_id)!.push(r);
    }
    const finalRes = await pool.query(
      `SELECT item_id, stance, reason, finalized_by_name FROM consistency_finals WHERE item_id = ANY($1)`,
      [itemIds]
    );
    finalByItem = new Map(finalRes.rows.map((r) => [r.item_id, r]));
  }

  const result = items.map((it) => ({
    ...it,
    mine: mineByItem.get(it.id) || null,
    members: membersByItem.get(it.id) || [],
    final: finalByItem.get(it.id) || null,
  }));

  const allResolved = ran && items.every((i) => i.status === "resolved");

  return NextResponse.json({ ran, items: result, allResolved });
}
