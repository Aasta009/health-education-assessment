import { getPool } from "./db";
import { FIELDS, getField } from "./fields";
import { getAIChapter, AIChapterConfig } from "./ai-chapters";

function keysForChapter(chapter: AIChapterConfig): string[] {
  return FIELDS.filter((f) => chapter.groupNames.includes(f.group)).map((f) => f.key);
}

// Whether the group has finalized every field this AI chapter depends on —
// this is the only gate on the AI module; it reads existing group_finals,
// it never touches stage_gate or the six-chapter flow.
export async function prerequisiteComplete(cls: string, groupNo: number, chapterKey: string): Promise<boolean> {
  const chapter = getAIChapter(chapterKey);
  if (!chapter) return false;
  const keys = keysForChapter(chapter);
  const pool = getPool();
  const res = await pool.query(
    `SELECT COUNT(DISTINCT field_key) as c FROM group_finals WHERE class=$1 AND group_no=$2 AND field_key = ANY($3)`,
    [cls, groupNo, keys]
  );
  return Number(res.rows[0].c) === keys.length;
}

async function buildBeforeAI(cls: string, groupNo: number, chapter: AIChapterConfig): Promise<string> {
  const keys = keysForChapter(chapter);
  const pool = getPool();
  const res = await pool.query(
    `SELECT field_key, content FROM group_finals WHERE class=$1 AND group_no=$2 AND field_key = ANY($3)`,
    [cls, groupNo, keys]
  );
  const map = new Map(res.rows.map((r) => [r.field_key, r.content as string]));
  return keys.map((k) => `【${getField(k)?.label || k}】\n${map.get(k) || ""}`).join("\n\n");
}

// Finds the session for (class, group, chapterKey), creating it (with a
// frozen Before-AI snapshot) on first access. Returns null if the
// prerequisite chapters aren't finalized yet.
export async function getOrCreateSession(cls: string, groupNo: number, chapterKey: string) {
  const chapter = getAIChapter(chapterKey);
  if (!chapter) return null;
  const pool = getPool();

  const existing = await pool.query(
    `SELECT * FROM ai_sessions WHERE class=$1 AND group_no=$2 AND chapter_key=$3`,
    [cls, groupNo, chapterKey]
  );
  if (existing.rows.length > 0) return existing.rows[0];

  const ok = await prerequisiteComplete(cls, groupNo, chapterKey);
  if (!ok) return null;

  const beforeAI = await buildBeforeAI(cls, groupNo, chapter);
  const inserted = await pool.query(
    `INSERT INTO ai_sessions (class, group_no, chapter_key, before_ai, status)
     VALUES ($1,$2,$3,$4,'open') RETURNING *`,
    [cls, groupNo, chapterKey, beforeAI]
  );
  await pool.query(
    `INSERT INTO ai_event_log (session_id, event_type, detail) VALUES ($1,'created',$2)`,
    [inserted.rows[0].id, `Before-AI 快照已建立`]
  );
  return inserted.rows[0];
}
