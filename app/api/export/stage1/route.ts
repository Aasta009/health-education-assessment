import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { ensureReady } from "@/lib/db";
import { readSession } from "@/lib/session";
import { buildStage1Docx } from "@/lib/report";

export async function GET(_req: NextRequest) {
  await ensureReady();
  const session = readSession();
  if (!session || session.role !== "student" || session.groupNo == null) {
    return NextResponse.json({ error: "請先登入並確認已分組" }, { status: 401 });
  }
  const buffer = await buildStage1Docx(session.cls, session.groupNo);
  if (!buffer) {
    return NextResponse.json({ error: "尚有未定稿的項目，無法匯出" }, { status: 409 });
  }
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="learner-assessment-stage1-${session.cls}${session.groupNo}.docx"`,
    },
  });
}
