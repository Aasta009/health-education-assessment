"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetTestGroupButton() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  async function doReset() {
    setBusy(true);
    await fetch("/api/ta/reset-test-group", { method: "POST" });
    setBusy(false);
    setOpen(false);
    setDone(true);
    router.refresh();
  }

  return (
    <div className="card-story">
      <h4 style={{ marginTop: 0 }}>測試帳號管理</h4>
      <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
        測試學生（113120009，A班第1組）的作答、組內定稿、AI一致性檢核資料整組重置，方便重新測試整個流程。
      </p>
      {done && <p style={{ color: "var(--forest)", fontSize: 13 }}>✓ 已重置，可以重新測試。</p>}
      <button className="btn-story outline" onClick={() => setOpen(true)}>重置測試帳號資料</button>

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(58,46,35,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <div className="card-story" style={{ maxWidth: 440, background: "#FCF8ED" }}>
            <h4 style={{ marginTop: 0 }}>確定要重置嗎？</h4>
            <p style={{ fontSize: 13.5 }}>
              這會清空 A班第1組（測試帳號 113120009 所在的組）所有的個人作答、組內定稿、AI一致性檢核紀錄，無法復原。學生帳號本身不會被刪除。
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn-story outline" onClick={() => setOpen(false)}>取消</button>
              <button className="btn-story" disabled={busy} onClick={doReset}>{busy ? "重置中…" : "確定重置"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
