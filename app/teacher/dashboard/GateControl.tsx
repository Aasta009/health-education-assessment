"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const CHAPTER_NAMES = ["", "第一關　主題方向", "第二關　學習者評估內容規劃", "第三關　訪談綱要", "第四關　AI迭代結果（課後）", "第五關　活動規劃書"];
const CHAPTER_MINUTES: (number | null)[] = [0, 1, 12, 17, null, 20];

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
        <b>建議節奏參考</b>（課堂 50 分鐘：第一關1分／第二關12分／第三關17分／第五關20分；第四關為課後自行以 NotebookLM 完成，不計入課堂時間）
      </div>

      {["A", "B"].map((cls) => (
        <div key={cls} style={{ marginBottom: 14 }}>
          <b>{cls} 班</b>　目前開放到：{CHAPTER_NAMES[levels[cls] || 1]}
          <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
            {[1, 2, 3, 4, 5].map((lv) => (
              <button
                key={lv}
                className={levels[cls] === lv ? "btn-story" : "btn-story outline"}
                style={{ padding: "6px 14px", fontSize: 13.5 }}
                disabled={saving === cls}
                onClick={() => setLevel(cls, lv)}
              >
                開放到第{lv}關{CHAPTER_MINUTES[lv] != null ? `（${CHAPTER_MINUTES[lv]}分）` : "（課後）"}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
