// Read-only aggregation helpers for the teacher/TA monitoring dashboard.
// This module ONLY reads existing tables (students, responses, response_log,
// group_finals, finalize_log) — it never writes, and it has no effect
// whatsoever on the student-facing flow.
import { getPool } from "./db";
import { FIELDS, ALL_KEYS, GROUP_STORY, getField } from "./fields";

export type FieldStatus = "done" | "in_progress" | "open";
export type GroupStatus = "done" | "in_progress" | "not_started";

export type GroupSummary = {
  cls: string;
  groupNo: number;
  memberCount: number;
  completed: number;
  total: number;
  currentChapter: string | null; // chapter label, or null if all done
  status: GroupStatus;
  matrix: { key: string; label: string; status: FieldStatus }[];
};

const ORDERED_GROUPS = Array.from(new Set(FIELDS.map((f) => f.group)));

export async function getClassDashboard(cls: string): Promise<GroupSummary[]> {
  const pool = getPool();

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

  return groupsRes.rows.map((g) => {
    const done = finalizedByGroup.get(g.group_no) || new Set();
    const drafted = draftedByGroup.get(g.group_no) || new Set();
    const matrix = ALL_KEYS.map((key) => {
      let status: FieldStatus;
      if (done.has(key)) status = "done";
      else if (drafted.has(key)) status = "in_progress";
      else status = "open";
      return { key, label: getField(key)!.label, status };
    });

    const completed = matrix.filter((m) => m.status === "done").length;
    const anyStarted = matrix.some((m) => m.status !== "open");
    const firstUnfinished = ORDERED_GROUPS.find((grp) => {
      const keysInGroup = FIELDS.filter((f) => f.group === grp).map((f) => f.key);
      return keysInGroup.some((k) => !done.has(k));
    });
    const currentChapter = completed === ALL_KEYS.length
      ? null
      : (firstUnfinished ? GROUP_STORY[firstUnfinished]?.chapter || firstUnfinished : null);

    const status: GroupStatus = completed === ALL_KEYS.length ? "done" : anyStarted ? "in_progress" : "not_started";

    return {
      cls,
      groupNo: g.group_no,
      memberCount: Number(g.member_count),
      completed,
      total: ALL_KEYS.length,
      currentChapter,
      status,
      matrix,
    };
  });
}
