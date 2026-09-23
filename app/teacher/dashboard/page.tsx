import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureReady, getPool, getUnlockedLevel } from "@/lib/db";
import { readSession } from "@/lib/session";
import { STAGE1_KEYS } from "@/lib/fields";
import GateControl from "./GateControl";

export const dynamic = "force-dynamic";

export default async function TeacherDashboard() {
  const session = readSession();
  if (!session || session.role !== "staff") redirect("/staff");

  await ensureReady();
  const pool = getPool();

  const groupsRes = await pool.query(
    `SELECT class, group_no, COUNT(*) as member_count
     FROM students WHERE group_no IS NOT NULL
     GROUP BY class, group_no ORDER BY class, group_no`
  );

  const finalsRes = await pool.query(
    `SELECT class, group_no, COUNT(DISTINCT field_key) as done
     FROM group_finals WHERE field_key = ANY($1)
     GROUP BY class, group_no`,
    [STAGE1_KEYS]
  );
  const doneMap = new Map(finalsRes.rows.map((r) => [`${r.class}-${r.group_no}`, Number(r.done)]));

  const unassignedRes = await pool.query(
    `SELECT COUNT(*) as c FROM students WHERE group_no IS NULL`
  );

  const levelA = await getUnlockedLevel("A");
  const levelB = await getUnlockedLevel("B");

  const byClass: Record<string, typeof groupsRes.rows> = {};
  for (const g of groupsRes.rows) {
    (byClass[g.class] ||= []).push(g);
  }

  return (
    <main style={{ minHeight: "100vh" }}>
      <div style={{ width: "100%", aspectRatio: "1600 / 900", maxHeight: 260, overflow: "hidden" }}>
        <img src="/images/staff-desk-map.jpg" alt="引路人的書桌與地圖"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
      <div className="container" style={{ paddingTop: 24 }}>
      <h2 className="story-title" style={{ fontSize: 20 }}>
        引路人視角（{session.kind === "ta" ? "助教" : "教師"}／唯讀）
      </h2>
      <p style={{ color: "#7a6a52" }}>尚未分組人數：{unassignedRes.rows[0].c}</p>

      {session.kind === "ta" && <GateControl initial={{ A: levelA, B: levelB }} />}

      <div className="card-story">
        <h4 style={{ marginTop: 0 }}>匯出</h4>
        <a href="/api/staff/export/raw"><button className="btn-story outline">匯出所有學生完整學習過程（Excel）</button></a>
      </div>

      {Object.keys(byClass).sort().map((cls) => (
        <div className="card-story" key={cls}>
          <h3 className="story-title" style={{ fontSize: 18, marginTop: 0 }}>{cls} 班</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid var(--forest)" }}>
                <th style={{ padding: 8 }}>組別</th>
                <th style={{ padding: 8 }}>人數</th>
                <th style={{ padding: 8 }}>學習任務1 完成度</th>
                <th style={{ padding: 8 }}></th>
                <th style={{ padding: 8 }}></th>
              </tr>
            </thead>
            <tbody>
              {byClass[cls].map((g) => {
                const done = doneMap.get(`${g.class}-${g.group_no}`) || 0;
                const allDone = done === STAGE1_KEYS.length;
                return (
                  <tr key={`${g.class}-${g.group_no}`} style={{ borderBottom: "1px solid #eee2cc" }}>
                    <td style={{ padding: 8 }}>第 {g.group_no} 組</td>
                    <td style={{ padding: 8 }}>{g.member_count}</td>
                    <td style={{ padding: 8 }}>{done} / {STAGE1_KEYS.length}</td>
                    <td style={{ padding: 8 }}>
                      <Link href={`/teacher/group/${g.class}/${g.group_no}`}>查看組別討論過程</Link>
                    </td>
                    <td style={{ padding: 8 }}>
                      {allDone ? (
                        <a href={`/api/staff/export/group?cls=${g.class}&groupNo=${g.group_no}`}>匯出報告(Word)</a>
                      ) : (
                        <span style={{ color: "#bbb" }}>尚未完成</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
      </div>
    </main>
  );
}
