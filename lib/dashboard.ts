// Read-only aggregation helpers for the teacher/TA monitoring dashboard.
// This module ONLY reads existing tables (students, responses, response_log,
// group_finals, finalize_log, stage_gate) — it never writes, and it has no
// effect whatsoever on the student-facing flow or chapter-gating logic.
import { getPool, getUnlockedLevel } from "./db";
import { FIELDS, ALL_KEYS, GROUP_STORY, LEVEL_BY_GROUP, MAX_LEVEL, getField } from "./fields";

export const STALL_WARN_MINUTES = Number(process.env.STALL_WARN_MINUTES || 8);
export const STALL_ALERT_MINUTES = Number(process.env.STALL_ALERT_MINUTES || 15);

export type FieldStatus = "done" | "in_progress" | "open" | "locked";
export type GroupStatus = "done" | "ok" | "warn" | "alert" | "not_started";

export type GroupSummary = {
  cls: string;
  groupNo: number;
  memberCount: number;
  completed: number;
  total: number;
  currentChapter: string | null; // chapter label, or null if all done
  lastActivityAt: Date | null;
  stallMinutes: number | null;
  status: GroupStatus;
  matrix: { key: string; label: string; status: FieldStatus }[];
};

const ORDERED_GROUPS = Array.from(new Set(FIELDS.map((f) => f.group)));

function classify(completed: number, total: number, stallMinutes: number | null): GroupStatus {
  if (completed === total) return "done";
  if (stallMinutes == null) return "not_started";
  if (stallMinutes >= STALL_ALERT_MINUTES) return "alert";
  if (stallMinutes >= STALL_WARN_MINUTES) return "warn";
  return "ok";
}

export async function getClassDashboard(cls: string): Promise<GroupSummary[]> {
  const pool = getPool();
  const unlockedLevel = await getUnlockedLevel(cls);

  const groupsRes = await pool.query(
    `SELECT group_no, COUNT(*) as member_count FROM students
     WHERE class = $1 AND group_no IS NOT NULL AND is_hidden = false
     GROUP BY group_no ORDER BY group_no`,
    [cls]
  );

  const finalsRes = await pool.query(
    `SELECT group_no, field_key FROM group_finals WHERE class = $1`,
    [cls]
  );
  const finalizedByGroup = new Map<number, Set<string>>();
  for (const r of finalsRes.rows) {
    if (!finalizedByGroup.has(r.group_no)) finalizedByGroup.set(r.group_no, new Set());
    finalizedByGroup.get(r.group_no)!.add(r.field_key);
  }

  // Latest individual-response activity per group (visible students only —
  // the hidden test account's own testing shouldn't page a real instructor).
  const activityRes = await pool.query(
    `SELECT rl.group_no, MAX(rl.created_at) as last_at
     FROM response_log rl JOIN students s ON s.student_id = rl.student_id
     WHERE rl.class = $1 AND s.is_hidden = false
     GROUP BY rl.group_no`,
    [cls]
  );
  const lastActivity = new Map<number, Date>(activityRes.rows.map((r) => [r.group_no, r.last_at as Date]));

  // Which fields currently have an unsubmitted individual draft (someone has
  // saved something but the group hasn't finalized it yet) — used to tell
  // "in progress" apart from merely "open, nobody's touched it".
  const draftRes = await pool.query(
    `SELECT DISTINCT r.group_no, r.field_key
     FROM responses r JOIN students s ON s.student_id = r.student_id
     WHERE r.class = $1 AND s.is_hidden = false AND r.content IS NOT NULL AND r.content <> ''`,
    [cls]
  );
  const draftedByGroup = new Map<number, Set<string>>();
  for (const r of draftRes.rows) {
    if (!draftedByGroup.has(r.group_no)) draftedByGroup.set(r.group_no, new Set());
    draftedByGroup.get(r.group_no)!.add(r.field_key);
  }

  const now = Date.now();

  return groupsRes.rows.map((g) => {
    const done = finalizedByGroup.get(g.group_no) || new Set();
    const drafted = draftedByGroup.get(g.group_no) || new Set();
    const matrix = ALL_KEYS.map((key) => {
      const chapterLevel = LEVEL_BY_GROUP[getField(key)!.group] ?? 99;
      let status: FieldStatus;
      if (chapterLevel > unlockedLevel) status = "locked";
      else if (done.has(key)) status = "done";
      else if (drafted.has(key)) status = "in_progress";
      else status = "open";
      return { key, label: getField(key)!.label, status };
    });

    const completed = matrix.filter((m) => m.status === "done").length;
    const firstUnfinished = ORDERED_GROUPS.find((grp) => {
      const keysInGroup = FIELDS.filter((f) => f.group === grp).map((f) => f.key);
      return keysInGroup.some((k) => !done.has(k)) && (LEVEL_BY_GROUP[grp] ?? 99) <= unlockedLevel;
    });
    const currentChapter = completed === ALL_KEYS.length
      ? null
      : (firstUnfinished ? `${GROUP_STORY[firstUnfinished]?.chapter || firstUnfinished}` : "尚未開放下一關");

    const last = lastActivity.get(g.group_no) || null;
    const stallMinutes = last ? Math.floor((now - new Date(last).getTime()) / 60000) : null;

    return {
      cls,
      groupNo: g.group_no,
      memberCount: Number(g.member_count),
      completed,
      total: ALL_KEYS.length,
      currentChapter,
      lastActivityAt: last,
      stallMinutes,
      status: classify(completed, ALL_KEYS.length, stallMinutes),
      matrix,
    };
  });
}
