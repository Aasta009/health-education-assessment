import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { getPool } from "./db";
import { FIELDS, getField } from "./fields";

const FOREST = "3F5B44";

function heading(text: string) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, color: FOREST })] });
}
function body(text: string) {
  return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: text || "" })] });
}

// Builds a docx covering exactly the given field keys, pulling each one's
// current group-finalized content. Returns null if any of those keys aren't
// finalized yet. Used both for "組內討論結果" (第一～三關) and
// "活動規劃書_初版" (第五關).
export async function buildDocxForKeys(cls: string, groupNo: number, keys: string[], title: string): Promise<Buffer | null> {
  const pool = getPool();
  const finals = await pool.query(
    `SELECT field_key, content FROM group_finals WHERE class=$1 AND group_no=$2 AND field_key = ANY($3)`,
    [cls, groupNo, keys]
  );
  const map = new Map(finals.rows.map((r) => [r.field_key, r.content as string]));
  const missing = keys.filter((k) => !map.has(k) || !map.get(k));
  if (missing.length > 0) return null;

  const children: Paragraph[] = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
      children: [new TextRun({ text: title, bold: true, size: 32, color: FOREST })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 },
      children: [new TextRun({ text: `${cls} 班　第 ${groupNo} 組`, italics: true })] }),
  ];
  for (const k of keys) {
    const f = FIELDS.find((x) => x.key === k);
    children.push(heading(f?.label || k));
    children.push(body(map.get(k) || ""));
  }

  const doc = new Document({ sections: [{ children }] });
  return Buffer.from(await Packer.toBuffer(doc));
}
