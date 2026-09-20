"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TeacherLogin() {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const res = await fetch("/api/teacher/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode: code }),
    });
    if (!res.ok) { setErr("通關碼錯誤"); return; }
    router.push("/teacher/dashboard");
  }

  return (
    <main className="container" style={{ paddingTop: 80 }}>
      <div className="card-story" style={{ maxWidth: 380, margin: "0 auto" }}>
        <h2 className="story-title" style={{ fontSize: 20 }}>引路人登入</h2>
        <form onSubmit={submit}>
          <input type="password" value={code} onChange={(e) => setCode(e.target.value)} placeholder="通關碼" autoFocus />
          {err && <p style={{ color: "#b33" }}>{err}</p>}
          <button className="btn-story" style={{ marginTop: 14, width: "100%" }}>進入</button>
        </form>
      </div>
    </main>
  );
}
