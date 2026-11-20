// Motion-graphic inserts layered over the 3D world: photos, name cards,
// big numbers, stamps, quotes. All timing is relative to beats.
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile } from "remotion";
import { MONO, SANS } from "../fonts";
import { C } from "../theme";
import { Timeline } from "./timeline";
import type { Insert } from "./types";

export type Credit = { name: string; title: string; creator?: string; license: string; source: string };

type Active = { ins: Insert; u: number; start: number; end: number; local: number };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const IN = 0.45; // seconds to animate in
const OUT = 0.35; // seconds to animate out

/** Resolve which inserts are on screen at time t. */
export const activeInserts = (inserts: Insert[] | undefined, tl: Timeline, t: number): Active[] => {
  const out: Active[] = [];
  for (const ins of inserts ?? []) {
    const b = tl.beats.find((x) => x.id === ins.beat);
    if (!b) continue;
    const d = b.end - b.start;
    const start = b.start + (ins.from ?? 0) * d;
    let end = b.start + (ins.to ?? 1) * d;
    if (ins.untilBeat) {
      const ub = tl.beats.find((x) => x.id === ins.untilBeat);
      if (ub) end = ub.start + (ins.to ?? 1) * (ub.end - ub.start);
    }
    // stamps and numbers hold through the gap to the next beat
    if (t < start - 0.01 || t > end + OUT) continue;
    out.push({ ins, start, end, local: t - start, u: (t - start) / Math.max(0.01, end - start) });
  }
  return out;
};

/** 0..1 visibility envelope */
const env = (a: Active, t: number) =>
  Math.min(interpolate(t, [a.start, a.start + IN], [0, 1], clamp), interpolate(t, [a.end, a.end + OUT], [1, 0], clamp));

/** Camera shake (px) from stamps, decaying after impact. */
export const shakeAt = (actives: Active[]) => {
  let x = 0;
  let y = 0;
  for (const a of actives) {
    if (a.ins.kind !== "stamp") continue;
    const k = a.local - 0.18; // impact moment
    if (k < 0 || k > 0.6) continue;
    const amp = 18 * Math.exp(-k * 7);
    x += Math.sin(k * 90) * amp;
    y += Math.cos(k * 70) * amp * 0.6;
  }
  return { x, y };
};

/** Full-bleed photos sit UNDER the paper gradient so they blend into the page. */
export const FullBleed: React.FC<{ actives: Active[]; t: number; ep: string }> = ({ actives, t, ep }) => (
  <>
    {actives.map((a, i) => {
      if (a.ins.kind !== "photo" || a.ins.layout !== "full") return null;
      const ins = a.ins;
      const o = env(a, t);
      const zoom = interpolate(a.local, [0, a.end - a.start + OUT], [1.06, 1.18], clamp);
      const [fx, fy] = ins.focus ?? [0.5, 0.45];
      return (
        <AbsoluteFill key={i} style={{ opacity: o, overflow: "hidden" }}>
          <Img
            src={staticFile(`${ep}/media/${ins.src}.jpg`)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: `${fx * 100}% ${fy * 100}%`,
              scale: String(zoom),
              transformOrigin: `${fx * 100}% ${fy * 100}%`,
              filter: ins.grade === "mono" ? "grayscale(1) contrast(1.05) brightness(1.02)" : "sepia(0.18) saturate(0.88) contrast(1.04)",
            }}
          />
          {/* paper wash keeps the palette */}
          <AbsoluteFill style={{ background: C.paper, opacity: 0.12, mixBlendMode: "multiply" }} />
          {/* reveal wipe */}
          <AbsoluteFill
            style={{
              background: C.paper,
              clipPath: `inset(0 0 ${interpolate(a.local, [0, 0.55], [0, 100], { ...clamp, easing: Easing.bezier(0.7, 0, 0.2, 1) })}% 0)`,
            }}
          />
        </AbsoluteFill>
      );
    })}
  </>
);

/** Veil that dims the world while a card / number is up. */
export const veilAt = (actives: Active[], t: number) =>
  Math.max(0, ...actives.filter((a) => a.ins.kind === "number" || a.ins.kind === "quote" || (a.ins.kind === "photo" && a.ins.layout === "card")).map((a) => env(a, t) * (a.ins.kind === "photo" ? 0.45 : 0.82)));

const creditLine = (c?: Credit) => (c ? `PHOTO · ${(c.creator ?? "UNKNOWN").toUpperCase()} · ${c.license.toUpperCase()}` : "");

const fmtNumber = (v: number, format?: "full" | "plain") => (format === "plain" ? String(Math.round(v)) : Math.round(v).toLocaleString("en-US"));

export const Overlays: React.FC<{ actives: Active[]; t: number; ep: string; credits: Credit[] }> = ({ actives, t, ep, credits }) => {
  const people = actives.filter((a) => a.ins.kind === "person");
  return (
  <>
    {actives.map((a, i) => {
      const o = env(a, t);
      const ins = a.ins;
      const pop = interpolate(a.local, [0, IN], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });

      if (ins.kind === "photo" && ins.layout === "card") {
        const credit = credits.find((c) => c.name === ins.src);
        const dir = ins.side === "left" ? -1 : 1;
        const tilt = ins.tilt ?? (dir > 0 ? 2.5 : -2.5);
        const zoom = interpolate(a.local, [0, a.end - a.start + OUT], [1.0, 1.1], clamp);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 120,
              right: 120,
              top: 520,
              opacity: o,
              translate: `${(1 - pop) * dir * 700}px ${(1 - pop) * 40}px`,
              rotate: `${tilt * pop + (1 - pop) * dir * 12}deg`,
              background: "#FFFDF8",
              padding: "22px 22px 64px",
              boxShadow: "0 30px 60px rgba(40,30,20,0.28), 0 4px 10px rgba(40,30,20,0.18)",
            }}
          >
            <div style={{ overflow: "hidden", height: 600 }}>
              <Img
                src={staticFile(`${ep}/media/${ins.src}.jpg`)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: `${(ins.focus?.[0] ?? 0.5) * 100}% ${(ins.focus?.[1] ?? 0.5) * 100}%`,
                  scale: String(zoom),
                  filter: ins.grade === "mono" ? "grayscale(1)" : "sepia(0.12) saturate(0.92)",
                }}
              />
            </div>
            <div style={{ position: "absolute", left: 24, right: 24, bottom: 16, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 30, color: C.ink }}>{ins.caption ?? ""}</span>
              <span style={{ fontFamily: MONO, fontSize: 15, letterSpacing: 1, color: C.inkSoft, maxWidth: 520, textAlign: "right", lineHeight: 1.2 }}>{creditLine(credit)}</span>
            </div>
          </div>
        );
      }

      if (ins.kind === "photo") {
        const credit = credits.find((c) => c.name === ins.src);
        return (
          <div key={i} style={{ position: "absolute", right: 70, top: 1395, opacity: o * 0.9, fontFamily: MONO, fontSize: 16, letterSpacing: 1, color: C.ink, textAlign: "right" }}>
            {creditLine(credit)}
          </div>
        );
      }

      if (ins.kind === "person") {
        const credit = ins.photo ? credits.find((c) => c.name === ins.photo) : undefined;
        const initials = ins.name
          .split(/\s+/)
          .map((w) => w[0])
          .join("")
          .slice(0, 2);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 70,
              top: 1180 - people.indexOf(a) * 190,
              display: "flex",
              alignItems: "center",
              gap: 26,
              opacity: o,
              translate: `${(1 - pop) * -120}px 0`,
            }}
          >
            <div style={{ width: 150, height: 150, background: C.ink, overflow: "hidden", flexShrink: 0, boxShadow: "0 12px 30px rgba(0,0,0,0.2)" }}>
              {ins.photo ? (
                <Img src={staticFile(`${ep}/media/${ins.photo}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 25%", filter: "grayscale(1) contrast(1.08)" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 700, fontSize: 64, color: C.paper, letterSpacing: -2 }}>
                  {initials}
                </div>
              )}
            </div>
            <div style={{ background: `${C.paper}F0`, padding: "14px 22px 16px", borderLeft: `6px solid ${C.accent}` }}>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 50, letterSpacing: -1, color: C.ink, lineHeight: 1 }}>{ins.name}</div>
              <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 3, color: C.inkSoft, marginTop: 10 }}>{ins.role.toUpperCase()}</div>
              {credit ? <div style={{ fontFamily: MONO, fontSize: 13, color: C.inkSoft, marginTop: 6 }}>{creditLine(credit)}</div> : null}
            </div>
          </div>
        );
      }

      if (ins.kind === "number") {
        const count = interpolate(a.local, [0.1, 1.1], [0, ins.value], { ...clamp, easing: Easing.bezier(0.2, 0.8, 0.2, 1) });
        const landed = a.local > 1.1;
        const bump = landed ? interpolate(a.local, [1.1, 1.25, 1.45], [1, 1.06, 1], clamp) : 1;
        const col = ins.accent ? C.accent : C.ink;
        return (
          <AbsoluteFill key={i} style={{ opacity: o, alignItems: "center", justifyContent: "center", paddingBottom: 140 }}>
            <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: C.inkSoft, marginBottom: 18 }}>{ins.label.toUpperCase()}</div>
            <div
              style={{
                fontFamily: SANS,
                fontWeight: 700,
                fontSize: (ins.prefix ?? "").length + fmtNumber(ins.value, ins.format).length + (ins.suffix ?? "").length > 12 ? 104 : 190,
                letterSpacing: -4,
                color: col,
                scale: String(bump * (0.92 + 0.08 * pop)),
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
              }}
            >
              {ins.prefix}
              {fmtNumber(count, ins.format)}
              {ins.suffix}
            </div>
            {ins.sub ? (
              <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 44, color: C.ink, marginTop: 14, opacity: interpolate(a.local, [1.2, 1.6], [0, 1], clamp) }}>{ins.sub}</div>
            ) : null}
          </AbsoluteFill>
        );
      }

      if (ins.kind === "stamp") {
        const hit = interpolate(a.local, [0, 0.18], [2.4, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
        const show = interpolate(a.local, [0, 0.12], [0, 1], clamp);
        return (
          <AbsoluteFill key={i} style={{ alignItems: "center", justifyContent: "center", opacity: show * o, paddingBottom: 120 }}>
            <div
              style={{
                rotate: "-9deg",
                scale: String(hit),
                border: `12px solid ${C.accent}`,
                borderRadius: 18,
                padding: "18px 46px 10px",
                color: C.accent,
                fontFamily: SANS,
                fontWeight: 700,
                fontSize: 150,
                letterSpacing: 6,
                lineHeight: 1,
                textAlign: "center",
                background: `${C.paper}C8`,
                boxShadow: `inset 0 0 0 4px ${C.paper}`,
              }}
            >
              {ins.text}
              {ins.sub ? <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 6, marginTop: 6, fontWeight: 500 }}>{ins.sub}</div> : null}
            </div>
          </AbsoluteFill>
        );
      }

      if (ins.kind === "quote") {
        return (
          <AbsoluteFill key={i} style={{ opacity: o, alignItems: "center", justifyContent: "center", padding: "0 110px 140px" }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 210, color: C.accent, lineHeight: 0.6, height: 90, alignSelf: "flex-start" }}>“</div>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 96, letterSpacing: -2, lineHeight: 1.02, color: C.ink, textAlign: "center", scale: String(0.94 + 0.06 * pop) }}>{ins.text}</div>
            <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 5, color: C.inkSoft, marginTop: 30 }}>— {ins.by.toUpperCase()}</div>
          </AbsoluteFill>
        );
      }
      return null;
    })}
  </>
  );
};

/** Thin 2012 ——●—— 2021 bar under the headline. */
export const YearBar: React.FC<{ years: [number, number]; year: number; t: number; prevYear: number; beatStart: number }> = ({ years, year, prevYear, t, beatStart }) => {
  const [a, b] = years;
  const k = interpolate(t, [beatStart - 0.2, beatStart + 0.6], [prevYear, year], { ...clamp, easing: Easing.bezier(0.4, 0, 0.2, 1) });
  const x = (k - a) / (b - a);
  const W = 912;
  return (
    <div style={{ position: "absolute", left: 84, top: 392, width: W, height: 40 }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 18, height: 2, background: "#CFC8BB" }} />
      <div style={{ position: "absolute", left: 0, width: x * W, top: 17, height: 4, background: C.accent }} />
      {Array.from({ length: b - a + 1 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: (i / (b - a)) * W - 1, top: 13, width: 2, height: 12, background: a + i <= k ? C.accent : "#BDB5A7" }} />
      ))}
      <div style={{ position: "absolute", left: x * W - 9, top: 10, width: 18, height: 18, borderRadius: 9, background: C.accent, boxShadow: `0 0 0 5px ${C.paper}` }} />
      <div style={{ position: "absolute", left: 0, top: 30, fontFamily: MONO, fontSize: 16, color: C.inkSoft }}>{a}</div>
      <div style={{ position: "absolute", right: 0, top: 30, fontFamily: MONO, fontSize: 16, color: C.inkSoft }}>{b}</div>
    </div>
  );
};

/** End card with photo credits (CC BY / BY-SA need attribution). */
export const CreditsCard: React.FC<{ credits: Credit[]; t: number; start: number }> = ({ credits, t, start }) => {
  if (!credits.length || t < start) return null;
  const o = interpolate(t, [start, start + 0.5], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: `${C.paper}F2`, opacity: o, padding: "0 90px", justifyContent: "center" }}>
      <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 6, color: C.accent, marginBottom: 26 }}>PHOTO CREDITS</div>
      {credits.map((c) => (
        <div key={c.name} style={{ fontFamily: MONO, fontSize: 24, lineHeight: 1.4, color: C.ink, marginBottom: 8 }}>
          {c.title.slice(0, 44)} — {c.creator ?? "unknown"} · {c.license}
        </div>
      ))}
      <div style={{ fontFamily: MONO, fontSize: 22, color: C.inkSoft, marginTop: 24 }}>Full links in the description. 3D models: original reconstructions.</div>
    </AbsoluteFill>
  );
};
