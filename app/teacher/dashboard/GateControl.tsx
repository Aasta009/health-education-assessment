"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const CHAPTER_NAMES = ["", "第一關 下雨的草原", "第二關 不會走路的森林", "第三關 會忘記事情的河", "第四關 沒有門的房子", "第五關 迷路的人", "第六關 世界盡頭的樹"];
const CHAPTER_MINUTES = [0, 8, 12, 10, 20, 28, 12];

export default function GateControl({ initial }: { initial: Record<string, number> }) {
  const [levels, setLevels] = useState(initial);
  const [saving, setSaving] = useState<string | null>(null);
  const router = useRouter();

  async function setLevel(cls: string, level: number) {
    setSaving(cls);
    await fetch("/api/ta/gate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cls, level }),
    });
    setLevels((prev) => ({ ...prev, [cls]: level }));
    setSaving(null);
    router.refresh();
  }

  return (
    <div className="card-story">
      <h4 className="story-title" style={{ marginTop: 0, fontSize: 17 }}>關卡開放控制（僅助教可見）</h4>
      <p style={{ color: "var(--ink-soft)", fontSize: 13.5 }}>學生只能看到並填寫已開放的關卡，避免自行往前跳。</p>

      <div style={{ background: "#f3ecdd", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>
        <b>建議節奏參考</b>（每次上課 100 分鐘，學生作答與 AI 討論各半）：<br />
        學習任務1：學生作答 50 分鐘（8／12／10／20）＋ AI討論I 50 分鐘，共 100 分鐘<br />
        學習任務2：學生作答 50 分鐘（28／12／個人反思10）＋ AI討論II 50 分鐘，共 100 分鐘
      </div>

      {["A", "B"].map((cls) => (
        <div key={cls} style={{ marginBottom: 14 }}>
          <b>{cls} 班</b>　目前開放到：{CHAPTER_NAMES[levels[cls] || 1]}
          <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
            {[1, 2, 3, 4, 5, 6].map((lv) => (
              <button
                key={lv}
                className={levels[cls] === lv ? "btn-story" : "btn-story outline"}
                style={{ padding: "6px 14px", fontSize: 13.5 }}
                disabled={saving === cls}
                onClick={() => setLevel(cls, lv)}
              >
                開放到第{lv}關（{CHAPTER_MINUTES[lv]}分）
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
