import { NextRequest, NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { ensureReady, getPool } from "@/lib/db";
import { readSession } from "@/lib/session";
import { FIELDS, STAGE1_KEYS } from "@/lib/fields";
import { aiCompile } from "@/lib/ai";

export async function GET(_req: NextRequest) {
  await ensureReady();
  const session = readSession();
  if (!session || session.role !== "student" || session.groupNo == null) {
    return NextResponse.json({ error: "請先登入並確認已分組" }, { status: 401 });
  }
  const pool = getPool();
  const finals = await pool.query(
    `SELECT field_key, content FROM group_finals WHERE class=$1 AND group_no=$2 AND field_key = ANY($3)`,
    [session.cls, session.groupNo, STAGE1_KEYS]
  );
  const map = new Map(finals.rows.map((r) => [r.field_key, r.content as string]));
  const missing = STAGE1_KEYS.filter((k) => !map.has(k) || !map.get(k));
  if (missing.length > 0) {
    return NextResponse.json({ error: "尚有未定稿的項目，無法匯出" }, { status: 409 });
  }

  const stage1Fields = FIELDS.filter((f) => f.stage === 1);
  const sections = stage1Fields.map((f) => ({ label: f.label, content: map.get(f.key) || "" }));

  // Try AI-assisted smoothing; fall back to raw finalized text if no API key or call fails.
  let compiledText: string | null = null;
  try {
    compiledText = await aiCompile(sections);
  } catch {
    compiledText = null;
  }

  const brick = "3F5B44";
  const children: Paragraph[] = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
      children: [new TextRun({ text: "學習主題一：學習者評估報告（初版｜學習任務1）", bold: true, size: 32, color: brick })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 },
      children: [new TextRun({ text: `${session.cls} 班　第 ${session.groupNo} 組`, italics: true })] }),
  ];

  if (compiledText) {
    for (const block of compiledText.split(/\n{2,}/)) {
      if (!block.trim()) continue;
      children.push(new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: block.trim() })] }));
    }
  } else {
    for (const s of sections) {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 },
        children: [new TextRun({ text: s.label, bold: true, color: brick })] }));
      children.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: s.content || "" })] }));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="learner-assessment-stage1-${session.cls}${session.groupNo}.docx"`,
    },
  });
}
