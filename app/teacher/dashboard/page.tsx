import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureReady, getPool, getUnlockedLevel } from "@/lib/db";
import { readSession } from "@/lib/session";
import { ALL_KEYS } from "@/lib/fields";
import { getClassDashboard, STALL_WARN_MINUTES, STALL_ALERT_MINUTES } from "@/lib/dashboard";
import GateControl from "./GateControl";

export const dynamic = "force-dynamic";

const STATUS_DOT: Record<string, string> = {
  done: "#3F5B44",
  ok: "#5FA05A",
  warn: "#D6A756",
  alert: "#B33",
  not_started: "#c9c1ae",
};
const STATUS_LABEL: Record<string, string> = {
  done: "✓ 已完成", ok: "🟢 正常", warn: "🟡 停留", alert: "🔴 可能卡關", not_started: "尚未開始",
};
const CELL: Record<string, { symbol: string; color: string }> = {
  done: { symbol: "●", color: "#3F5B44" },
  in_progress: { symbol: "◐", color: "#D6A756" },
  open: { symbol: "○", color: "#cfc4a8" },
  locked: { symbol: "🔒", color: "#cfc4a8" },
};

export default async function TeacherDashboard({ searchParams }: { searchParams: { cls?: string } }) {
  const session = readSession();
  if (!session || session.role !== "staff") redirect("/staff");

  await ensureReady();
  const pool = getPool();
  const cls = searchParams.cls === "B" ? "B" : "A";

  const groups = await getClassDashboard(cls);
  const levelA = await getUnlockedLevel("A");
  const levelB = await getUnlockedLevel("B");

  const unassignedRes = await pool.query(
    `SELECT COUNT(*) as c FROM students WHERE group_no IS NULL AND is_hidden = false`
  );

  const totalGroups = groups.length;
  const doneGroups = groups.filter((g) => g.status === "done").length;
  const needsAttention = groups.filter((g) => g.status === "warn" || g.status === "alert").length;
  const inProgress = totalGroups - doneGroups - groups.filter((g) => g.status === "not_started").length;
  const avgProgress = totalGroups ? (groups.reduce((s, g) => s + g.completed, 0) / totalGroups).toFixed(1) : "0";

  const attention = groups.filter((g) => g.status === "warn" || g.status === "alert");

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
          尚未分組人數：{unassignedRes.rows[0].c}　｜　停留門檻：🟡 {STALL_WARN_MINUTES} 分鐘　🔴 {STALL_ALERT_MINUTES} 分鐘
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
            { label: "需注意", value: needsAttention },
            { label: "已完成", value: doneGroups },
            { label: "平均進度", value: `${avgProgress}/${ALL_KEYS.length}` },
          ].map((kpi) => (
            <div key={kpi.label} style={{ background: "#FCF8ED", border: "1px solid var(--line)", borderRadius: 8, padding: "12px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--forest)" }}>{kpi.value}</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Intervention center */}
        {attention.length > 0 && (
          <div className="card-story" style={{ borderLeft: "4px solid #B33" }}>
            <h4 style={{ marginTop: 0 }}>⚠ 需要教師注意（{attention.length}）</h4>
            {attention.map((g) => (
              <div key={g.groupNo} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #eee2cc" }}>
                <span>
                  {cls} 班 第 {g.groupNo} 組　目前：{g.currentChapter}　
                  {g.stallMinutes != null && <span style={{ color: g.status === "alert" ? "#B33" : "#8a5a1f" }}>已停留 {g.stallMinutes} 分鐘</span>}
                </span>
                <Link href={`/teacher/group/${cls}/${g.groupNo}`}>查看</Link>
              </div>
            ))}
          </div>
        )}

        {session.kind === "ta" && <GateControl initial={{ A: levelA, B: levelB }} />}

        <div className="card-story">
          <h4 style={{ marginTop: 0 }}>匯出</h4>
          <a href="/api/staff/export/raw"><button className="btn-story outline">匯出所有學生完整學習過程（Excel）</button></a>
        </div>

        {/* Group progress bars */}
        <div className="card-story">
          <h3 className="story-title" style={{ fontSize: 17, marginTop: 0 }}>組別進度</h3>
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
                      {g.stallMinutes != null && g.status !== "done" && ` ${g.stallMinutes}分`}
                    </span>
                  </div>
                  <div style={{ background: "#eee2cc", borderRadius: 4, height: 10, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: STATUS_DOT[g.status] }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Level matrix */}
        <div className="card-story">
          <h3 className="story-title" style={{ fontSize: 17, marginTop: 0 }}>關卡矩陣</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ padding: "4px 8px", textAlign: "left" }}>組別</th>
                  {ALL_KEYS.map((k, i) => <th key={k} style={{ padding: "2px 4px" }}>{i + 1}</th>)}
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={g.groupNo}>
                    <td style={{ padding: "4px 8px", whiteSpace: "nowrap" }}>第{g.groupNo}組</td>
                    {g.matrix.map((m) => (
                      <td key={m.key} title={`${m.label}｜${m.status}`} style={{ padding: "2px 4px", textAlign: "center", color: CELL[m.status].color }}>
                        {CELL[m.status].symbol}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 8 }}>
            ● 已完成　◐ 進行中（有人已填寫草稿，尚未組內定稿）　○ 已開放未開始　🔒 尚未開放
          </p>
        </div>
      </div>
    </main>
  );
}
