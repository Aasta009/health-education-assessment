import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureReady, getPool } from "@/lib/db";
import { readSession } from "@/lib/session";
import { FIELDS, ALL_KEYS, GROUP_STORY, LEVEL_BY_GROUP } from "@/lib/fields";
import { getUnlockedLevel } from "@/lib/db";

export const dynamic = "force-dynamic";

const ICON_FILES: Record<string, string> = {
  snail: "icon-snail.png",
  seed: "icon-seed.png",
  river: "icon-river.png",
  house: "icon-house.png",
  girl: "icon-girl.png",
  tree: "icon-tree.png",
};

function ChapterIcon({ name }: { name: string }) {
  const file = ICON_FILES[name] || ICON_FILES.snail;
  return (
    <img src={`/images/${file}`} alt="" style={{ width: 32, height: 32, objectFit: "contain" }} />
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
  const unlockedLevel = await getUnlockedLevel(session.cls);

  const groups = Array.from(new Set(FIELDS.map((f) => f.group)));
  const allDone = ALL_KEYS.every((k) => doneKeys.has(k));

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
          const groupFields = FIELDS.filter((f) => f.group === g);
          const groupDone = groupFields.every((f) => doneKeys.has(f.key));
          const chapterLevel = LEVEL_BY_GROUP[g] ?? 99;
          const isLocked = chapterLevel > unlockedLevel;
          return (
            <div key={g} style={{ position: "relative", marginBottom: 26, opacity: isLocked ? 0.55 : 1 }}>
              <div style={{ position: "absolute", left: -28, top: -2,
                width: 38, height: 38, borderRadius: "50%", overflow: "hidden",
                background: groupDone ? "#D6A756" : "#FCF8ED",
                border: "2px solid var(--forest)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {story && <ChapterIcon name={story.icon} />}
              </div>
              <div className="card-story" style={{ marginLeft: 14 }}>
                {story && (
                  <p style={{ margin: "0 0 4px", fontSize: 12.5, color: "var(--terracotta)", fontFamily: "'Noto Serif TC', serif", fontWeight: 700 }}>
                    {story.chapter}　・　建議 {story.minutes} 分鐘
                  </p>
                )}
                <h4 className="story-title" style={{ margin: "0 0 6px", fontSize: 17 }}>{story?.title || g}</h4>
                {story && <p style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "0 0 12px", lineHeight: 1.7 }}>{story.blurb}</p>}
                {isLocked ? (
                  <p style={{ fontSize: 13.5, color: "#8a5a1f", margin: 0 }}>這一段路還沒開放，請等老師／助教開啟。</p>
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
          );
        })}
      </div>

      <div className="card-story" style={{ textAlign: "center", padding: 0, overflow: "hidden" }}>
        {allDone && (
          <img src="/images/finale-scene.jpg" alt="世界盡頭的大樹"
            style={{ width: "100%", display: "block" }} />
        )}
        <div style={{ padding: "20px 24px" }}>
          <h4 className="story-title" style={{ marginTop: 0, fontSize: 17 }}>世界盡頭的樹</h4>
          {allDone ? (
            <>
              <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>所有片段都到齊了，可以讓它們長成一份完整的報告。</p>
              <a href="/api/export/final"><button className="btn-story">下載完整學習者評估報告（Word）</button></a>
              <p style={{ marginTop: 14 }}><Link href="/s/reflection">→ 前往填寫個人反思心得</Link></p>
            </>
          ) : (
            <>
              <p style={{ color: "#8a5a1f" }}>還有幾段路沒走完——完成上面所有「組內定稿」，樹才會長出來。</p>
              <p style={{ marginTop: 14 }}><Link href="/s/reflection">→ 前往填寫個人反思心得</Link></p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
