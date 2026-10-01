"use client";
import { useState } from "react";
import MiniFieldColumn from "../_shared/MiniFieldColumn";

const KEYS = ["act_topic", "act_desc", "act_flow", "act_roles", "act_props"];

export default function ActivityPlanPage() {
  const [done, setDone] = useState<Set<string>>(new Set());

  function markDone(key: string) {
    setDone((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }

  const allDone = KEYS.every((k) => done.has(k));

  return (
    <main className="container" style={{ paddingTop: 32, maxWidth: 1500 }}>
      <a href="/s">← 回到關卡總覽</a>
      <h2 className="story-title" style={{ fontSize: 21 }}>第五關　活動規劃書</h2>
      <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>
        五個子項由左而右排列，每個子項一樣是先個人寫想法，組內討論後再定稿。全部定稿後會形成「活動規劃書_初版」。
      </p>
      <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 12 }}>
        {KEYS.map((k) => (
          <div key={k} style={{ width: 300, flexShrink: 0 }}>
            <MiniFieldColumn fieldKey={k} onDone={() => markDone(k)} />
          </div>
        ))}
      </div>

      {allDone && (
        <div className="card-story" style={{ background: "#E4EEE2", textAlign: "center" }}>
          <p style={{ margin: "0 0 10px", fontSize: 14 }}>✓ 活動規劃書五個子項都定稿了，「活動規劃書_初版」完成！</p>
          <a href="/api/export/activity-plan"><button className="btn-story">下載「活動規劃書_初版」（Word）</button></a>
        </div>
      )}
    </main>
  );
}
