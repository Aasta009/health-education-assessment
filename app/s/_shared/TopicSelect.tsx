"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getNextStep } from "@/lib/fields";

const OPTIONS = [
  "三年級｜認識失智症的症狀與預防失智症",
  "四年級｜失智症患者的相處與友善環境營造",
];

export default function TopicSelect({ onDone }: { onDone?: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [nextStep, setNextStep] = useState<{ route: string; label: string } | null>(null);

  async function load() {
    const res = await fetch("/api/field/topic");
    if (!res.ok) return;
    const d = await res.json();
    if (d.final?.content) {
      setSelected(d.final.content);
      onDone?.();
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function choose(option: string) {
    setSaving(true);
    await fetch("/api/field/topic", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: option }),
    });
    setSelected(option);
    setSaving(false);
    onDone?.();
    const progRes = await fetch("/api/progress");
    if (progRes.ok) {
      const { doneKeys } = await progRes.json();
      setNextStep(getNextStep(new Set(doneKeys)));
    }
  }

  return (
    <div>
      {OPTIONS.map((opt) => (
        <label key={opt} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", cursor: "pointer" }}>
          <input type="radio" name="topic-select" checked={selected === opt} disabled={saving} onChange={() => choose(opt)} />
          <span style={{ fontSize: 14 }}>{opt}</span>
        </label>
      ))}
      {selected && <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "6px 0 0" }}>✓ 已選定，任何組員都可以再次點選更改。</p>}
      {nextStep && (
        <div style={{ marginTop: 10 }}>
          <Link href={nextStep.route}><button className="btn-story" style={{ fontSize: 13, padding: "6px 12px" }}>前往「{nextStep.label}」→</button></Link>
        </div>
      )}
    </div>
  );
}
