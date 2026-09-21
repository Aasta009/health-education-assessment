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
    const data = await res.json();
    if (data.session?.role === "staff") {
      router.push("/teacher/dashboard");
    } else {
      router.push("/s");
    }
  }

  return (
    <main className="container" style={{ paddingTop: 48 }}>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <img
          src="/images/login-umbrella.jpg"
          alt="靠在門邊的破傘"
          style={{ width: "100%", maxWidth: 320, borderRadius: 6, display: "inline-block",
            boxShadow: "0 4px 16px rgba(58,46,35,0.25)" }}
        />
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
