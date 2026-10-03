import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { ensureReady } from "@/lib/db";
import { readSession } from "@/lib/session";
import { getItems, hasRunCheck } from "@/lib/consistency";
import { buildFinalPlanDocx } from "@/lib/report";
import { contentDispositionHeader } from "@/lib/format";

export async function GET(_req: NextRequest) {
  await ensureReady();
  const session = readSession();
  if (!session || session.role !== "student" || session.groupNo == null) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }
  const ran = await hasRunCheck(session.cls, session.groupNo);
  const items = await getItems(session.cls, session.groupNo);
  const allResolved = ran && items.every((i) => i.status === "resolved");
  if (!allResolved) {
    return NextResponse.json({ error: "AI 一致性檢核尚未全部通過，無法下載" }, { status: 409 });
  }
  const buffer = await buildFinalPlanDocx(session.cls, session.groupNo);
  if (!buffer) {
    return NextResponse.json({ error: "尚有未定稿的項目，無法匯出" }, { status: 409 });
  }
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": contentDispositionHeader("活動規劃書_下載.docx", "activity-plan-final.docx"),
    },
  });
}
