"use client";
import { useEffect, useState } from "react";
import PromptText from "./PromptText";

type Member = { student_id: string; name: string; content: string; updated_at: string };

export default function MiniFieldColumn({
  fieldKey, width, onDone, onFinalContent,
}: {
  fieldKey: string;
  width?: number | string;
  onDone?: () => void;
  onFinalContent?: (info: { key: string; label: string; content: string }) => void;
}) {
  const [data, setData] = useState<any>(null);
  const [mineText, setMineText] = useState("");
  const [mergeText, setMergeText] = useState("");
  const [savingMine, setSavingMine] = useState(false);
  const [savingFinal, setSavingFinal] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    const res = await fetch(`/api/field/${fieldKey}`);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "載入失敗");
      return;
    }
    setErr("");
    const d = await res.json();
    setData(d);
    setMineText(d.mine?.content || "");
    setMergeText(d.final?.content || "");
    if (d.final) {
      onDone?.();
      onFinalContent?.({ key: fieldKey, label: d.field.label, content: d.final.content });
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [fieldKey]);

  async function saveMine() {
    setSavingMine(true);
    await fetch(`/api/field/${fieldKey}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: mineText }),
    });
    setSavingMine(false);
    load();
  }

  async function finalize() {
    setSavingFinal(true);
    await fetch(`/api/field/${fieldKey}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: mergeText }),
    });
    setSavingFinal(false);
    load();
  }

  const colStyle = { width: width || "100%", flexShrink: 0 as const };

  if (err) return <div className="card-story" style={colStyle}><p style={{ color: "#8a5a1f" }}>{err}</p></div>;
  if (!data) return <div style={colStyle}><p>載入中…</p></div>;

  const { field, members, final } = data;

  return (
    <div className="card-story" style={colStyle}>
      <h4 className="story-title" style={{ fontSize: 15, marginTop: 0, color: field.highlight ? "#B33" : undefined }}>
        {field.label}
      </h4>
      {field.prompt && (
        <PromptText prompt={field.prompt} highlightPhrase={field.highlightPhrase}
          style={{ color: "#7a6a52", whiteSpace: "pre-wrap", fontSize: 12.5, lineHeight: 1.6 }} />
      )}

      {!field.skipIndividual && (
        <>
          <p style={{ fontSize: 11.5, fontWeight: 700, margin: "8px 0 2px" }}>我的想法</p>
          <textarea rows={4} value={mineText} onChange={(e) => setMineText(e.target.value)} style={{ fontSize: 12.5 }} />
          <button className="btn-story outline" style={{ fontSize: 12, padding: "5px 10px", marginTop: 6 }} disabled={savingMine} onClick={saveMine}>
            {savingMine ? "儲存中…" : "儲存"}
          </button>

          {members.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, margin: "0 0 2px" }}>組員的想法</p>
              {members.map((m: Member) => (
                <p key={m.student_id} style={{ fontSize: 12, margin: "2px 0" }}><b>{m.name}：</b>{m.content}</p>
              ))}
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: 10, borderTop: field.skipIndividual ? "none" : "1px dashed var(--line)", paddingTop: field.skipIndividual ? 0 : 8 }}>
        <p style={{ fontSize: 11.5, fontWeight: 700, margin: "0 0 2px", color: field.highlight ? "#B33" : undefined }}>
          {field.skipIndividual ? "組內共同填寫" : "組內定稿"}{field.highlight && "（評分重點）"}
        </p>
        {final && <p style={{ fontSize: 11, color: "#7a6a52", margin: "0 0 4px" }}>上次定稿人：{final.finalized_by_name}</p>}
        <textarea rows={field.skipIndividual ? 6 : 4} value={mergeText} onChange={(e) => setMergeText(e.target.value)} style={{ fontSize: 12.5 }} />
        <button className="btn-story" style={{ fontSize: 12, padding: "5px 10px", marginTop: 6 }} disabled={savingFinal} onClick={finalize}>
          {savingFinal ? "儲存中…" : "定稿為組別版本"}
        </button>
      </div>
    </div>
  );
}
