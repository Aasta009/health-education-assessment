import { redirect } from "next/navigation";
import { ensureReady, getPool } from "@/lib/db";
import { readSession } from "@/lib/session";
import Link from "next/link";
import { FIELDS } from "@/lib/fields";

export const dynamic = "force-dynamic";

export default async function TeacherGroupDetail({ params }: { params: { cls: string; groupNo: string } }) {
  const session = readSession();
  if (!session || session.role !== "staff") redirect("/staff");

  await ensureReady();
  const pool = getPool();
  const cls = params.cls;
  const groupNo = Number(params.groupNo);

  const responses = await pool.query(
    `SELECT r.field_key, r.student_id, s.name, r.content, r.updated_at
     FROM responses r JOIN students s ON s.student_id = r.student_id
     WHERE r.class=$1 AND r.group_no=$2 ORDER BY r.field_key, r.updated_at`,
    [cls, groupNo]
  );
  const finals = await pool.query(
    `SELECT field_key, content, finalized_by_name, updated_at FROM group_finals
     WHERE class=$1 AND group_no=$2`,
    [cls, groupNo]
  );
  const finalMap = new Map(finals.rows.map((r) => [r.field_key, r]));
  const byField = new Map<string, any[]>();
  const membersSeen = new Map<string, string>();
  for (const r of responses.rows) {
    if (!byField.has(r.field_key)) byField.set(r.field_key, []);
    byField.get(r.field_key)!.push(r);
    membersSeen.set(r.student_id, r.name);
  }

  return (
    <main className="container" style={{ paddingTop: 32 }}>
      <a href="/teacher/dashboard">← 回到旅程總覽</a>
      <h2 className="story-title" style={{ fontSize: 20 }}>{cls} 班　第 {groupNo} 組</h2>
      {membersSeen.size > 0 && (
        <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>
          組員：{Array.from(membersSeen.entries()).map(([id, name]) => (
            <Link key={id} href={`/teacher/student/${id}`} style={{ marginRight: 10 }}>{name}</Link>
          ))}
        </p>
      )}
      {FIELDS.map((f) => {
        const members = byField.get(f.key) || [];
        const final = finalMap.get(f.key);
        return (
          <div className="card-story" key={f.key}>
            <h4 style={{ marginTop: 0 }}>{f.label}</h4>
            {members.length === 0 && <p style={{ color: "#999" }}>尚無成員填寫</p>}
            {members.map((m) => (
              <p key={m.student_id} style={{ margin: "4px 0" }}>
                <Link href={`/teacher/student/${m.student_id}`}><b>{m.name}：</b></Link>{m.content}
              </p>
            ))}
            <div style={{ marginTop: 8, padding: 10, background: "#f3ecdd", borderRadius: 8 }}>
              <b>組內定稿版本：</b>
              <p style={{ margin: "4px 0" }}>{final ? final.content : "（尚未定稿）"}</p>
              {final && <p style={{ fontSize: 12, color: "#7a6a52", margin: 0 }}>定稿人：{final.finalized_by_name}</p>}
            </div>
          </div>
        );
      })}
    </main>
  );
}
