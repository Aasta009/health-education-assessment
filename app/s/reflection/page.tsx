"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Member = { student_id: string; name: string; content: string; updated_at: string };

export default function ReflectionPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const res = await fetch("/api/reflection");
    if (res.status === 401) { router.push("/login"); return; }
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "載入失敗");
      setLoaded(true);
      return;
    }
    const d = await res.json();
    setText(d.mine?.content || "");
    setMembers(d.members || []);
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    setSaving(true);
    await fetch("/api/reflection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    setSaving(false);
    load();
  }

  if (!loaded) return <main className="container"><p>載入中…</p></main>;
  if (err) return <main className="container"><p style={{ color: "#a4432b" }}>{err}</p></main>;

  return (
    <main className="container" style={{ paddingTop: 32 }}>
      <a href="/s">← 回到旅程地圖</a>
      <h2 className="story-title" style={{ fontSize: 21 }}>個人反思心得</h2>
      <p style={{ color: "var(--ink-soft)" }}>這是你自己的段落，不會被合併成組別版本——組員彼此看得到，但每個人寫的還是自己的。</p>

      <div className="card-story">
        <h4 style={{ marginTop: 0 }}>我的反思</h4>
        <textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn-story" style={{ marginTop: 10 }} onClick={save} disabled={saving}>
          {saving ? "儲存中…" : "儲存我的反思"}
        </button>
      </div>

      <div className="card-story">
        <h4 style={{ marginTop: 0 }}>組員的反思</h4>
        {members.filter((m) => m.content).length === 0 && <p style={{ color: "#999" }}>目前還沒有人寫。</p>}
        {members.filter((m) => m.content).map((m) => (
          <div key={m.student_id} style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
            <b>{m.name}</b>
            <p style={{ whiteSpace: "pre-wrap", margin: "4px 0 0" }}>{m.content}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
