import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { ensureReady, getPool } from "@/lib/db";
import { readSession } from "@/lib/session";

export async function GET(_req: NextRequest) {
  await ensureReady();
  const session = readSession();
  if (!session || session.role !== "student" || session.groupNo == null) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }
  const pool = getPool();
  const res = await pool.query(
    `SELECT field_key FROM group_finals WHERE class=$1 AND group_no=$2`,
    [session.cls, session.groupNo]
  );
  return NextResponse.json({ doneKeys: res.rows.map((r) => r.field_key) });
}
