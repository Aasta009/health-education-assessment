"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Member = { student_id: string; name: string; content: string; updated_at: string };

export default function FieldPage() {
  const params = useParams();
  const key = params.key as string;
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [mineText, setMineText] = useState("");
  const [mergeText, setMergeText] = useState("");
  const [savingMine, setSavingMine] = useState(false);
  const [savingFinal, setSavingFinal] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    const res = await fetch(`/api/field/${key}`);
    if (res.status === 401) { router.push("/login"); return; }
    if (res.status === 403) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "這一段路還沒開放");
      return;
    }
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "載入失敗");
      return;
    }
    const d = await res.json();
    setData(d);
    setMineText(d.mine?.content || "");
    setMergeText(d.final?.content || "");
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [key]);

  async function saveMine() {
    setSavingMine(true);
    await fetch(`/api/field/${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: mineText }),
    });
    setSavingMine(false);
    load();
  }

  async function finalize() {
    setSavingFinal(true);
    await fetch(`/api/field/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: mergeText }),
    });
    setSavingFinal(false);
    load();
  }

  if (err) return <main className="container"><p style={{ color: "#b33" }}>{err}</p></main>;
  if (!data) return <main className="container"><p>載入中…</p></main>;

  const { field, members, final } = data;

  return (
    <main className="container" style={{ paddingTop: 32 }}>
      <a href="/s">← 回到旅程地圖</a>
      <h2 className="story-title" style={{ fontSize: 21 }}>{field.label}</h2>
      {field.prompt && <p style={{ color: "#7a6a52" }}>{field.prompt}</p>}

      <div className="card-story">
        <h4 style={{ marginTop: 0 }}>1. 我的想法（個人）</h4>
        <textarea rows={field.multiline ? 8 : 4} value={mineText} onChange={(e) => setMineText(e.target.value)} />
        <button className="btn-story" style={{ marginTop: 10 }} onClick={saveMine} disabled={savingMine}>
          {savingMine ? "儲存中…" : "儲存我的想法"}
        </button>
      </div>

      <div className="card-story">
        <h4 style={{ marginTop: 0 }}>2. 組員的想法</h4>
        {members.length === 0 && <p style={{ color: "#999" }}>目前還沒有人填寫。</p>}
        {members.map((m: Member) => (
          <div key={m.student_id} style={{ padding: "8px 0", borderBottom: "1px solid #eee2cc" }}>
            <b>{m.name}</b>
            <p style={{ whiteSpace: "pre-wrap", margin: "4px 0 0" }}>{m.content}</p>
          </div>
        ))}
      </div>

      <div className="card-story">
        <h4 style={{ marginTop: 0 }}>3. 組內定稿版本</h4>
        {final && (
          <p style={{ fontSize: 13, color: "#7a6a52" }}>
            上次定稿人：{final.finalized_by_name}
          </p>
        )}
        <textarea rows={field.multiline ? 8 : 4} value={mergeText} onChange={(e) => setMergeText(e.target.value)}
          placeholder="請組員討論後，把整合好的內容寫在這裡" />
        <button className="btn-story" style={{ marginTop: 10 }} onClick={finalize} disabled={savingFinal}>
          {savingFinal ? "儲存中…" : "定稿為組別版本"}
        </button>
      </div>
    </main>
  );
}
