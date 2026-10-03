import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { ensureReady, getPool } from "@/lib/db";
import { readSession } from "@/lib/session";

// Wipes all submitted content for the hidden QA test student's group
// (113120009 lives in A班第1組) so the TA can run through the whole flow
// again from a clean slate. Only the TA role may trigger this. The student
// row itself is kept — only its answers/finalizations/AI-check data are
// cleared.
const TEST_CLASS = "A";
const TEST_GROUP = 1;

export async function POST(_req: NextRequest) {
  await ensureReady();
  const session = readSession();
  if (!session || session.role !== "staff" || session.kind !== "ta") {
    return NextResponse.json({ error: "只有助教可以執行這個操作" }, { status: 403 });
  }
  const pool = getPool();

  const itemIds = await pool.query(
    `SELECT id FROM consistency_items WHERE class=$1 AND group_no=$2`,
    [TEST_CLASS, TEST_GROUP]
  );
  const ids = itemIds.rows.map((r) => r.id);
  if (ids.length > 0) {
    await pool.query(`DELETE FROM consistency_responses WHERE item_id = ANY($1)`, [ids]);
    await pool.query(`DELETE FROM consistency_finals WHERE item_id = ANY($1)`, [ids]);
  }
  await pool.query(`DELETE FROM consistency_items WHERE class=$1 AND group_no=$2`, [TEST_CLASS, TEST_GROUP]);
  await pool.query(`DELETE FROM consistency_runs WHERE class=$1 AND group_no=$2`, [TEST_CLASS, TEST_GROUP]);
  await pool.query(`DELETE FROM finalize_log WHERE class=$1 AND group_no=$2`, [TEST_CLASS, TEST_GROUP]);
  await pool.query(`DELETE FROM group_finals WHERE class=$1 AND group_no=$2`, [TEST_CLASS, TEST_GROUP]);
  await pool.query(`DELETE FROM response_log WHERE class=$1 AND group_no=$2`, [TEST_CLASS, TEST_GROUP]);
  await pool.query(`DELETE FROM responses WHERE class=$1 AND group_no=$2`, [TEST_CLASS, TEST_GROUP]);

  return NextResponse.json({ ok: true });
}
