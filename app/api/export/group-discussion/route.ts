import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { ensureReady } from "@/lib/db";
import { readSession } from "@/lib/session";
import { FIELDS } from "@/lib/fields";
import { buildDocxForKeys } from "@/lib/report";
import { contentDispositionHeader } from "@/lib/format";

const KEYS = FIELDS.filter((f) => ["主題方向", "學習者評估內容規劃", "訪談綱要"].includes(f.group)).map((f) => f.key);

export async function GET(_req: NextRequest) {
  await ensureReady();
  const session = readSession();
  if (!session || session.role !== "student" || session.groupNo == null) {
    return NextResponse.json({ error: "請先登入並確認已分組" }, { status: 401 });
  }
  const buffer = await buildDocxForKeys(session.cls, session.groupNo, KEYS, "組內討論結果");
  if (!buffer) {
    return NextResponse.json({ error: "前三關尚有未定稿的項目，無法匯出" }, { status: 409 });
  }
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": contentDispositionHeader("組內討論結果.docx", "group-discussion.docx"),
    },
  });
}
