import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { ensureReady } from "@/lib/db";
import { readSession } from "@/lib/session";
import { buildStage1Docx } from "@/lib/report";

export async function GET(req: NextRequest) {
  await ensureReady();
  const session = readSession();
  if (!session || session.role !== "staff") {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const cls = searchParams.get("cls");
  const groupNo = Number(searchParams.get("groupNo"));
  if (!cls || !groupNo) {
    return NextResponse.json({ error: "參數錯誤" }, { status: 400 });
  }
  const buffer = await buildStage1Docx(cls, groupNo);
  if (!buffer) {
    return NextResponse.json({ error: "這一組尚未完成定稿，無法匯出" }, { status: 409 });
  }
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="learner-assessment-${cls}${groupNo}.docx"`,
    },
  });
}
