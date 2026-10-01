"use client";
import { useEffect, useState } from "react";

type Round = { round_no: number; prompt: string; ai_response: string; judgment: string; judgment_reason: string; created_by_name: string; created_at: string };

const JUDGMENT_LABEL: Record<string, string> = { accept: "接受", partial: "部分接受", reject: "不接受" };
const JUDGMENT_COLOR: Record<string, string> = { accept: "#3F5B44", partial: "#D6A756", reject: "#B33" };

export default function ChapterColumn({ chapterKey, compact }: { chapterKey: string; compact?: boolean }) {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");
  const [prompt, setPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [judgment, setJudgment] = useState("accept");
  const [reason, setReason] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [decision, setDecision] = useState<"maintain" | "revise">("maintain");
  const [afterAI, setAfterAI] = useState("");
  const [revisionReason, setRevisionReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch(`/api/ai-session?chapterKey=${chapterKey}`);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "載入失敗");
      return;
    }
    setErr("");
    const d = await res.json();
    setData(d);
    setAfterAI(d.afterAI || d.beforeAI || "");
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [chapterKey]);

  async function addRound() {
    setBusy(true);
    await fetch("/api/ai-session/round", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapterKey, prompt, aiResponse, judgment, judgmentReason: reason }),
    });
    setPrompt(""); setAiResponse(""); setJudgment("accept"); setReason("");
    setBusy(false);
    load();
  }

  async function finalize(roundNo: number) {
    setBusy(true);
    await fetch("/api/ai-session/finalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapterKey, roundNo }),
    });
    setBusy(false);
    setShowConfirm(false);
    setConfirmChecked(false);
    load();
  }

  async function saveDecision() {
    setBusy(true);
    await fetch("/api/ai-session/decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapterKey, decision, afterAI, revisionReason }),
    });
    setBusy(false);
    load();
  }

  async function reopen() {
    setBusy(true);
    await fetch("/api/ai-session/reopen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapterKey }),
    });
    setBusy(false);
    load();
  }

  const colWidth = compact ? "100%" : 320;

  if (err) {
    return (
      <div className="card-story" style={{ width: colWidth, flexShrink: 0 }}>
        <p style={{ color: "#8a5a1f" }}>{err}</p>
      </div>
    );
  }
  if (!data) return <div style={{ width: colWidth, flexShrink: 0 }}><p>載入中…</p></div>;

  const accepted = data.rounds.filter((r: Round) => r.judgment === "accept").length;
  const revisedCount = data.rounds.filter((r: Round) => r.judgment !== "accept").length;

  return (
    <div className="card-story" style={{ width: colWidth, flexShrink: 0 }}>
      <h4 className="story-title" style={{ fontSize: 15, marginTop: 0 }}>{data.chapterTitle}</h4>

      <div style={{ background: "#f3ecdd", borderRadius: 6, padding: 10, marginBottom: 10 }}>
        <p style={{ fontSize: 11, color: "var(--terracotta)", fontWeight: 700, margin: "0 0 4px" }}>GROUP FINAL（組內定稿｜唯讀）</p>
        <p style={{ fontSize: 12.5, whiteSpace: "pre-wrap", margin: 0 }}>{data.beforeAI}</p>
      </div>

      {data.rounds.map((r: Round) => (
        <div key={r.round_no} style={{ borderLeft: `3px solid ${JUDGMENT_COLOR[r.judgment]}`, paddingLeft: 10, marginBottom: 10 }}>
          <p style={{ fontSize: 11.5, fontWeight: 700, margin: "0 0 2px" }}>
            Round {r.round_no} {data.finalRound === r.round_no && "★ FINAL"}
          </p>
          <p style={{ fontSize: 12, margin: "2px 0" }}><b>我的提問：</b>{r.prompt}</p>
          <p style={{ fontSize: 12, margin: "2px 0" }}><b>NotebookLM 回覆：</b>{r.ai_response}</p>
          <p style={{ fontSize: 12, margin: "2px 0", color: JUDGMENT_COLOR[r.judgment] }}><b>判斷：</b>{JUDGMENT_LABEL[r.judgment]}</p>
          {r.judgment_reason && <p style={{ fontSize: 12, margin: "2px 0" }}><b>原因：</b>{r.judgment_reason}</p>}
        </div>
      ))}

      {data.status === "open" && (
        <div style={{ borderTop: "1px dashed var(--line)", paddingTop: 10, marginTop: 6 }}>
          <p style={{ fontSize: 12, fontWeight: 700, margin: "0 0 4px" }}>新增 Round {data.rounds.length + 1}</p>
          <textarea rows={2} placeholder="我的提問" value={prompt} onChange={(e) => setPrompt(e.target.value)} style={{ fontSize: 12.5, marginBottom: 6 }} />
          <textarea rows={3} placeholder="NotebookLM 回覆" value={aiResponse} onChange={(e) => setAiResponse(e.target.value)} style={{ fontSize: 12.5, marginBottom: 6 }} />
          <div style={{ fontSize: 12, marginBottom: 6 }}>
            {["accept", "partial", "reject"].map((j) => (
              <label key={j} style={{ marginRight: 10 }}>
                <input type="radio" name={`j-${chapterKey}`} checked={judgment === j} onChange={() => setJudgment(j)} /> {JUDGMENT_LABEL[j]}
              </label>
            ))}
          </div>
          <textarea rows={2} placeholder="判斷／修正原因" value={reason} onChange={(e) => setReason(e.target.value)} style={{ fontSize: 12.5, marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button className="btn-story" style={{ fontSize: 12, padding: "6px 10px" }} disabled={busy || !prompt} onClick={addRound}>＋ 繼續下一輪</button>
            <button className="btn-story outline" style={{ fontSize: 12, padding: "6px 10px" }} disabled={busy || data.rounds.length === 0} onClick={() => setShowConfirm(true)}>✓ 完成並採用此版本</button>
          </div>

          {showConfirm && (
            <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 8, padding: 12, marginTop: 10 }}>
              <p style={{ fontWeight: 700, margin: "0 0 6px" }}>完成這一關的 AI 討論？</p>
              <p style={{ fontSize: 12, margin: "2px 0" }}>共進行 {data.rounds.length} 輪討論</p>
              <p style={{ fontSize: 12, margin: "2px 0" }}>接受 {accepted} 次，部分接受／不接受 {revisedCount} 次</p>
              <p style={{ fontSize: 12, margin: "2px 0 8px" }}>最後採用：Round {data.rounds[data.rounds.length - 1].round_no}</p>
              <label style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
                <input type="checkbox" checked={confirmChecked} onChange={(e) => setConfirmChecked(e.target.checked)} /> 我確認這是本次討論要採用的版本
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn-story outline" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => setShowConfirm(false)}>返回修改</button>
                <button className="btn-story" style={{ fontSize: 12, padding: "6px 10px" }} disabled={!confirmChecked || busy}
                  onClick={() => finalize(data.rounds[data.rounds.length - 1].round_no)}>確認完成</button>
              </div>
            </div>
          )}
        </div>
      )}

      {data.status === "completed" && !data.decision && (
        <div style={{ borderTop: "1px dashed var(--line)", paddingTop: 10, marginTop: 6 }}>
          <p style={{ fontSize: 12, fontWeight: 700, margin: "0 0 6px" }}>★ AI 討論完成，經過討論後：</p>
          <label style={{ fontSize: 12, display: "block" }}>
            <input type="radio" name={`d-${chapterKey}`} checked={decision === "maintain"} onChange={() => setDecision("maintain")} /> 維持原組內定稿
          </label>
          <label style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
            <input type="radio" name={`d-${chapterKey}`} checked={decision === "revise"} onChange={() => setDecision("revise")} /> 修改組內定稿
          </label>
          {decision === "revise" && (
            <>
              <textarea rows={4} placeholder="修正後最終版本" value={afterAI} onChange={(e) => setAfterAI(e.target.value)} style={{ fontSize: 12.5, marginBottom: 6 }} />
              <textarea rows={2} placeholder="修改原因" value={revisionReason} onChange={(e) => setRevisionReason(e.target.value)} style={{ fontSize: 12.5, marginBottom: 6 }} />
            </>
          )}
          <button className="btn-story" style={{ fontSize: 12, padding: "6px 10px" }} disabled={busy} onClick={saveDecision}>確認最終版本</button>
        </div>
      )}

      {data.decision && (
        <div style={{ background: "#E4EEE2", borderRadius: 6, padding: 10, marginTop: 6 }}>
          <p style={{ fontSize: 11, color: "var(--forest-dark)", fontWeight: 700, margin: "0 0 4px" }}>
            AFTER AI（{data.decision === "maintain" ? "維持原定稿" : "已修改"}）
          </p>
          <p style={{ fontSize: 12.5, whiteSpace: "pre-wrap", margin: 0 }}>{data.afterAI}</p>
          {data.revisionReason && <p style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 4 }}>修改原因：{data.revisionReason}</p>}
          <button className="btn-story outline" style={{ fontSize: 11.5, padding: "4px 8px", marginTop: 8 }} disabled={busy} onClick={reopen}>重新開啟討論</button>
        </div>
      )}
    </div>
  );
}
