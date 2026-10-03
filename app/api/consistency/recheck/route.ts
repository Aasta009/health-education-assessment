import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { ensureReady, getPool } from "@/lib/db";
import { readSession } from "@/lib/session";
import { recheckOneItem } from "@/lib/consistency";

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

  const result = await recheckOneItem(session.cls, session.groupNo, item);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  return NextResponse.json({ ok: true, resolved: result.resolved });
}
