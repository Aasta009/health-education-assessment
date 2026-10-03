import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { ensureReady, getPool } from "@/lib/db";
import { readSession } from "@/lib/session";
import { recheckOneItem } from "@/lib/consistency";

export async function POST(_req: NextRequest) {
  await ensureReady();
  const session = readSession();
  if (!session || session.role !== "student" || session.groupNo == null) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }
  const pool = getPool();
  const pendingRes = await pool.query(
    `SELECT id, issue_text FROM consistency_items
     WHERE class=$1 AND group_no=$2 AND status='flagged' AND resolution='revise_pending'
     ORDER BY id ASC`,
    [session.cls, session.groupNo]
  );
  const pending = pendingRes.rows;
  if (pending.length === 0) {
    return NextResponse.json({ error: "目前沒有標記為「已修改」的項目" }, { status: 409 });
  }

  // Run sequentially (not in parallel) to stay well within Gemini's rate
  // limits for this key — a handful of items is a short wait either way.
  const results: { itemId: number; resolved?: boolean; error?: string }[] = [];
  for (const item of pending) {
    const result = await recheckOneItem(session.cls, session.groupNo, item);
    if ("error" in result) {
      results.push({ itemId: item.id, error: result.error });
    } else {
      results.push({ itemId: item.id, resolved: result.resolved });
    }
  }

  const failed = results.filter((r) => r.error);
  if (failed.length > 0 && failed.length === results.length) {
    // Every single one failed (e.g. Gemini is down) — surface that clearly.
    return NextResponse.json({ error: failed[0].error, results }, { status: 502 });
  }
  return NextResponse.json({ ok: true, results });
}
