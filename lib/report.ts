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

// Final-format export ("活動規劃書_下載"), matching the professor's supplied
// template exactly: 小組別/學生姓名/指導教師/日期 header, then 學習者評估
// 前置作業 (topic, need/ready/style/env, interview) and 學習者評估活動規劃書
// (the five activity fields). Returns null if any required field is
// unfinalized.
export async function buildFinalPlanDocx(cls: string, groupNo: number): Promise<Buffer | null> {
  const pool = getPool();
  const keys = ["topic", "need", "ready", "style", "env", "interview_teacher", "interview_nurse",
    "act_topic", "act_desc", "act_flow", "act_roles", "act_props"];
  const finals = await pool.query(
    `SELECT field_key, content FROM group_finals WHERE class=$1 AND group_no=$2 AND field_key = ANY($3)`,
    [cls, groupNo, keys]
  );
  const map = new Map(finals.rows.map((r) => [r.field_key, r.content as string]));
  const missing = keys.filter((k) => !map.has(k) || !map.get(k));
  if (missing.length > 0) return null;
  const g = (k: string) => map.get(k) || "";

  const membersRes = await pool.query(
    `SELECT name FROM students WHERE class=$1 AND group_no=$2 AND is_hidden = false ORDER BY name`,
    [cls, groupNo]
  );
  const memberNames = membersRes.rows.map((r) => r.name).join("、");

  const today = new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

  const children: Paragraph[] = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
      children: [new TextRun({ text: "學習主題一：學習者評估報告", bold: true, size: 32, color: FOREST })] }),
    body(`小組別：${cls} 班　第 ${groupNo} 組`),
    body(`學生姓名：${memberNames}`),
    body(`指導教師：＿＿＿＿＿＿`),
    body(`日期：${today}`),

    heading("學習者評估前置作業"),
    body(`本組聚焦的「失智友善」主題方向為：${g("topic")}`),
    heading("學習者評估內容"),
    body(`學習需求：${g("need")}`),
    body(`學習準備度：${g("ready")}`),
    body(`學習風格：${g("style")}`),
    body(`教學環境：${g("env")}`),
    heading("關鍵人物（導師／護理師）訪談綱要"),
    body(`導師：${g("interview_teacher")}`),
    body(`護理師：${g("interview_nurse")}`),

    heading("學習者評估活動規劃書"),
    body(`活動主題：${g("act_topic")}`),
    body(`活動規劃說明：${g("act_desc")}`),
    body(`活動流程（細流）：${g("act_flow")}`),
    body(`工作分配（主持人、紀錄、工具準備等）：${g("act_roles")}`),
    body(`道具製作（若有）：${g("act_props")}`),
  ];

  const doc = new Document({ sections: [{ children }] });
  return Buffer.from(await Packer.toBuffer(doc));
}
