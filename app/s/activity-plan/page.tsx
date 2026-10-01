"use client";
import { useState } from "react";
import MiniFieldColumn from "../_shared/MiniFieldColumn";

const KEYS = ["act_topic", "act_desc", "act_flow", "act_roles", "act_props"];

type FinalInfo = { key: string; label: string; content: string };

export default function ActivityPlanPage() {
  const [finals, setFinals] = useState<Record<string, FinalInfo>>({});

  function recordFinal(info: FinalInfo) {
    setFinals((prev) => ({ ...prev, [info.key]: info }));
  }

  const allDone = KEYS.every((k) => finals[k]);

  return (
    <main className="container" style={{ paddingTop: 32, maxWidth: 1500 }}>
      <a href="/s">← 回到關卡總覽</a>
      <h2 className="story-title" style={{ fontSize: 21 }}>第五關　活動規劃書</h2>
      <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>
        五個子項由左而右排列，每個子項一樣是先個人寫想法，組內討論後再定稿。全部定稿後，下方會自動彙整成「活動規劃書_初版」。
      </p>
      <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 12 }}>
        {KEYS.map((k) => (
          <div key={k} style={{ width: 300, flexShrink: 0 }}>
            <MiniFieldColumn fieldKey={k} onFinalContent={recordFinal} />
          </div>
        ))}
      </div>

      {allDone && (
        <div className="card-story">
          <h3 className="story-title" style={{ fontSize: 17, marginTop: 0 }}>活動規劃書_初版</h3>
          {KEYS.map((k) => (
            <div key={k} style={{ marginBottom: 14 }}>
              <h4 style={{ margin: "0 0 4px" }}>{finals[k].label}</h4>
              <p style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: 14 }}>{finals[k].content}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
