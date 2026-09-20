import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureReady, getPool } from "@/lib/db";
import { readSession } from "@/lib/session";
import { FIELDS, STAGE1_KEYS, GROUP_STORY } from "@/lib/fields";

export const dynamic = "force-dynamic";

function ChapterIcon({ name }: { name: string }) {
  const common = { width: 30, height: 30, viewBox: "0 0 40 40" };
  if (name === "snail") return (
    <img src="/images/icon-snail.png" alt="" style={{ width: 30, height: 30, objectFit: "contain" }} />
  );
  if (name === "seed") return (
    <svg {...common}><circle cx="20" cy="20" r="18" fill="#E4EEE2" />
      <path d="M20,28 C14,20 14,12 20,10 C26,12 26,20 20,28 Z" fill="none" stroke="#3F5B44" strokeWidth="2" />
      <line x1="20" y1="28" x2="20" y2="32" stroke="#3F5B44" strokeWidth="2" /></svg>
  );
  if (name === "river") return (
    <svg {...common}><circle cx="20" cy="20" r="18" fill="#E4EEE2" />
      <path d="M8,18 q4,-4 8,0 t8,0 t8,0" fill="none" stroke="#46618C" strokeWidth="2" />
      <path d="M8,25 q4,-4 8,0 t8,0 t8,0" fill="none" stroke="#46618C" strokeWidth="2" /></svg>
  );
  return (
    <svg {...common}><circle cx="20" cy="20" r="18" fill="#E4EEE2" />
      <rect x="12" y="18" width="16" height="12" fill="none" stroke="#3F5B44" strokeWidth="2" />
      <polygon points="10,18 20,10 30,18" fill="none" stroke="#3F5B44" strokeWidth="2" /></svg>
  );
}

export default async function StudentDashboard() {
  const session = readSession();
  if (!session || session.role !== "student") redirect("/login");

  await ensureReady();
  const pool = getPool();

  if (session.groupNo == null) {
    return (
      <main className="container" style={{ paddingTop: 60 }}>
        <div className="card-story">
          <h2 className="story-title" style={{ fontSize: 20 }}>你好，{session.name}</h2>
          <p style={{ color: "var(--ink-soft)" }}>
            旅程還沒為你標好起點——請等老師公布分組後再回來看看（網址不變，之後直接用學號登入即可）。
          </p>
        </div>
      </main>
    );
  }

  const finals = await pool.query(
    `SELECT field_key FROM group_finals WHERE class=$1 AND group_no=$2`,
    [session.cls, session.groupNo]
  );
  const doneKeys = new Set(finals.rows.map((r) => r.field_key));

  const stage1Fields = FIELDS.filter((f) => f.stage === 1);
  const groups = Array.from(new Set(stage1Fields.map((f) => f.group)));
  const allStage1Done = STAGE1_KEYS.every((k) => doneKeys.has(k));

  return (
    <main className="container" style={{ paddingTop: 36 }}>
      <div className="card-story" style={{ textAlign: "center" }}>
        <h2 className="story-title" style={{ fontSize: 22, margin: "0 0 4px" }}>你好，{session.name}</h2>
        <p style={{ margin: 0, color: "var(--ink-soft)" }}>
          {session.cls} 班　第 {session.groupNo} 組　{session.isLeader ? "（組長）" : ""}
        </p>
      </div>

      <div style={{ position: "relative", paddingLeft: 26, marginTop: 30 }}>
        <div style={{ position: "absolute", left: 14, top: 6, bottom: 6, width: 2,
          background: "repeating-linear-gradient(to bottom, var(--forest) 0 6px, transparent 6px 12px)" }} />

        {groups.map((g) => {
          const story = GROUP_STORY[g];
          const groupFields = stage1Fields.filter((f) => f.group === g);
          const groupDone = groupFields.every((f) => doneKeys.has(f.key));
          return (
            <div key={g} style={{ position: "relative", marginBottom: 26 }}>
              <div style={{ position: "absolute", left: -26, top: 0,
                width: 30, height: 30, borderRadius: "50%",
                background: groupDone ? "#D6A756" : "#FCF8ED",
                border: "2px solid var(--forest)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {story && <ChapterIcon name={story.icon} />}
              </div>
              <div className="card-story" style={{ marginLeft: 14 }}>
                {story && (
                  <p style={{ margin: "0 0 4px", fontSize: 12.5, color: "var(--terracotta)", fontFamily: "'Noto Serif TC', serif", fontWeight: 700 }}>
                    {story.chapter}
                  </p>
                )}
                <h4 className="story-title" style={{ margin: "0 0 6px", fontSize: 17 }}>{story?.title || g}</h4>
                {story && <p style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "0 0 12px", lineHeight: 1.7 }}>{story.blurb}</p>}
                {groupFields.map((f) => (
                  <div key={f.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "9px 0", borderBottom: "1px solid var(--line)" }}>
                    <Link href={`/s/field/${f.key}`}>{f.label}</Link>
                    <span className={`ribbon ${doneKeys.has(f.key) ? "ribbon-done" : "ribbon-pending"}`}>
                      {doneKeys.has(f.key) ? "已定稿" : "未定稿"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card-story" style={{ textAlign: "center" }}>
        <h4 className="story-title" style={{ marginTop: 0, fontSize: 17 }}>世界盡頭的樹</h4>
        {allStage1Done ? (
          <>
            <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>所有片段都到齊了，可以讓它們長成一份完整的報告。</p>
            <a href="/api/export/stage1"><button className="btn-story">下載學習任務1初版 Word 檔</button></a>
          </>
        ) : (
          <p style={{ color: "#8a5a1f" }}>還有幾段路沒走完——完成上面所有「組內定稿」，樹才會長出來。</p>
        )}
      </div>
    </main>
  );
}
