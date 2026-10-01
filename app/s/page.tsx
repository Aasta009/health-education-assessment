import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureReady, getPool, getUnlockedLevel } from "@/lib/db";
import { readSession } from "@/lib/session";
import { FIELDS, ALL_KEYS, GROUP_STORY, LEVEL_BY_GROUP, CONSOLIDATED_GROUPS, ORDERED_GROUPS } from "@/lib/fields";
import ExportDiscussionButton from "./_shared/ExportDiscussionButton";

export const dynamic = "force-dynamic";

const ICON_FILES: Record<string, string> = {
  "主題方向": "icon-snail.png",
  "學習者評估內容規劃": "icon-seed.png",
  "訪談綱要": "icon-river.png",
  "AI迭代結果": "icon-girl.png",
  "活動規劃書": "icon-house.png",
};

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
            還沒被指派組別——請等老師公布分組後再回來看看（網址不變，之後直接用學號登入即可）。
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
  const unlockedLevel = await getUnlockedLevel(session.cls);
  const allDone = ALL_KEYS.every((k) => doneKeys.has(k));

  const discussionKeys = FIELDS.filter((f) => ["主題方向", "學習者評估內容規劃", "訪談綱要"].includes(f.group)).map((f) => f.key);
  const discussionReady = discussionKeys.every((k) => doneKeys.has(k));

  return (
    <main className="container" style={{ paddingTop: 36 }}>
      <div className="card-story" style={{ textAlign: "center" }}>
        <h2 className="story-title" style={{ fontSize: 22, margin: "0 0 4px" }}>你好，{session.name}</h2>
        <p style={{ margin: 0, color: "var(--ink-soft)" }}>
          {session.cls} 班　第 {session.groupNo} 組　{session.isLeader ? "（組長）" : ""}
        </p>
      </div>

      <div className="card-story">
        <h4 style={{ marginTop: 0, fontSize: 15 }}>關於這份作業</h4>
        <p style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.8, margin: 0 }}>
          這五關要帶你們完成「學習者評估」的前置規劃：確認主題、規劃評估內容、訪談關鍵人物、跟 AI 討論修正、最後完成活動規劃書初版。
          每一關的評估方向與內容，都需要組員仔細思考、負責任地共同決定——這些決定會直接影響後續正式衛教活動的設計，請不要隨意填寫或急著定稿。
          每個欄位都遵循「先個人想法、再組內討論定稿」的流程，任何組員都可以按下定稿，定稿後會直接告訴你下一步要去哪裡。
        </p>
      </div>

      <div style={{ position: "relative", paddingLeft: 26, marginTop: 30 }}>
        <div style={{ position: "absolute", left: 14, top: 6, bottom: 6, width: 2,
          background: "repeating-linear-gradient(to bottom, var(--forest) 0 6px, transparent 6px 12px)" }} />

        {ORDERED_GROUPS.map((g, idx) => {
          const story = GROUP_STORY[g];
          const groupFields = FIELDS.filter((f) => f.group === g);
          const groupDone = groupFields.every((f) => doneKeys.has(f.key));
          const chapterLevel = LEVEL_BY_GROUP[g] ?? 99;
          const isLocked = chapterLevel > unlockedLevel;
          const consolidatedRoute = CONSOLIDATED_GROUPS[g];

          return (
            <div key={g}>
              <div style={{ position: "relative", marginBottom: 26, opacity: isLocked ? 0.55 : 1 }}>
                <div style={{ position: "absolute", left: -28, top: -2,
                  width: 38, height: 38, borderRadius: "50%", overflow: "hidden",
                  background: groupDone ? "#D6A756" : "#FCF8ED",
                  border: "2px solid var(--forest)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img src={`/images/${ICON_FILES[g]}`} alt="" style={{ width: 28, height: 28, objectFit: "contain" }} />
                </div>
                <div className="card-story" style={{ marginLeft: 14 }}>
                  <p style={{ margin: "0 0 6px", fontSize: 12.5, color: "var(--terracotta)", fontWeight: 700 }}>
                    {story?.chapter}　{story?.minutes != null ? `・建議 ${story.minutes} 分鐘` : "・課後自行完成"}
                  </p>
                  <h4 className="story-title" style={{ margin: "0 0 10px", fontSize: 17 }}>{g}</h4>
                  {isLocked ? (
                    <p style={{ fontSize: 13.5, color: "#8a5a1f", margin: 0 }}>這一關還沒開放，請等老師／助教開啟。</p>
                  ) : consolidatedRoute ? (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Link href={consolidatedRoute}>前往作答</Link>
                      <span className={`ribbon ${groupDone ? "ribbon-done" : "ribbon-pending"}`}>
                        {groupDone ? "已完成" : "未完成"}
                      </span>
                    </div>
                  ) : (
                    groupFields.map((f) => (
                      <div key={f.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "9px 0", borderBottom: "1px solid var(--line)" }}>
                        <Link href={`/s/field/${f.key}`}>{f.label}</Link>
                        <span className={`ribbon ${doneKeys.has(f.key) ? "ribbon-done" : "ribbon-pending"}`}>
                          {doneKeys.has(f.key) ? "已定稿" : "未定稿"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {g === "訪談綱要" && (
                <div className="card-story" style={{ marginLeft: 14, marginBottom: 26, background: discussionReady ? "#FCF8ED" : "#f3ecdd", textAlign: "center" }}>
                  <h4 style={{ marginTop: 0, fontSize: 15 }}>前三關完成後</h4>
                  {discussionReady ? (
                    <>
                      <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 10 }}>
                        前三關都定稿了，可以匯出目前的組內討論結果，帶去跟 NotebookLM 討論。
                      </p>
                      <ExportDiscussionButton />
                    </>
                  ) : (
                    <p style={{ fontSize: 13, color: "#8a5a1f", margin: 0 }}>完成前三關的組內定稿後，這裡會開放匯出。</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {allDone && (
        <div className="card-story" style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 14, color: "var(--forest)" }}>✓ 五關全部完成了！</p>
        </div>
      )}
    </main>
  );
}
