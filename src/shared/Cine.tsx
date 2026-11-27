// Cinematic-look overlays: archival portrait posters, one-word flash cards, hand-drawn marker
// annotations, Kandinsky's shape test, chapter slates, and a film-grain + vignette finish.
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, staticFile } from "remotion";
import { MONO, SANS } from "../fonts";
import type { Insert } from "./types";
import { creditLine, type Credit } from "./Inserts";

type Active = { ins: Insert; u: number; start: number; end: number; local: number };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = Easing.bezier(0.2, 1.4, 0.4, 1);

export const BH = { red: "#D8402E", yellow: "#F2C230", blue: "#2350A8", black: "#141312", white: "#F2EEE6" };

const Shape: React.FC<{ shape: "circle" | "square" | "triangle"; size: number; fill?: string; stroke?: string; sw?: number; rot?: number }> = ({ shape, size, fill = "none", stroke, sw = 0, rot = 0 }) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100" style={{ overflow: "visible", rotate: `${rot}deg` }}>
    {shape === "circle" ? <circle r={46} fill={fill} stroke={stroke} strokeWidth={sw} /> : null}
    {shape === "square" ? <rect x={-42} y={-42} width={84} height={84} fill={fill} stroke={stroke} strokeWidth={sw} /> : null}
    {shape === "triangle" ? <polygon points="0,-48 46,34 -46,34" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" /> : null}
  </svg>
);

/** Full-screen cinematic overlays (drawn above full-bleed media, below captions). */
export const CineOverlays: React.FC<{ actives: Active[]; t: number; ep: string; credits?: Credit[] }> = ({ actives, t, ep, credits = [] }) => (
  <>
    {actives.map((a, i) => {
      const ins = a.ins;
      const dur = a.end - a.start;
      const life = interpolate(a.local, [0, dur], [0, 1], clamp);

      if (ins.kind === "poster") {
        const bg = BH[ins.color ?? "red"];
        const shapeCol = ins.color === "yellow" ? BH.blue : ins.color === "blue" ? BH.yellow : BH.yellow;
        const k = interpolate(a.local, [0, 0.45], [0, 1], { ...clamp, easing: pop });
        const out = interpolate(t, [a.end, a.end + 0.15], [1, 0], clamp);
        return (
          <AbsoluteFill key={i} style={{ background: bg, opacity: out, overflow: "hidden" }}>
            {/* the big shape behind the head */}
            <div style={{ position: "absolute", left: 540, top: 680, translate: "-50% -50%", scale: String(0.6 + 0.4 * k + 0.08 * life) }}>
              <Shape shape={ins.shape ?? "circle"} size={900} fill={shapeCol} rot={life * 12} />
            </div>
            {/* cut-out portrait: mono, high contrast, slow push */}
            <div
              style={{
                position: "absolute",
                left: 540,
                top: 700,
                width: 720,
                height: 820,
                translate: `-50% -50%`,
                scale: String(1.0 + 0.06 * life),
                overflow: "hidden",
                boxShadow: "0 40px 90px rgba(0,0,0,0.45)",
                clipPath: `inset(${(1 - k) * 50}% 0 0 0)`,
              }}
            >
              <Img src={staticFile(`${ep}/media/${ins.src}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 25%", filter: "grayscale(1) contrast(1.35) brightness(1.05)" }} />
              {/* halftone dots hide the low resolution */}
              <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(0,0,0,0.35) 1.1px, transparent 1.6px)", backgroundSize: "6px 6px", mixBlendMode: "multiply", opacity: 0.55 }} />
            </div>
            {/* name, big and bold */}
            <div style={{ position: "absolute", left: 70, right: 70, top: 1150, opacity: interpolate(a.local, [0.2, 0.5], [0, 1], clamp), translate: `0 ${(1 - k) * 40}px` }}>
              <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: ins.name.length > 14 ? 76 : 96, lineHeight: 0.95, letterSpacing: -3, color: ins.color === "yellow" ? BH.black : BH.white, textTransform: "uppercase" }}>{ins.name}</div>
              <div style={{ position: "absolute", right: 0, top: -54, fontFamily: MONO, fontSize: 16, letterSpacing: 1, color: ins.color === "yellow" ? BH.black : BH.white, opacity: 0.75 }}>{creditLine(credits.find((c) => c.name === ins.src))}</div>
              {ins.role ? <div style={{ marginTop: 18, fontFamily: MONO, fontSize: 28, letterSpacing: 4, color: ins.color === "yellow" ? BH.black : BH.white, textTransform: "uppercase" }}>{ins.role}</div> : null}
            </div>
          </AbsoluteFill>
        );
      }

      if (ins.kind === "flash") {
        const tone = ins.tone ?? "light";
        const bg = tone === "light" ? BH.white : tone === "dark" ? BH.black : BH[tone];
        const fg = tone === "light" ? BH.black : tone === "yellow" ? BH.black : BH.white;
        const s = interpolate(a.local, [0, 0.12], [1.25, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
        return (
          <AbsoluteFill key={i} style={{ background: bg, justifyContent: "center", alignItems: "center" }}>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: ins.text.length > 9 ? 112 : 150, letterSpacing: -4, color: fg, scale: String(s), textTransform: "uppercase", textAlign: "center", lineHeight: 0.95, padding: "0 60px" }}>
              {ins.text}
            </div>
          </AbsoluteFill>
        );
      }

      if (ins.kind === "mark") {
        // pen draws on over 0.5 s, holds, fades
        const draw = interpolate(a.local, [0.05, 0.55], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
        const o = interpolate(t, [a.end, a.end + 0.25], [1, 0], clamp);
        const col = ins.color ?? BH.red;
        const { x, y, w, h } = ins;
        const jit = (n: number) => (random(`${i}-${n}`) - 0.5) * 0.06;
        let d = "";
        let len = 0;
        if (ins.shape === "circle") {
          const pts: string[] = [];
          const N = 48;
          for (let k = 0; k <= N + 6; k++) {
            const th = (k / N) * Math.PI * 2 - 0.6;
            const r = 1 + jit(k % 7) + (k > N ? 0.06 : 0);
            pts.push(`${x + (w / 2) * r * Math.cos(th)},${y + (h / 2) * r * Math.sin(th)}`);
          }
          d = "M" + pts.join(" L");
          len = Math.PI * (w + h) * 0.62;
        } else if (ins.shape === "underline") {
          d = `M${x - w / 2},${y} Q${x},${y + h * 0.25} ${x + w / 2},${y - h * 0.1}`;
          len = w * 1.1;
        } else {
          // arrow from (x,y) by (w,h)
          const x2 = x + w;
          const y2 = y + h;
          const ang = Math.atan2(h, w);
          const hl = 44;
          d = `M${x},${y} Q${x + w * 0.55},${y + h * 0.15} ${x2},${y2} M${x2},${y2} L${x2 - hl * Math.cos(ang - 0.5)},${y2 - hl * Math.sin(ang - 0.5)} M${x2},${y2} L${x2 - hl * Math.cos(ang + 0.5)},${y2 - hl * Math.sin(ang + 0.5)}`;
          len = Math.hypot(w, h) * 1.2 + 2 * hl;
        }
        return (
          <AbsoluteFill key={i} style={{ opacity: o }}>
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
              <path d={d} fill="none" stroke={col} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} style={{ filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.35))" }} />
            </svg>
            {ins.label ? (
              <div style={{ position: "absolute", left: x + (ins.shape === "arrow" ? 0 : -w / 2), top: y + (ins.shape === "arrow" ? -84 : h / 2 + 24), opacity: interpolate(a.local, [0.4, 0.6], [0, 1], clamp), fontFamily: SANS, fontWeight: 800, fontSize: 46, color: BH.white, background: col, padding: "6px 18px", whiteSpace: "nowrap" }}>
                {ins.label}
              </div>
            ) : null}
          </AbsoluteFill>
        );
      }

      if (ins.kind === "shapes") {
        const rev = ins.revealAt ?? 1.5;
        const fill = (k: number) => interpolate(life, [rev + k * 0.06, rev + k * 0.06 + 0.05], [0, 1], clamp);
        const items: { shape: "triangle" | "square" | "circle"; col: string }[] = [
          { shape: "triangle", col: BH.yellow },
          { shape: "square", col: BH.red },
          { shape: "circle", col: BH.blue },
        ];
        const o = interpolate(t, [a.end, a.end + 0.2], [1, 0], clamp);
        return (
          <AbsoluteFill key={i} style={{ background: BH.black, opacity: o }}>
            {items.map((it, k) => {
              const inK = interpolate(a.local, [0.1 + k * 0.18, 0.45 + k * 0.18], [0, 1], { ...clamp, easing: pop });
              const f = fill(k);
              return (
                <div key={k} style={{ position: "absolute", left: 540, top: 400 + k * 330, translate: "-50% -50%", scale: String(inK * (1 + 0.15 * Math.sin(Math.min(1, f) * Math.PI))) }}>
                  <Shape shape={it.shape} size={250} fill={f > 0 ? it.col : "none"} stroke={BH.white} sw={f > 0 ? 0 : 5} />
                  {f <= 0 ? (
                    <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", fontFamily: SANS, fontWeight: 800, fontSize: 110, color: BH.white, paddingTop: it.shape === "triangle" ? 50 : 0 }}>?</div>
                  ) : null}
                </div>
              );
            })}
          </AbsoluteFill>
        );
      }

      if (ins.kind === "chapter") {
        const bg = BH[ins.color ?? "yellow"];
        const fg = ins.color === "yellow" || !ins.color ? BH.black : BH.white;
        const wipe = interpolate(a.local, [0, 0.22], [0, 100], { ...clamp, easing: Easing.out(Easing.cubic) });
        const out = interpolate(t, [a.end - 0.15, a.end + 0.05], [0, 100], clamp);
        return (
          <AbsoluteFill key={i} style={{ background: bg, clipPath: `inset(${out}% 0 ${100 - wipe}% 0)` }}>
            <div style={{ position: "absolute", left: 80, top: 640, fontFamily: SANS, fontWeight: 800, fontSize: 420, lineHeight: 1, color: fg, letterSpacing: -20 }}>{ins.n}</div>
            <div style={{ position: "absolute", left: 90, top: 1120, fontFamily: SANS, fontWeight: 800, fontSize: 110, lineHeight: 0.95, color: fg, letterSpacing: -3, textTransform: "uppercase" }}>{ins.title}</div>
            <div style={{ position: "absolute", left: 96, top: 600, width: 180, height: 14, background: fg }} />
          </AbsoluteFill>
        );
      }
      return null;
    })}
  </>
);

/** Film grain (animated noise) + vignette, drawn over everything except captions. */
export const Grain: React.FC<{ frame: number }> = ({ frame }) => {
  const seed = frame % 8;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 0.13, mixBlendMode: "overlay" }}>
        <filter id={`g${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#g${seed})`} />
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 65% at 50% 48%, transparent 55%, rgba(0,0,0,0.55) 100%)" }} />
    </AbsoluteFill>
  );
};
