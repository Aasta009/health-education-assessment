import { getPool } from "./db";
import { FIELDS, getField } from "./fields";
import { recheckItem } from "./gemini";

const ACTIVITY_KEYS = FIELDS.filter((f) => f.group === "活動規劃書").map((f) => f.key);

// A = AI迭代後最終結果 (chapter 4), B = 活動規劃書 (chapter 5), both pulled
// from their current group_finals. Returns null if either side isn't
// finalized yet.
export async function getABText(cls: string, groupNo: number): Promise<{ a: string; b: string } | null> {
  const pool = getPool();
  const keys = ["ai_result", ...ACTIVITY_KEYS];
  const res = await pool.query(
    `SELECT field_key, content FROM group_finals WHERE class=$1 AND group_no=$2 AND field_key = ANY($3)`,
    [cls, groupNo, keys]
  );
  const map = new Map(res.rows.map((r) => [r.field_key, r.content as string]));
  if (!map.get("ai_result")) return null;
  if (ACTIVITY_KEYS.some((k) => !map.get(k))) return null;

  const a = map.get("ai_result") || "";
  const b = ACTIVITY_KEYS.map((k) => `【${getField(k)?.label || k}】\n${map.get(k) || ""}`).join("\n\n");
  return { a, b };
}

export type ConsistencyItem = {
  id: number;
  issue_text: string;
  status: "flagged" | "resolved";
  resolution: string | null;
};

export async function getItems(cls: string, groupNo: number): Promise<ConsistencyItem[]> {
  const pool = getPool();
  const res = await pool.query(
    `SELECT id, issue_text, status, resolution FROM consistency_items
     WHERE class=$1 AND group_no=$2 ORDER BY id ASC`,
    [cls, groupNo]
  );
  return res.rows;
}

export async function hasRunCheck(cls: string, groupNo: number): Promise<boolean> {
  const pool = getPool();
  const res = await pool.query(
    `SELECT 1 FROM consistency_runs WHERE class=$1 AND group_no=$2 AND kind='full' LIMIT 1`,
    [cls, groupNo]
  );
  return res.rows.length > 0;
}

// Rechecks one item against the current A/B text and applies the result.
// Shared by both the single-item and "recheck all" routes so the logic
// (and the re-open-on-still-flagged behaviour) only lives in one place.
export async function recheckOneItem(
  cls: string, groupNo: number, item: { id: number; issue_text: string }
): Promise<{ resolved: boolean } | { error: string }> {
  const ab = await getABText(cls, groupNo);
  if (!ab) return { error: "請先完成第四關與第五關" };

  const pool = getPool();
  let resolved = false;
  let explanation = "";
  let raw = "";
  try {
    const result = await recheckItem(ab.a, ab.b, item.issue_text);
    resolved = result.resolved;
    explanation = result.explanation;
    raw = result.raw;
  } catch (e: any) {
    return { error: `AI 複查失敗：${e.message || e}` };
  }

  await pool.query(
    `INSERT INTO consistency_runs (class, group_no, kind, item_id, raw_response) VALUES ($1,$2,'recheck',$3,$4)`,
    [cls, groupNo, item.id, raw]
  );

  if (resolved) {
    await pool.query(
      `UPDATE consistency_items SET status='resolved', resolution='revised', updated_at=now() WHERE id=$1`,
      [item.id]
    );
  } else {
    await pool.query(
      `UPDATE consistency_items SET issue_text=$2, resolution=NULL, updated_at=now() WHERE id=$1`,
      [item.id, explanation || item.issue_text]
    );
    await pool.query(`DELETE FROM consistency_responses WHERE item_id=$1`, [item.id]);
    await pool.query(`DELETE FROM consistency_finals WHERE item_id=$1`, [item.id]);
  }
  return { resolved };
}
