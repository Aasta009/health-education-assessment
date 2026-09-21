import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { getPool } from "./db";
import { FIELDS, STAGE1_KEYS } from "./fields";
import { aiCompile } from "./ai";

// Shared by both the student's own "download my group's report" button and
// the staff export-any-group endpoint. Returns null when the group hasn't
// finished finalizing every stage-1 field yet.
export async function buildStage1Docx(cls: string, groupNo: number): Promise<Buffer | null> {
  const pool = getPool();
  const finals = await pool.query(
    `SELECT field_key, content FROM group_finals WHERE class=$1 AND group_no=$2 AND field_key = ANY($3)`,
    [cls, groupNo, STAGE1_KEYS]
  );
  const map = new Map(finals.rows.map((r) => [r.field_key, r.content as string]));
  const missing = STAGE1_KEYS.filter((k) => !map.has(k) || !map.get(k));
  if (missing.length > 0) return null;

  const stage1Fields = FIELDS.filter((f) => f.stage === 1);
  const sections = stage1Fields.map((f) => ({ label: f.label, content: map.get(f.key) || "" }));

  let compiledText: string | null = null;
  try {
    compiledText = await aiCompile(sections);
  } catch {
    compiledText = null;
  }

  const forest = "3F5B44";
  const children: Paragraph[] = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
      children: [new TextRun({ text: "學習主題一：學習者評估報告（初版｜學習任務1）", bold: true, size: 32, color: forest })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 },
      children: [new TextRun({ text: `${cls} 班　第 ${groupNo} 組`, italics: true })] }),
  ];

  if (compiledText) {
    for (const block of compiledText.split(/\n{2,}/)) {
      if (!block.trim()) continue;
      children.push(new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: block.trim() })] }));
    }
  } else {
    for (const s of sections) {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 },
        children: [new TextRun({ text: s.label, bold: true, color: forest })] }));
      children.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: s.content || "" })] }));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return Buffer.from(await Packer.toBuffer(doc));
}
