// Motion-graphic inserts layered over the 3D world: photos, name cards,
// big numbers, stamps, quotes. All timing is relative to beats.
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { Video } from "@remotion/media";
import { MONO, SANS } from "../fonts";
import { C } from "../theme";
import { Timeline } from "./timeline";
import type { Insert } from "./types";

export type Credit = { name: string; title: string; creator?: string; license: string; source: string };

type Active = { ins: Insert; u: number; start: number; end: number; local: number };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const IN = 0.45; // seconds to animate in
const OUT = 0.35; // seconds to animate out

/** When an insert starts and ends (seconds), or null if its beat was cut. */
export const insertWindow = (ins: Insert, tl: Timeline): { start: number; end: number } | null => {
  const b = tl.beats.find((x) => x.id === ins.beat);
  if (!b) return null;
  const d = b.end - b.start;
  // an insert opening the first beat covers frame 0 too (narration starts a fraction later)
  let start = b === tl.beats[0] && !ins.from ? 0 : b.start + (ins.from ?? 0) * d;
  let end = b.start + (ins.to ?? 1) * d;
  if (ins.untilBeat) {
    const ub = tl.beats.find((x) => x.id === ins.untilBeat);
    if (ub) end = ub.start + (ins.to ?? 1) * (ub.end - ub.start);
  }
  // flash cards land on a spoken word and last a fraction of a second
  if (ins.kind === "flash") {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const w = ins.atWord
      ? tl.words.find((x) => x.startMs / 1000 >= b.start - 0.05 && x.startMs / 1000 <= b.end && norm(x.text) === norm(ins.atWord!))
      : undefined;
    if (w) start = w.startMs / 1000;
    end = start + (ins.dur ?? 0.55);
  }
  if (ins.kind === "chapter" && ins.to === undefined) end = start + 1.1;
  // full-frame media that runs to the end of its beat holds through the pause to the next beat
  const full = ins.kind === "poster" || ins.kind === "video" || (ins.kind === "photo" && ins.layout !== "card");
  if (full && !ins.untilBeat && (ins.to ?? 1) === 1) {
    const next = tl.beats[tl.beats.indexOf(b) + 1];
    if (next) end = Math.max(end, next.start);
  }
  return { start, end };
};

/** Resolve which inserts are on screen at time t. */
export const activeInserts = (inserts: Insert[] | undefined, tl: Timeline, t: number): Active[] => {
  const out: Active[] = [];
  for (const ins of inserts ?? []) {
    const w = insertWindow(ins, tl);
    if (!w) continue;
    const { start, end } = w;
    if (t < start - 0.01 || t > end + OUT) continue;
    out.push({ ins, start, end, local: t - start, u: (t - start) / Math.max(0.01, end - start) });
  }
  return out;
};

/** 0..1 visibility envelope */
const env = (a: Active, t: number) =>
  Math.min(
    // the opening shot must be fully visible on frame 0 (no fade-in from blank paper)
    a.start < 0.3 ? 1 : interpolate(t, [a.start, a.start + IN], [0, 1], clamp),
    interpolate(t, [a.end, a.end + OUT], [1, 0], clamp),
  );

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
export const FullBleed: React.FC<{ actives: Active[]; t: number; ep: string; dark?: boolean }> = ({ actives, t, ep, dark = false }) => {
  const wash = dark ? "#0E0D0C" : C.paper;
  const { fps } = useVideoConfig();
  return (
  <>
    {actives.map((a, i) => {
      if (a.ins.kind === "video") {
        const ins = a.ins;
        const [fx, fy] = ins.focus ?? [0.5, 0.5];
        return (
          <AbsoluteFill key={i} style={{ opacity: env(a, t), overflow: "hidden" }}>
            <Sequence from={Math.round(a.start * fps)} layout="none">
              <Video
                src={staticFile(`${ep}/media/${ins.src}.mp4`)}
                trimBefore={Math.round((ins.trimStart ?? 0) * fps)}
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: `${fx * 100}% ${fy * 100}%`,
                  filter: ins.grade === "mono" ? "grayscale(1) contrast(1.05)" : "sepia(0.18) saturate(0.88) contrast(1.04)",
                }}
              />
            </Sequence>
            {dark ? null : <AbsoluteFill style={{ background: C.paper, opacity: 0.12, mixBlendMode: "multiply" }} />}
          </AbsoluteFill>
        );
      }
      if (a.ins.kind === "photo" && a.ins.layout === "wide") {
        // small archive photo: full-width print over a blurred, darkened copy of itself
        const ins = a.ins;
        const life = interpolate(a.local, [0, a.end - a.start + OUT], [0, 1], clamp);
        const z = ins.move === "out" ? 1.12 - 0.1 * life : 1.02 + 0.1 * life;
        const src = staticFile(`${ep}/media/${ins.src}.jpg`);
        const filter = ins.grade === "mono" ? "grayscale(1) contrast(1.1)" : "sepia(0.12) contrast(1.05)";
        return (
          <AbsoluteFill key={i} style={{ opacity: dark ? 1 : env(a, t), overflow: "hidden", background: wash }}>
            <Img src={src} style={{ position: "absolute", inset: -80, width: "calc(100% + 160px)", height: "calc(100% + 160px)", objectFit: "cover", filter: `${filter} blur(38px) brightness(0.45)` }} />
            <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
              <Img src={src} style={{ width: "100%", scale: String(z), filter, boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }} />
            </AbsoluteFill>
          </AbsoluteFill>
        );
      }
      if (a.ins.kind !== "photo" || a.ins.layout !== "full") return null;
      const ins = a.ins;
      const o = env(a, t);
      const life = interpolate(a.local, [0, a.end - a.start + OUT], [0, 1], clamp);
      const move = ins.move ?? "in";
      const zoom = move === "out" ? 1.2 - 0.12 * life : move === "in" ? 1.06 + 0.14 * life : 1.16;
      const pan = 70; // px of travel for directional moves
      const tx = move === "left" ? pan / 2 - pan * life : move === "right" ? -pan / 2 + pan * life : 0;
      const ty = move === "up" ? pan / 2 - pan * life : move === "down" ? -pan / 2 + pan * life : 0;
      const [fx, fy] = ins.focus ?? [0.5, 0.45];
      return (
        <AbsoluteFill key={i} style={{ opacity: dark ? 1 : o, overflow: "hidden", background: wash }}>
          <Img
            src={staticFile(`${ep}/media/${ins.src}.jpg`)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: `${fx * 100}% ${fy * 100}%`,
              scale: String(zoom),
              translate: `${tx}px ${ty}px`,
              transformOrigin: `${fx * 100}% ${fy * 100}%`,
              filter: ins.grade === "mono" ? "grayscale(1) contrast(1.05) brightness(1.02)" : "sepia(0.18) saturate(0.88) contrast(1.04)",
            }}
          />
          {/* paper wash keeps the palette (paper look only) */}
          {dark ? null : <AbsoluteFill style={{ background: C.paper, opacity: 0.12, mixBlendMode: "multiply" }} />}
          {ins.sweep ? (
            <AbsoluteFill
              style={{
                background: `linear-gradient(115deg, transparent 30%, rgba(255,250,235,0.35) 48%, rgba(255,255,255,0.55) 50%, rgba(255,250,235,0.35) 52%, transparent 70%)`,
                translate: `${interpolate(a.local, [0.3, 2.4], [-120, 120], clamp)}% 0`,
                mixBlendMode: "screen",
              }}
            />
          ) : null}
          {/* reveal wipe (paper look only — the cinematic look hard-cuts) */}
          {dark ? null : <AbsoluteFill
            style={{
              background: C.paper,
              clipPath: `inset(0 0 ${a.start < 0.3 ? 100 : interpolate(a.local, [0, 0.55], [0, 100], { ...clamp, easing: Easing.bezier(0.7, 0, 0.2, 1) })}% 0)`,
            }}
          />}
        </AbsoluteFill>
      );
    })}
  </>
  );
};

/** Veil that dims the world while a card / number is up. */
export const veilAt = (actives: Active[], t: number) =>
  Math.max(0, ...actives.filter((a) => a.ins.kind === "number" || a.ins.kind === "quote" || a.ins.kind === "letters" || (a.ins.kind === "photo" && a.ins.layout === "card")).map((a) => env(a, t) * (a.ins.kind === "photo" ? 0.45 : 0.82)));

const isAI = (c?: Credit) => (c as Credit & { provider?: string })?.provider === "ai";
/** credits.json may set `label` (e.g. "ILLUSTRATION · AI") to override the line */
export const creditLine = (c?: Credit) => ((c as Credit & { label?: string })?.label ? (c as Credit & { label?: string }).label! : creditLineOld(c));
const creditLineOld = (c?: Credit) =>
  !c ? "" : isAI(c) ? "AI VISUALISATION" : `${/\.mp4$/.test((c as Credit & { file?: string }).file ?? "") ? "VIDEO" : "PHOTO"} · ${(c.creator ?? "UNKNOWN").toUpperCase()} · ${c.license.toUpperCase()}`;

const fmtNumber = (v: number, format?: "full" | "plain") => (format === "plain" ? String(Math.round(v)) : Math.round(v).toLocaleString("en-US"));

export const Overlays: React.FC<{ actives: Active[]; t: number; ep: string; credits: Credit[]; dark?: boolean }> = ({ actives, t, ep, credits, dark = false }) => {
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

      if (ins.kind === "photo" || ins.kind === "video") {
        const credit = credits.find((c) => c.name === ins.src);
        return (
          <div key={i} style={{ position: "absolute", right: 70, top: 1395, opacity: dark ? 0.75 : o * 0.9, fontFamily: MONO, fontSize: 16, letterSpacing: 1, color: dark ? "#FFFFFF" : C.ink, textShadow: dark ? "0 1px 4px rgba(0,0,0,0.8)" : "none", textAlign: "right" }}>
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

      if (ins.kind === "letters") {
        const chars = [...ins.text];
        const fall = ins.fallAt ?? 0.35; // fraction of the insert's duration
        const dur = a.end - a.start;
        const kFall = interpolate(a.local, [fall * dur, fall * dur + 0.9], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
        const kSlide = interpolate(a.local, [fall * dur + 0.6, fall * dur + 1.4], [0, 1], { ...clamp, easing: Easing.bezier(0.6, 0, 0.2, 1) });
        const W = 64; // px per letter slot
        // words wrap onto lines like a real sign
        const lines: number[][] = [[]];
        chars.forEach((c, i) => (c === " " ? lines.push([]) : lines[lines.length - 1].push(i)));
        const keptOrder = ins.keep;
        return (
          <AbsoluteFill key={i} style={{ opacity: o }}>
            {lines.map((ln, li) =>
              ln.map((ci, pos) => {
                const kept = keptOrder.indexOf(ci);
                const x0 = (pos - (ln.length - 1) / 2) * W;
                const y0 = (li - (lines.length - 1) / 2) * 96;
                const x1 = (kept - (keptOrder.length - 1) / 2) * 130;
                const seed = Math.sin(ci * 12.9898) * 43758.5453;
                const rnd = seed - Math.floor(seed);
                const x = kept >= 0 ? x0 + (x1 - x0) * kSlide : x0 + (rnd - 0.5) * 120 * kFall;
                const y = kept >= 0 ? y0 * (1 - kSlide) : y0 + kFall * kFall * 1400;
                const size = kept >= 0 ? 84 + 66 * kSlide : 84;
                return (
                  <div
                    key={ci}
                    style={{
                      position: "absolute",
                      left: 540 + x - size * 0.36,
                      top: 820 + y - size * 0.6,
                      width: size * 0.72,
                      height: size * 1.1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: kept >= 0 && kSlide > 0.5 ? C.ink : C.massTop,
                      color: kept >= 0 && kSlide > 0.5 ? C.paper : C.ink,
                      border: `3px solid ${C.ink}`,
                      fontFamily: SANS,
                      fontWeight: 700,
                      fontSize: size * 0.72,
                      rotate: `${kept >= 0 ? 0 : (rnd - 0.5) * 140 * kFall}deg`,
                      boxShadow: "0 8px 18px rgba(0,0,0,0.18)",
                      opacity: kept >= 0 ? 1 : 1 - kFall * 0.4,
                    }}
                  >
                    {chars[ci]}
                  </div>
                );
              }),
            )}
            {ins.sub ? (
              <div style={{ position: "absolute", top: 1010, width: "100%", textAlign: "center", fontFamily: MONO, fontSize: 28, letterSpacing: 6, color: C.ink, opacity: kSlide }}>{ins.sub}</div>
            ) : null}
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
      {Array.from({ length: b - a + 1 }, (_, i) => i)
        .filter((i) => b - a <= 30 || (a + i) % 10 === 0)
        .map((i) => (
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
      <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 6, color: C.accent, marginBottom: 26 }}>MEDIA CREDITS</div>
      {credits.some(isAI) ? (
        <div style={{ fontFamily: MONO, fontSize: 24, lineHeight: 1.4, color: C.ink, marginBottom: 8 }}>
          AI visualisations — generated images/clips, illustrative only
        </div>
      ) : null}
      {credits.filter((c) => !isAI(c)).map((c) => (
        <div key={c.name} style={{ fontFamily: MONO, fontSize: 24, lineHeight: 1.4, color: C.ink, marginBottom: 8 }}>
          {c.title.slice(0, 44)} — {c.creator ?? "unknown"} · {c.license}
        </div>
      ))}
      <div style={{ fontFamily: MONO, fontSize: 22, color: C.inkSoft, marginTop: 24 }}>Full links in the description. 3D models: original reconstructions.</div>
    </AbsoluteFill>
  );
};
