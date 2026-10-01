"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import MiniFieldColumn from "../_shared/MiniFieldColumn";
import { getNextStep } from "@/lib/fields";

const KEYS = ["interview_teacher", "interview_nurse"];

export default function InterviewPage() {
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
    <main className="container" style={{ paddingTop: 32, maxWidth: 900 }}>
      <a href="/s">← 回到關卡總覽</a>
      <h2 className="story-title" style={{ fontSize: 21 }}>第三關　訪談綱要</h2>
      <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>
        這一關分成兩欄，請依照老師的分配：4 位組員負責「導師」這一欄，另外 4 位負責「護理師」這一欄。兩欄都完成組內定稿後，這一關就算完成。
      </p>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 320px" }}>
          <p style={{ fontWeight: 700, fontSize: 13, color: "var(--terracotta)", margin: "0 0 8px" }}>左欄｜導師</p>
          <MiniFieldColumn fieldKey="interview_teacher" onDone={() => markDone("interview_teacher")} />
        </div>
        <div style={{ flex: "1 1 320px" }}>
          <p style={{ fontWeight: 700, fontSize: 13, color: "var(--terracotta)", margin: "0 0 8px" }}>右欄｜護理師</p>
          <MiniFieldColumn fieldKey="interview_nurse" onDone={() => markDone("interview_nurse")} />
        </div>
      </div>

      {allDone && (
        <div className="card-story" style={{ background: "#E4EEE2" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13.5 }}>✓ 兩欄都已定稿，下一步：</p>
          {nextStep === undefined && <p style={{ margin: 0 }}>載入中…</p>}
          {nextStep === null && <p style={{ margin: 0 }}>全部完成了！</p>}
          {nextStep && <Link href={nextStep.route}><button className="btn-story">前往「{nextStep.label}」→</button></Link>}
        </div>
      )}
    </main>
  );
}
