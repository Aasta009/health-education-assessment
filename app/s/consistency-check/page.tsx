"use client";
import { useEffect, useState } from "react";

type Member = { student_id: string; name: string; stance: string; reason: string };
type Item = {
  id: number;
  issue_text: string;
  status: "flagged" | "resolved";
  resolution: string | null;
  mine: { stance: string; reason: string } | null;
  members: Member[];
  final: { stance: string; reason: string; finalized_by_name: string } | null;
};

const RESOLUTION_LABEL: Record<string, string> = {
  disagree: "不贊同（已說明理由，視為成立）",
  revised: "已修改並通過複查",
};

export default function ConsistencyCheckPage() {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState("");
  const [ran, setRan] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [allResolved, setAllResolved] = useState(false);
  const [checking, setChecking] = useState(false);
  const [drafts, setDrafts] = useState<Record<number, { stance: string; reason: string }>>({});
  const [busyItem, setBusyItem] = useState<number | null>(null);
  const [recheckingAll, setRecheckingAll] = useState(false);

  // load() only ever reflects its OWN fetch outcome. It never clears an
  // error set by whichever action called it — otherwise the error flashes
  // and disappears before anyone can read it.
  async function load() {
    const res = await fetch("/api/consistency");
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "載入失敗");
      setLoaded(true);
      return;
    }
    const d = await res.json();
    setRan(d.ran);
    setItems(d.items);
    setAllResolved(d.allResolved);
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  async function startCheck() {
    setChecking(true);
    setErr("");
    const res = await fetch("/api/consistency/check", { method: "POST" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "檢核失敗");
    }
    setChecking(false);
    load();
  }

  function setDraft(itemId: number, patch: Partial<{ stance: string; reason: string }>) {
    setDrafts((prev) => ({ ...prev, [itemId]: { stance: "agree", reason: "", ...prev[itemId], ...patch } }));
  }

  async function saveMine(itemId: number) {
    const d = drafts[itemId] || { stance: "agree", reason: "" };
    setBusyItem(itemId);
    setErr("");
    const res = await fetch("/api/consistency/respond", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, stance: d.stance, reason: d.reason }),
    });
    if (!res.ok) {
      const dd = await res.json().catch(() => ({}));
      setErr(dd.error || "儲存失敗");
    }
    setBusyItem(null);
    load();
  }

  async function finalize(itemId: number) {
    const d = drafts[itemId] || { stance: "agree", reason: "" };
    setBusyItem(itemId);
    setErr("");
    const res = await fetch("/api/consistency/finalize", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, stance: d.stance, reason: d.reason }),
    });
    if (!res.ok) {
      const dd = await res.json().catch(() => ({}));
      setErr(dd.error || "定稿失敗");
    }
    setBusyItem(null);
    load();
  }

  async function recheckAll() {
    setRecheckingAll(true);
    setErr("");
    const res = await fetch("/api/consistency/recheck-all", { method: "POST" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "重新檢核失敗");
    }
    setRecheckingAll(false);
    load();
  }

  const pendingCount = items.filter((it) => it.resolution === "revise_pending").length;

  if (!loaded) return <main className="container"><p>載入中…</p></main>;
  if (err && !ran && items.length === 0) {
    return (
      <main className="container" style={{ paddingTop: 32 }}>
        <a href="/s">← 回到關卡總覽</a>
        <div className="card-story"><p style={{ color: "#8a5a1f" }}>{err}</p></div>
      </main>
    );
  }

  return (
    <main className="container" style={{ paddingTop: 32, maxWidth: 800 }}>
      <a href="/s">← 回到關卡總覽</a>
      <h2 className="story-title" style={{ fontSize: 21 }}>第六關　AI一致性檢核</h2>
      <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>
        這一關不是幫你們寫內容，而是用 AI 比對「AI迭代後最終結果」跟「活動規劃書」是否真的互相呼應，找出邏輯不一致的地方。
      </p>

      {err && (
        <div className="card-story" style={{ borderLeft: "4px solid #a4432b" }}>
          <p style={{ color: "#a4432b", fontSize: 13.5, margin: 0, whiteSpace: "pre-wrap" }}>{err}</p>
          {err.includes("配額已用完") ? (
            <p style={{ color: "#8a5a1f", fontSize: 12.5, margin: "6px 0 0" }}>這不是暫時性問題，請聯絡老師／助教確認 AI 服務的方案設定，稍後再回來繼續。</p>
          ) : err.includes("503") || err.includes("429") ? (
            <p style={{ color: "#8a5a1f", fontSize: 12.5, margin: "6px 0 0" }}>這通常是 Google 伺服器暫時忙碌，稍等一下再按一次通常就會成功。</p>
          ) : null}
        </div>
      )}

      {!ran && (
        <div className="card-story" style={{ textAlign: "center" }}>
          <p style={{ fontSize: 14, marginBottom: 10 }}>準備好後，開始第一次 AI 檢核。</p>
          <button className="btn-story" disabled={checking} onClick={startCheck}>
            {checking ? "檢核中…" : "開始 AI 檢核"}
          </button>
        </div>
      )}

      {ran && items.length === 0 && (
        <div className="card-story" style={{ background: "#E4EEE2", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 14 }}>✓ AI 檢核完全通過，沒有發現不一致的地方！</p>
        </div>
      )}

      {pendingCount > 0 && (
        <div className="card-story" style={{ textAlign: "center", background: "#f3ecdd" }}>
          <p style={{ margin: "0 0 10px", fontSize: 13.5 }}>
            有 {pendingCount} 項已標記為「需要修改」。請先到活動規劃書把對應的內容都改好，再一次送出複查。
          </p>
          <button className="btn-story" disabled={recheckingAll} onClick={recheckAll}>
            {recheckingAll ? "複查中…" : `重新檢核所有已修改項目（${pendingCount}）`}
          </button>
        </div>
      )}

      {items.map((it) => (
        <div className="card-story" key={it.id}>
          <p style={{ margin: "0 0 10px", fontSize: 14, fontWeight: it.status === "flagged" ? 700 : 400 }}>
            {it.status === "resolved" ? "✓ " : "⚠ "}{it.issue_text}
          </p>

          {it.status === "resolved" && (
            <p style={{ fontSize: 12.5, color: "var(--forest)", margin: 0 }}>
              {RESOLUTION_LABEL[it.resolution || ""] || "已解決"}
              {it.final?.reason && it.resolution === "disagree" && `　理由：${it.final.reason}`}
            </p>
          )}

          {it.status === "flagged" && it.resolution === "revise_pending" && (
            <div>
              <p style={{ fontSize: 13, color: "#8a5a1f" }}>
                組員已同意這項需要修改，請前往「活動規劃書」調整內容。全部改好後，用下方的「重新檢核所有已修改項目」一次送查。
              </p>
              <a href="/s/activity-plan"><button className="btn-story outline" style={{ fontSize: 13 }}>前往活動規劃書</button></a>
            </div>
          )}

          {it.status === "flagged" && it.resolution == null && (
            <div>
              <div style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 12.5, fontWeight: 700, margin: "0 0 4px" }}>我的立場</p>
                {["agree", "disagree"].map((s) => (
                  <label key={s} style={{ marginRight: 14, fontSize: 13 }}>
                    <input type="radio" name={`mine-${it.id}`}
                      checked={(drafts[it.id]?.stance ?? it.mine?.stance) === s}
                      onChange={() => setDraft(it.id, { stance: s })} />
                    {" "}{s === "agree" ? "贊同（這裡的確需要修改）" : "不贊同（我認為沒問題）"}
                  </label>
                ))}
                <textarea rows={2} placeholder="說明原因（不贊同時必填）"
                  defaultValue={it.mine?.reason || ""}
                  onChange={(e) => setDraft(it.id, { reason: e.target.value })}
                  style={{ fontSize: 13, marginTop: 6 }} />
                <button className="btn-story outline" style={{ fontSize: 12, padding: "5px 10px", marginTop: 6 }}
                  disabled={busyItem === it.id} onClick={() => saveMine(it.id)}>儲存我的立場</button>
              </div>

              {it.members.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 12.5, fontWeight: 700, margin: "0 0 4px" }}>組員的立場</p>
                  {it.members.map((m) => (
                    <p key={m.student_id} style={{ fontSize: 12.5, margin: "2px 0" }}>
                      <b>{m.name}：</b>{m.stance === "agree" ? "贊同" : "不贊同"}{m.reason && `（${m.reason}）`}
                    </p>
                  ))}
                </div>
              )}

              <div style={{ borderTop: "1px dashed var(--line)", paddingTop: 8 }}>
                <p style={{ fontSize: 12.5, fontWeight: 700, margin: "0 0 4px" }}>組內定稿</p>
                <button className="btn-story" style={{ fontSize: 12, padding: "5px 10px" }}
                  disabled={busyItem === it.id} onClick={() => finalize(it.id)}>
                  {busyItem === it.id ? "送出中…" : "以我目前的立場定稿"}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {allResolved && (
        <div className="card-story" style={{ background: "#E4EEE2", textAlign: "center" }}>
          <p style={{ margin: "0 0 10px", fontSize: 14 }}>✓ 所有項目都解決了，可以下載最終版本。</p>
          <a href="/api/export/final-plan"><button className="btn-story">下載「活動規劃書_下載」（Word）</button></a>
        </div>
      )}
    </main>
  );
}
