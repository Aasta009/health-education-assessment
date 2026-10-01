"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import MiniFieldColumn from "../_shared/MiniFieldColumn";
import { getNextStep } from "@/lib/fields";

const KEYS = ["ai_result", "ai_reason"];

export default function AIIterationPage() {
  const [done, setDone] = useState<Set<string>>(new Set());
  const [nextStep, setNextStep] = useState<{ route: string; label: string } | null | undefined>(undefined);

  function markDone(key: string) {
    setDone((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }

  const allDone = KEYS.every((k) => done.has(k));

  useEffect(() => {
    if (!allDone) return;
    fetch("/api/progress").then((r) => r.ok ? r.json() : null).then((d) => {
      if (d) setNextStep(getNextStep(new Set(d.doneKeys)));
    });
  }, [allDone]);

  return (
    <main className="container" style={{ paddingTop: 32, maxWidth: 700 }}>
      <a href="/s">← 回到關卡總覽</a>
      <h2 className="story-title" style={{ fontSize: 21 }}>第四關　AI迭代結果</h2>
      <div className="card-story" style={{ background: "#f3ecdd" }}>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.8 }}>
          這一關請在課後完成：<br />
          1. 到「關卡總覽」頁面下載「組內討論結果」檔案<br />
          2. 開啟 NotebookLM，把這個檔案加入來源<br />
          3. 使用提示詞：「依照『組內討論結果』檔案中的評估設計，請幫我檢查是否符合學習評估規劃原則，有無須修改處。執行前，若有問題，請先問我。」<br />
          4. 跟 AI 來回討論、確認修改方向後，把最終結果帶回來這裡填寫
        </p>
      </div>
      <MiniFieldColumn fieldKey="ai_result" onDone={() => markDone("ai_result")} />
      <MiniFieldColumn fieldKey="ai_reason" onDone={() => markDone("ai_reason")} />

      {allDone && (
        <div className="card-story" style={{ background: "#E4EEE2" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13.5 }}>✓ 這一關已完成，下一步：</p>
          {nextStep === undefined && <p style={{ margin: 0 }}>載入中…</p>}
          {nextStep === null && <p style={{ margin: 0 }}>全部完成了！</p>}
          {nextStep && <Link href={nextStep.route}><button className="btn-story">前往「{nextStep.label}」→</button></Link>}
        </div>
      )}
    </main>
  );
}
