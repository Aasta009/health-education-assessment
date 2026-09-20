"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [id, setId] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: id }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error || "找不到這個學號，再看看是不是打錯了？");
      return;
    }
    router.push("/s");
  }

  return (
    <main className="container" style={{ paddingTop: 48 }}>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <svg width="120" height="100" viewBox="0 0 120 100">
          <path d="M15,60 Q60,10 105,60 Q90,45 75,58 Q60,42 45,58 Q30,45 15,60 Z"
            fill="none" stroke="#3A2E23" strokeWidth="3" />
          <circle cx="60" cy="30" r="4" fill="none" stroke="#C1673F" strokeWidth="2" />
          <line x1="60" y1="60" x2="60" y2="95" stroke="#5A4433" strokeWidth="4" strokeLinecap="round" />
          <path d="M60,95 q10,3 8,10" fill="none" stroke="#5A4433" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
      <p style={{ textAlign: "center", color: "var(--ink-soft)", fontSize: 14, marginTop: 0 }}>
        它漏了一個洞，但你還是帶著它上路了。
      </p>

      <div className="card-story" style={{ maxWidth: 400, margin: "18px auto 0" }}>
        <h2 className="story-title" style={{ fontSize: 20, marginTop: 0 }}>報上你的學號</h2>
        <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>這樣故事才知道，該把哪一段路交給你。</p>
        <form onSubmit={submit}>
          <input
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="例如：114015018"
            autoFocus
          />
          {err && <p style={{ color: "#a4432b", fontSize: 13.5 }}>{err}</p>}
          <button className="btn-story" style={{ marginTop: 14, width: "100%" }} disabled={loading}>
            {loading ? "推開門中…" : "推開門"}
          </button>
        </form>
      </div>
    </main>
  );
}
