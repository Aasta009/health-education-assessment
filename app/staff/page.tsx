"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StaffLogin() {
  const [code, setCode] = useState("");
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
      body: JSON.stringify({ studentId: code }),
    });
    setLoading(false);
    if (!res.ok) {
      setErr("通關碼錯誤");
      return;
    }
    const data = await res.json();
    if (data.session?.role !== "staff") {
      setErr("這裡僅供教師／助教登入，請輸入正確的通關碼");
      return;
    }
    router.push("/teacher/dashboard");
  }

  return (
    <main className="container" style={{ paddingTop: 80 }}>
      <div className="card-story" style={{ maxWidth: 380, margin: "0 auto" }}>
        <h2 className="story-title" style={{ fontSize: 20 }}>引路人登入</h2>
        <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>教師／助教請在此輸入通關碼</p>
        <form onSubmit={submit}>
          <input type="password" value={code} onChange={(e) => setCode(e.target.value)} placeholder="通關碼" autoFocus />
          {err && <p style={{ color: "#a4432b" }}>{err}</p>}
          <button className="btn-story" style={{ marginTop: 14, width: "100%" }} disabled={loading}>
            {loading ? "進入中…" : "進入"}
          </button>
        </form>
      </div>
    </main>
  );
}
