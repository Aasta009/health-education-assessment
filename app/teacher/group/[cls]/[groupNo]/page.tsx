import { redirect } from "next/navigation";
import { ensureReady, getPool, getUnlockedLevel } from "@/lib/db";
import { readSession } from "@/lib/session";
import Link from "next/link";
import { FIELDS, ALL_KEYS, getField } from "@/lib/fields";
import { getClassDashboard, STALL_WARN_MINUTES, STALL_ALERT_MINUTES } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

const STATUS_DOT: Record<string, string> = {
  done: "#3F5B44", ok: "#5FA05A", warn: "#D6A756", alert: "#B33", not_started: "#c9c1ae",
};
const STATUS_LABEL: Record<string, string> = {
  done: "✓ 已完成", ok: "🟢 正常", warn: "🟡 停留", alert: "🔴 可能卡關", not_started: "尚未開始",
};

export default async function TeacherGroupDetail({ params }: { params: { cls: string; groupNo: string } }) {
  const session = readSession();
  if (!session || session.role !== "staff") redirect("/staff");

  await ensureReady();
  const pool = getPool();
  const cls = params.cls;
  const groupNo = Number(params.groupNo);

  const summary = (await getClassDashboard(cls)).find((g) => g.groupNo === groupNo);

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
  const timeline = await pool.query(
    `SELECT field_key, finalized_by_name, created_at FROM finalize_log
     WHERE class=$1 AND group_no=$2 ORDER BY created_at ASC`,
    [cls, groupNo]
  );
  const memberStats = await pool.query(
    `SELECT s.student_id, s.name, s.is_leader,
            COUNT(DISTINCT r.field_key) FILTER (WHERE r.content IS NOT NULL AND r.content <> '') as answered,
            MAX(r.updated_at) as last_at
     FROM students s LEFT JOIN responses r ON r.student_id = s.student_id
     WHERE s.class = $1 AND s.group_no = $2 AND s.is_hidden = false
     GROUP BY s.student_id, s.name, s.is_leader
     ORDER BY s.name`,
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

  const pct = summary ? Math.round((summary.completed / summary.total) * 100) : 0;

  return (
    <main className="container" style={{ paddingTop: 32 }}>
      <a href={`/teacher/dashboard?cls=${cls}`}>← 回到旅程總覽</a>
      <h2 className="story-title" style={{ fontSize: 20 }}>{cls} 班　第 {groupNo} 組</h2>

      {summary && (
        <div className="card-story">
          <p style={{ margin: "0 0 6px" }}>
            目前進度　{summary.completed} / {summary.total}　
            <span style={{ color: STATUS_DOT[summary.status] }}>{STATUS_LABEL[summary.status]}</span>
          </p>
          <div style={{ background: "#eee2cc", borderRadius: 4, height: 10, overflow: "hidden", marginBottom: 8 }}>
            <div style={{ width: `${pct}%`, height: "100%", background: STATUS_DOT[summary.status] }} />
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--ink-soft)" }}>
            {summary.currentChapter ? `目前關卡：${summary.currentChapter}` : "全部完成"}
            {summary.stallMinutes != null && summary.status !== "done" && `　｜　最後活動距今 ${summary.stallMinutes} 分鐘`}
          </p>
          {summary.status === "done" && (
            <a href={`/api/staff/export/group?cls=${cls}&groupNo=${groupNo}`}>
              <button className="btn-story" style={{ marginTop: 10 }}>匯出這組報告（Word）</button>
            </a>
          )}
        </div>
      )}

      {membersSeen.size > 0 && (
        <div className="card-story">
          <h4 style={{ marginTop: 0 }}>學生名單</h4>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--line)" }}>
                <th style={{ padding: 6 }}>學生</th>
                <th style={{ padding: 6 }}>狀態</th>
                <th style={{ padding: 6 }}>個人已填寫</th>
                <th style={{ padding: 6 }}>最後活動</th>
              </tr>
            </thead>
            <tbody>
              {memberStats.rows.map((m) => {
                const answered = Number(m.answered);
                const mins = m.last_at ? Math.floor((Date.now() - new Date(m.last_at).getTime()) / 60000) : null;
                const st = answered === ALL_KEYS.length ? "done" : mins == null ? "not_started" : mins >= STALL_ALERT_MINUTES ? "alert" : mins >= STALL_WARN_MINUTES ? "warn" : "ok";
                return (
                  <tr key={m.student_id} style={{ borderBottom: "1px solid #eee2cc" }}>
                    <td style={{ padding: 6 }}>
                      <Link href={`/teacher/student/${m.student_id}`}>{m.name}{m.is_leader ? "（組長）" : ""}</Link>
                    </td>
                    <td style={{ padding: 6, color: STATUS_DOT[st] }}>{STATUS_LABEL[st]}</td>
                    <td style={{ padding: 6 }}>{answered} / {ALL_KEYS.length}</td>
                    <td style={{ padding: 6 }}>{m.last_at ? new Date(m.last_at).toLocaleString("zh-TW") : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {timeline.rows.length > 0 && (
        <div className="card-story">
          <h4 style={{ marginTop: 0 }}>關卡時間軸</h4>
          {timeline.rows.map((t, i) => (
            <p key={i} style={{ margin: "4px 0", fontSize: 13.5 }}>
              {new Date(t.created_at).toLocaleString("zh-TW")}　✓ 完成「{getField(t.field_key)?.label || t.field_key}」（{t.finalized_by_name}）
            </p>
          ))}
        </div>
      )}

      <h3 className="story-title" style={{ fontSize: 17 }}>各關卡任務完成狀況</h3>
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
