"use client";
import { useState } from "react";
import Link from "next/link";

// Door hotspot position, expressed as % of the hero image's native size
// (1672 x 941), so it stays aligned at any display width.
const DOOR = { left: 29.9, top: 48.9, width: 17.9, height: 27.6 };

export default function Home() {
  const [open, setOpen] = useState(false);

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative", width: "100%", aspectRatio: "1600 / 900", overflow: "hidden", background: "#1a1410" }}>
        <img
          src="/images/hero-closed.jpg"
          alt="村口的鐘塔，黃昏"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />

        {/* door hotspot */}
        <button
          onClick={() => setOpen(true)}
          aria-label="打開鐘塔的門"
          style={{
            position: "absolute",
            left: `${DOOR.left}%`,
            top: `${DOOR.top}%`,
            width: `${DOOR.width}%`,
            height: `${DOOR.height}%`,
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: open ? "default" : "pointer",
          }}
        >
          {/* open-door overlay, cross-fades in on click */}
          <img
            src="/images/door-open-overlay.webp"
            alt=""
            style={{
              width: "100%", height: "100%", objectFit: "contain",
              opacity: open ? 1 : 0,
              transition: "opacity 1s ease",
              pointerEvents: "none",
            }}
          />
          {/* gentle invitation glow before the door is opened */}
          {!open && (
            <span
              style={{
                position: "absolute", inset: "18%",
                borderRadius: "50% 50% 45% 45%",
                boxShadow: "0 0 22px 6px rgba(214,167,86,0.55)",
                animation: "doorPulse 2.4s ease-in-out infinite",
              }}
            />
          )}
        </button>

        <style>{`
          @keyframes doorPulse {
            0%, 100% { opacity: 0.35; }
            50% { opacity: 0.85; }
          }
        `}</style>
      </div>

      {/* ---- Story text + entry ---- */}
      <div className="container" style={{ textAlign: "center", marginTop: -30 }}>
        <div className="card-story" style={{ maxWidth: 520, margin: "0 auto" }}>
          {!open ? (
            <>
              <p style={{ color: "var(--ink-soft)", fontSize: 15, margin: "6px 0 14px" }}>
                村口的鐘，從來不敲。<br />直到有人願意打開它——
              </p>
              <p style={{ fontFamily: "'Noto Serif TC', serif", fontWeight: 700, fontSize: 18 }}>
                點一下鐘塔的門，看看裡面有什麼。
              </p>
            </>
          ) : (
            <>
              <h1 className="story-title" style={{ fontSize: 26, margin: "4px 0 10px" }}>
                學習者評估
              </h1>
              <p style={{ color: "var(--ink-soft)", fontSize: 14.5, lineHeight: 1.8, margin: "0 0 22px" }}>
                鐘門打開，掉出一把破傘。<br />
                「帶著它，去你不知道的地方。」<br />
                這趟旅程會經過草原、森林、河流與小屋——<br />
                每一站，你都會留下一點什麼，也會帶走一點什麼。
              </p>
              <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/login"><button className="btn-story">拿起傘，出發　</button></Link>
                <Link href="/login"><button className="btn-story outline">我是引路人（教師／助教）</button></Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
