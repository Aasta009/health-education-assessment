import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { ensureReady } from "@/lib/db";
import { readSession } from "@/lib/session";
import { FIELDS } from "@/lib/fields";
import { buildDocxForKeys } from "@/lib/report";

const KEYS = FIELDS.filter((f) => f.group === "活動規劃書").map((f) => f.key);

export async function GET(_req: NextRequest) {
  await ensureReady();
  const session = readSession();
  if (!session || session.role !== "student" || session.groupNo == null) {
    return NextResponse.json({ error: "請先登入並確認已分組" }, { status: 401 });
  }
  const buffer = await buildDocxForKeys(session.cls, session.groupNo, KEYS, "活動規劃書_初版");
  if (!buffer) {
    return NextResponse.json({ error: "活動規劃書尚有未定稿的項目，無法匯出" }, { status: 409 });
  }
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="活動規劃書_初版.docx"`,
    },
  });
}
