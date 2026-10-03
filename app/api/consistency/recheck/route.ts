import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { ensureReady, getPool } from "@/lib/db";
import { readSession } from "@/lib/session";
import { getABText } from "@/lib/consistency";
import { recheckItem } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  await ensureReady();
  const session = readSession();
  if (!session || session.role !== "student" || session.groupNo == null) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }
  const { itemId } = await req.json();
  const pool = getPool();
  const itemRes = await pool.query(
    `SELECT id, class, group_no, issue_text, status, resolution FROM consistency_items WHERE id=$1`,
    [itemId]
  );
  const item = itemRes.rows[0];
  if (!item || item.class !== session.cls || item.group_no !== session.groupNo) {
    return NextResponse.json({ error: "找不到這個項目" }, { status: 404 });
  }
  if (item.status !== "flagged" || item.resolution !== "revise_pending") {
    return NextResponse.json({ error: "這個項目目前不需要重新檢核" }, { status: 409 });
  }

  const ab = await getABText(session.cls, session.groupNo);
  if (!ab) {
    return NextResponse.json({ error: "請先完成第四關與第五關" }, { status: 409 });
  }

  let resolved = false;
  let explanation = "";
  let raw = "";
  try {
    const result = await recheckItem(ab.a, ab.b, item.issue_text);
    resolved = result.resolved;
    explanation = result.explanation;
    raw = result.raw;
  } catch (e: any) {
    return NextResponse.json({ error: `AI 複查失敗：${e.message || e}` }, { status: 502 });
  }

  await pool.query(
    `INSERT INTO consistency_runs (class, group_no, kind, item_id, raw_response) VALUES ($1,$2,'recheck',$3,$4)`,
    [session.cls, session.groupNo, itemId, raw]
  );

  if (resolved) {
    await pool.query(
      `UPDATE consistency_items SET status='resolved', resolution='revised', updated_at=now() WHERE id=$1`,
      [itemId]
    );
  } else {
    // Still a problem — update the issue text to AI's latest explanation and
    // re-open it for a fresh group decision (clear the old stance so the
    // group has to look at the new wording, not the old one).
    await pool.query(
      `UPDATE consistency_items SET issue_text=$2, resolution=NULL, updated_at=now() WHERE id=$1`,
      [itemId, explanation || item.issue_text]
    );
    await pool.query(`DELETE FROM consistency_responses WHERE item_id=$1`, [itemId]);
    await pool.query(`DELETE FROM consistency_finals WHERE item_id=$1`, [itemId]);
  }

  return NextResponse.json({ ok: true, resolved });
}
