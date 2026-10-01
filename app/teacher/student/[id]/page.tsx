import { redirect } from "next/navigation";
import { ensureReady, getPool } from "@/lib/db";
import { readSession } from "@/lib/session";
import { FIELDS, ALL_KEYS } from "@/lib/fields";
import { formatTaipei } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function StudentProfile({ params }: { params: { id: string } }) {
  const session = readSession();
  if (!session || session.role !== "staff") redirect("/staff");

  await ensureReady();
  const pool = getPool();

  const studentRes = await pool.query(
    `SELECT student_id, name, class, group_no, is_leader FROM students WHERE student_id = $1`,
    [params.id]
  );
  if (studentRes.rows.length === 0) {
    return <main className="container" style={{ paddingTop: 32 }}><p>查無此學生</p></main>;
  }
  const student = studentRes.rows[0];

  const responses = await pool.query(
    `SELECT field_key, content, updated_at FROM responses WHERE student_id = $1`,
    [params.id]
  );
  const byKey = new Map(responses.rows.map((r) => [r.field_key, r]));
  const answeredCount = Array.from(byKey.values()).filter((r) => r.content && r.content.trim()).length;
  const lastActivity = responses.rows.reduce<Date | null>((max, r) => {
    const t = new Date(r.updated_at);
    return !max || t > max ? t : max;
  }, null);

  return (
    <main className="container" style={{ paddingTop: 32 }}>
      <a href={`/teacher/group/${student.class}/${student.group_no}`}>← 回到組別</a>
      <h2 className="story-title" style={{ fontSize: 20 }}>{student.name}</h2>
      <p style={{ color: "var(--ink-soft)" }}>
        學號 {student.student_id}　{student.class} 班　第 {student.group_no} 組{student.is_leader ? "（組長）" : ""}
      </p>
      <div className="card-story">
        <p style={{ margin: "0 0 4px" }}>個人已填寫：{answeredCount} / {ALL_KEYS.length}</p>
        <p style={{ margin: 0, fontSize: 13.5, color: "var(--ink-soft)" }}>
          最後活動時間：{lastActivity ? formatTaipei(lastActivity) : "尚無紀錄"}
        </p>
      </div>
      {FIELDS.map((f) => {
        const r = byKey.get(f.key);
        return (
          <div className="card-story" key={f.key}>
            <h4 style={{ marginTop: 0 }}>{f.label}</h4>
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{r ? r.content : <span style={{ color: "#bbb" }}>（尚未填寫）</span>}</p>
          </div>
        );
      })}
    </main>
  );
}
