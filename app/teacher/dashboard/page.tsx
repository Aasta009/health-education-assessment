import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureReady, getPool } from "@/lib/db";
import { readSession } from "@/lib/session";
import { ALL_KEYS, FIELDS } from "@/lib/fields";
import { getClassDashboard } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

const STATUS_DOT: Record<string, string> = {
  done: "#3F5B44",
  in_progress: "#D6A756",
  not_started: "#c9c1ae",
};
const STATUS_LABEL: Record<string, string> = {
  done: "✓ 已完成", in_progress: "進行中", not_started: "尚未開始",
};

// Each chapter gets its own color so the dot strip shows at a glance which
// chapter a group is stuck on, not just how many fields are done overall.
const CHAPTER_COLORS: Record<string, string> = {
  "主題方向": "#4A6FA1",
  "學習者評估內容規劃": "#C1673F",
  "訪談綱要": "#3F5B44",
  "AI迭代結果": "#B3862D",
  "活動規劃書": "#7B4F9E",
};
const KEY_TO_GROUP: Record<string, string> = Object.fromEntries(FIELDS.map((f) => [f.key, f.group]));
const SYMBOL: Record<string, string> = { done: "●", in_progress: "◐", open: "○" };
function cellStyle(status: string, key: string) {
  const color = status === "open" ? "#cfc4a8" : CHAPTER_COLORS[KEY_TO_GROUP[key]] || "#cfc4a8";
  return { symbol: SYMBOL[status], color };
}

export default async function TeacherDashboard({ searchParams }: { searchParams: { cls?: string } }) {
  const session = readSession();
  if (!session || session.role !== "staff") redirect("/staff");

  await ensureReady();
  const pool = getPool();
  const cls = searchParams.cls === "B" ? "B" : "A";

  const groups = await getClassDashboard(cls);

  const unassignedRes = await pool.query(
    `SELECT COUNT(*) as c FROM students WHERE group_no IS NULL AND is_hidden = false`
  );

  const totalGroups = groups.length;
  const doneGroups = groups.filter((g) => g.status === "done").length;
  const inProgress = groups.filter((g) => g.status === "in_progress").length;
  const avgProgress = totalGroups ? (groups.reduce((s, g) => s + g.completed, 0) / totalGroups).toFixed(1) : "0";

  return (
    <main style={{ minHeight: "100vh" }}>
      <div style={{ width: "100%", aspectRatio: "1600 / 900", maxHeight: 200, overflow: "hidden", opacity: 0.9 }}>
        <img src="/images/staff-desk-map.jpg" alt="引路人的書桌與地圖"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
      <div className="container" style={{ paddingTop: 20 }}>
        <h2 className="story-title" style={{ fontSize: 20, marginBottom: 4 }}>
          課程進度 Dashboard（{session.kind === "ta" ? "助教" : "教師"}／唯讀）
        </h2>
        <p style={{ color: "#7a6a52", fontSize: 13, margin: "0 0 14px" }}>
          尚未分組人數：{unassignedRes.rows[0].c}
        </p>

        {/* Class tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <Link href="/teacher/dashboard?cls=A">
            <button className={cls === "A" ? "btn-story" : "btn-story outline"}>A 班</button>
          </Link>
          <Link href="/teacher/dashboard?cls=B">
            <button className={cls === "B" ? "btn-story" : "btn-story outline"}>B 班</button>
          </Link>
        </div>

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10, marginBottom: 18 }}>
          {[
            { label: "總組數", value: totalGroups },
            { label: "進行中", value: inProgress },
            { label: "已完成", value: doneGroups },
            { label: "平均進度", value: `${avgProgress}/${ALL_KEYS.length}` },
          ].map((kpi) => (
            <div key={kpi.label} style={{ background: "#FCF8ED", border: "1px solid var(--line)", borderRadius: 8, padding: "12px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--forest)" }}>{kpi.value}</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{kpi.label}</div>
            </div>
          ))}
        </div>

        <div className="card-story">
          <h4 style={{ marginTop: 0 }}>匯出</h4>
          <a href="/api/staff/export/raw"><button className="btn-story outline">匯出所有學生完整學習過程（Excel）</button></a>
        </div>

        {/* Group progress — click any group to see its members (read-only) */}
        <div className="card-story">
          <h3 className="story-title" style={{ fontSize: 17, marginTop: 0 }}>組別進度</h3>
          <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 0 }}>
            點選任一組可查看組員個別進度與內容（唯讀，無法修改）。●已完成　◐進行中　○尚未開始，顏色代表關卡：
            {Object.entries(CHAPTER_COLORS).map(([g, color]) => (
              <span key={g} style={{ color, marginLeft: 8, fontWeight: 700 }}>● {g}</span>
            ))}
          </p>
          {groups.map((g) => {
            const pct = Math.round((g.completed / g.total) * 100);
            return (
              <Link key={g.groupNo} href={`/teacher/group/${cls}/${g.groupNo}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{ padding: "10px 0", borderBottom: "1px solid #eee2cc", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 4 }}>
                    <span><b>第 {g.groupNo} 組</b>（{g.memberCount}人）　{g.currentChapter ? `目前：${g.currentChapter}` : ""}</span>
                    <span>
                      {g.completed}/{g.total}　
                      <span style={{ color: STATUS_DOT[g.status] }}>{STATUS_LABEL[g.status]}</span>
                    </span>
                  </div>
                  <div style={{ background: "#eee2cc", borderRadius: 4, height: 10, overflow: "hidden", marginBottom: 4 }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: STATUS_DOT[g.status] }} />
                  </div>
                  <div style={{ fontSize: 13, letterSpacing: 2 }}>
                    {g.matrix.map((m) => {
                      const c = cellStyle(m.status, m.key);
                      return <span key={m.key} title={m.label} style={{ color: c.color }}>{c.symbol}</span>;
                    })}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
