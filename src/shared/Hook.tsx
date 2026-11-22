// Retention helpers: the frame-0 hook title, the end-of-video comment prompt, and the cover title.
import React from "react";
import { Easing, interpolate } from "remotion";
import { MONO, SANS } from "../fonts";
import { C } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Two big lines on paper slabs; fully visible on frame 0 (no fade-in), slight settle, then out. */
export const HookTitle: React.FC<{ lines: string[]; t: number; until: number }> = ({ lines, t, until }) => {
  if (t > until + 0.4) return null;
  const settle = interpolate(t, [0, 0.35], [1.06, 1], { ...clamp, easing: Easing.bezier(0.2, 0.8, 0.2, 1) });
  const out = interpolate(t, [until, until + 0.4], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, opacity: out, scale: String(settle) }}>
      {lines.map((l, i) => (
        <div
          key={i}
          style={{
            background: i === lines.length - 1 ? C.accent : C.ink,
            color: i === lines.length - 1 ? "#FFFFFF" : C.paper,
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 92,
            letterSpacing: -2,
            lineHeight: 1.05,
            padding: "10px 26px 14px",
            borderRadius: 14,
            rotate: i % 2 ? "1deg" : "-1.2deg",
            boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
            textAlign: "center",
          }}
        >
          {l}
        </div>
      ))}
    </div>
  );
};

/** Comment prompt over the last beat. */
export const CtaPill: React.FC<{ text: string; t: number; start: number }> = ({ text, t, start }) => {
  if (t < start) return null;
  const k = interpolate(t, [start, start + 0.4], [0, 1], { ...clamp, easing: Easing.bezier(0.2, 1.3, 0.4, 1) });
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: 1290, display: "flex", justifyContent: "center", opacity: k, translate: `0 ${(1 - k) * 30}px` }}>
      <div style={{ background: C.paper, border: `3px solid ${C.ink}`, borderRadius: 999, padding: "14px 30px", display: "flex", gap: 16, alignItems: "center", boxShadow: "0 12px 30px rgba(0,0,0,0.18)" }}>
        <span style={{ width: 34, height: 34, borderRadius: 17, background: C.accent, display: "inline-block", flexShrink: 0 }} />
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 36, letterSpacing: -0.5, color: C.ink, whiteSpace: "nowrap" }}>{text}</span>
      </div>
    </div>
  );
};

/** Cover title (npm run cover). */
export const CoverTitle: React.FC<{ lines: string[]; sub?: string; channel: string }> = ({ lines, sub, channel }) => (
  <>
    <div style={{ position: "absolute", left: 60, right: 60, top: 260, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      {lines.map((l, i) => (
        <div
          key={i}
          style={{
            background: i === lines.length - 1 ? C.accent : C.ink,
            color: i === lines.length - 1 ? "#FFFFFF" : C.paper,
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 112,
            letterSpacing: -3,
            lineHeight: 1.02,
            padding: "12px 30px 18px",
            borderRadius: 16,
            rotate: i % 2 ? "1deg" : "-1.4deg",
            boxShadow: "0 20px 46px rgba(0,0,0,0.28)",
            textAlign: "center",
          }}
        >
          {l}
        </div>
      ))}
      {sub ? <div style={{ marginTop: 18, fontFamily: MONO, fontSize: 32, letterSpacing: 6, color: C.ink, background: `${C.paper}E8`, padding: "8px 18px" }}>{sub}</div> : null}
    </div>
    <div style={{ position: "absolute", bottom: 120, width: "100%", textAlign: "center", fontFamily: MONO, fontSize: 30, letterSpacing: 8, color: C.ink }}>{channel}</div>
  </>
);
