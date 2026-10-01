"use client";
import { useState } from "react";

export default function ExportDiscussionButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="btn-story" onClick={() => setOpen(true)}>下載「組內討論結果」（Word）</button>
      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(58,46,35,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <div className="card-story" style={{ maxWidth: 480, background: "#FCF8ED" }}>
            <h4 style={{ marginTop: 0 }}>下載後，請依序完成：</h4>
            <ol style={{ fontSize: 13.5, lineHeight: 1.9, paddingLeft: 20, margin: "0 0 14px" }}>
              <li>開啟 NotebookLM，把這個檔案加入「來源」</li>
              <li>
                使用提示詞：「依照『組內討論結果』檔案中的評估設計，請幫我檢查是否符合學習評估規劃原則，有無須修改處。執行前，若有問題，請先問我。」
              </li>
              <li>請與 AI 來回討論、迭代修正，直到滿意為止</li>
              <li>
                帶著最終結果回到網站，到「第四關 AI迭代結果」填寫最終版本，並<b style={{ color: "#B33" }}>說明修改理由（這是評分重點）</b>
              </li>
            </ol>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn-story outline" onClick={() => setOpen(false)}>取消</button>
              <a href="/api/export/group-discussion" onClick={() => setOpen(false)}>
                <button className="btn-story">我了解了，開始下載</button>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
