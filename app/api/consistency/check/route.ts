import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { ensureReady, getPool } from "@/lib/db";
import { readSession } from "@/lib/session";
import { getABText, hasRunCheck } from "@/lib/consistency";
import { checkConsistency } from "@/lib/gemini";

export async function POST(_req: NextRequest) {
  await ensureReady();
  const session = readSession();
  if (!session || session.role !== "student" || session.groupNo == null) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }
  const ab = await getABText(session.cls, session.groupNo);
  if (!ab) {
    return NextResponse.json({ error: "請先完成第四關與第五關" }, { status: 409 });
  }
  const already = await hasRunCheck(session.cls, session.groupNo);
  if (already) {
    return NextResponse.json({ error: "已經檢核過了" }, { status: 409 });
  }

  const pool = getPool();
  let issues: string[] = [];
  let raw = "";
  try {
    const result = await checkConsistency(ab.a, ab.b);
    issues = result.issues;
    raw = result.raw;
  } catch (e: any) {
    return NextResponse.json({ error: `AI 檢核失敗：${e.message || e}` }, { status: 502 });
  }

  await pool.query(
    `INSERT INTO consistency_runs (class, group_no, kind, raw_response) VALUES ($1,$2,'full',$3)`,
    [session.cls, session.groupNo, raw]
  );
  for (const issue of issues) {
    await pool.query(
      `INSERT INTO consistency_items (class, group_no, issue_text, status) VALUES ($1,$2,$3,'flagged')`,
      [session.cls, session.groupNo, issue]
    );
  }

  return NextResponse.json({ ok: true, issueCount: issues.length });
}
