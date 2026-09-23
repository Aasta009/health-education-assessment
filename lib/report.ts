import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { getPool } from "./db";
import { getField, ALL_KEYS, STAGE1_KEYS } from "./fields";
import { aiCompile } from "./ai";

const FOREST = "3F5B44";

function heading(text: string) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 80 },
    children: [new TextRun({ text, bold: true, color: FOREST })] });
}
function body(text: string) {
  return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: text || "" })] });
}

// The complete, template-faithful report: 前置作業 + 活動規劃書 + 學習者評估結果 +
// 確立主題 + 個人反思心得（逐人列出，不合併）+ 工作分配 + 參考資料.
// Returns null if any of the group's stage-1 or stage-2 fields aren't
// finalized yet.
export async function buildFullReportDocx(cls: string, groupNo: number): Promise<Buffer | null> {
  const pool = getPool();
  const finals = await pool.query(
    `SELECT field_key, content FROM group_finals WHERE class=$1 AND group_no=$2 AND field_key = ANY($3)`,
    [cls, groupNo, ALL_KEYS]
  );
  const map = new Map(finals.rows.map((r) => [r.field_key, r.content as string]));
  const missing = ALL_KEYS.filter((k) => !map.has(k) || !map.get(k));
  if (missing.length > 0) return null;

  const reflections = await pool.query(
    `SELECT name, content FROM reflections WHERE class=$1 AND group_no=$2 AND content IS NOT NULL AND content <> ''
     ORDER BY updated_at ASC`,
    [cls, groupNo]
  );

  const g = (key: string) => map.get(key) || "";

  const children: Paragraph[] = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
      children: [new TextRun({ text: "學習主題一：學習者評估報告", bold: true, size: 32, color: FOREST })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 },
      children: [new TextRun({ text: `${cls} 班　第 ${groupNo} 組`, italics: true })] }),

    heading("一、學習者評估前置作業"),
    heading("本組欲聚焦的「失智友善」主題方向"), body(g("topic")),
    heading("學習者評估內容"),
    body(`學習需求：${g("need")}`),
    body(`學習準備度：${g("ready")}`),
    body(`學習風格：${g("style")}`),
    body(`教學環境：${g("env")}`),
    heading("關鍵人物（導師／護理師）訪談綱要"), body(g("interview")),
    heading("學習者評估活動規劃書"),
    body(`活動主題：${g("act_topic")}`),
    body(`活動規劃說明：${g("act_desc")}`),
    body(`活動流程（細流）：${g("act_flow")}`),
    body(`工作分配：${g("act_roles")}`),
    body(`道具製作：${g("act_props")}`),

    heading("二、學習者評估結果"),
    heading("國小學童失智健康識能評估"),
    body(`學習需求：${g("result_need")}`),
    heading("學習準備度"),
    body(`生理準備度：${g("result_ready_phys")}`),
    body(`健康狀況：${g("result_ready_health")}`),
    body(`情緒：${g("result_ready_emotion")}`),
    body(`經驗及知識準備度：${g("result_ready_knowledge")}`),
    heading("學習風格"), body(g("result_style")),
    heading("教學環境評估"), body(g("result_env")),
    heading("教學者的評估"), body(g("result_teacher")),
    heading("確立衛生教育主題"), body(g("final_topic")),
  ];

  children.push(heading("反思心得（個人）"));
  if (reflections.rows.length === 0) {
    children.push(body("（尚無組員填寫）"));
  } else {
    for (const r of reflections.rows) {
      children.push(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: r.name, bold: true })] }));
      children.push(body(r.content));
    }
  }

  children.push(heading("工作分配"), body(g("final_roles")));
  children.push(heading("參考資料"), body(g("final_refs")));

  const doc = new Document({ sections: [{ children }] });
  return Buffer.from(await Packer.toBuffer(doc));
}

// Kept for the "download a preview once stage 1 is done" button — an
// AI-smoothed early draft covering just 學習任務1, before results exist.
export async function buildStage1PreviewDocx(cls: string, groupNo: number): Promise<Buffer | null> {
  const pool = getPool();
  const finals = await pool.query(
    `SELECT field_key, content FROM group_finals WHERE class=$1 AND group_no=$2 AND field_key = ANY($3)`,
    [cls, groupNo, STAGE1_KEYS]
  );
  const map = new Map(finals.rows.map((r) => [r.field_key, r.content as string]));
  const missing = STAGE1_KEYS.filter((k) => !map.has(k) || !map.get(k));
  if (missing.length > 0) return null;

  const sections = STAGE1_KEYS.map((k) => ({ label: getField(k)?.label || k, content: map.get(k) || "" }));
  let compiledText: string | null = null;
  try { compiledText = await aiCompile(sections); } catch { compiledText = null; }

  const children: Paragraph[] = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
      children: [new TextRun({ text: "學習主題一：學習者評估報告（初版｜學習任務1）", bold: true, size: 32, color: FOREST })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 },
      children: [new TextRun({ text: `${cls} 班　第 ${groupNo} 組`, italics: true })] }),
  ];
  if (compiledText) {
    for (const block of compiledText.split(/\n{2,}/)) {
      if (!block.trim()) continue;
      children.push(body(block.trim()));
    }
  } else {
    for (const s of sections) {
      children.push(heading(s.label));
      children.push(body(s.content));
    }
  }
  const doc = new Document({ sections: [{ children }] });
  return Buffer.from(await Packer.toBuffer(doc));
}
