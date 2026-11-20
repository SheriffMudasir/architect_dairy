// The whole episode is one persistent world. Everything is a pure function
// of time t (seconds) and the beat timeline, so it re-times itself to the voice.
import { Cam, clamp01, ease, easeOut, Item, lerp, V3 } from "../iso/engine";
import { bar, bowl, city, entries, kuma, park, people, seatPoints, sitePlate, zaha } from "../iso/models";
import { C } from "../theme";
import { Timeline } from "./timeline";

export type Tag = { key: string; text: string; at: V3; opacity: number; tone?: "ink" | "accent" | "paper"; dy?: number };

type Shot = { yaw: number; scale: number; target: V3; drift?: number; zoom?: number };

const SHOTS: Record<string, Shot> = {
  hook: { yaw: 0.05, scale: 1.24, target: [20, -20, 20], drift: -0.012, zoom: 0.012 },
  competition: { yaw: 0, scale: 2.06, target: [-10, -10, 0], drift: 0.01 },
  design: { yaw: -0.35, scale: 2.06, target: [0, 0, 30], drift: 0.05 },
  site: { yaw: 0.15, scale: 1.09, target: [110, -110, 10], drift: -0.012 },
  cost: { yaw: 0.1, scale: 1.47, target: [60, 20, 50], drift: 0.012 },
  blame: { yaw: 0.45, scale: 1.83, target: [0, 0, 45], drift: 0.02 },
  scrapped: { yaw: 0.25, scale: 1.71, target: [0, 0, 25], drift: -0.015 },
  withdraw: { yaw: 0.0, scale: 1.47, target: [0, 0, 20], drift: -0.02 },
  kuma: { yaw: -0.2, scale: 2.01, target: [0, 0, 15], drift: 0.04, zoom: 0.01 },
  familiar: { yaw: 0.35, scale: 2.06, target: [0, 0, 10], drift: 0.02 },
  death: { yaw: 0.2, scale: 1.71, target: [0, 0, 35], drift: 0.035 },
  rugby: { yaw: 0.1, scale: 1.24, target: [60, 60, 10], drift: -0.015 },
  empty: { yaw: -0.1, scale: 2.42, target: [0, 0, 15], drift: 0.02 },
  outro: { yaw: 0.2, scale: 1.47, target: [0, 0, 70], drift: 0.03, zoom: -0.008 },
};

const shotAt = (id: string, u: number, sx: number, sy: number): Cam => {
  const s = SHOTS[id];
  return {
    yaw: s.yaw + (s.drift ?? 0) * u,
    scale: s.scale * (1 + (s.zoom ?? 0) * u),
    target: s.target,
    sx,
    sy,
  };
};

const blendCam = (a: Cam, b: Cam, k: number): Cam => ({
  yaw: lerp(a.yaw, b.yaw, k),
  scale: Math.exp(lerp(Math.log(a.scale), Math.log(b.scale), k)),
  target: [lerp(a.target[0], b.target[0], k), lerp(a.target[1], b.target[1], k), lerp(a.target[2], b.target[2], k)],
  sx: a.sx,
  sy: a.sy,
});

export const camAt = (tl: Timeline, t: number, sx: number, sy: number): Cam => {
  const bs = tl.beats;
  let i = 0;
  for (let k = 0; k < bs.length; k++) if (t >= bs[k].start - 0.35) i = k;
  const b = bs[i];
  const u = t - b.start;
  const cur = shotAt(b.id, Math.max(u, 0), sx, sy);
  if (i === 0) return cur;
  const p = bs[i - 1];
  const prev = shotAt(p.id, p.end - p.start + 0.8, sx, sy);
  return blendCam(prev, cur, ease((u + 0.35) / 1.5));
};

export const worldAt = (tl: Timeline, t: number) => {
  const T: Record<string, { s: number; e: number; d: number }> = {};
  for (const b of tl.beats) T[b.id] = { s: b.start, e: b.end, d: b.end - b.start };
  /** 0..1 progress between (beat start + a) and (beat start + b) seconds. */
  const at = (id: string, a: number, b: number) => clamp01((t - (T[id].s + a)) / (b - a));
  /** progress as fraction of the beat's duration */
  const fr = (id: string, a: number, b: number) => at(id, a * T[id].d, b * T[id].d);
  const since = (id: string) => t >= T[id].s - 0.2;

  const items: Item[] = [];
  const tags: Tag[] = [];

  // ---------------- context
  const deathDim = since("death") && !since("rugby") ? 1 - 0.85 * ease(at("death", 0, 1.2)) : since("rugby") ? 0.15 + 0.85 * ease(at("rugby", 0, 1.2)) : 1;
  items.push(...city(0.95 * deathDim));
  items.push(...park(deathDim, since("site") ? 0.5 + 0.5 * easeOut(at("site", 0, 1.5)) : 0.5));
  items.push(...sitePlate(deathDim, easeOut(at("hook", 0, 1.6))));

  // ---------------- Zaha's stadium
  const inComp = since("competition") && !since("design");
  if (inComp) {
    items.push(...entries(easeOut(fr("competition", 0, 0.55)), 27, ease(fr("competition", 0.62, 0.95))));
    tags.push({ key: "46", text: "46 ENTRIES", at: [-150, -150, 6], opacity: fr("competition", 0.15, 0.3) - fr("competition", 0.6, 0.7) });
    tags.push({ key: "ando", text: "JURY CHAIR · TADAO ANDO", at: [-10, 70, 14], opacity: fr("competition", 0.6, 0.75), tone: "accent" });
  }

  let zRise = 0;
  let zGhost = 0;
  let zShell = 1;
  let zArches = 0;
  let zOpacity = 1;
  let zLift = 0;
  let zHi = 0;
  if (!since("competition")) {
    // hook: rises fast, then turns to a ghost on "never built"
    zRise = easeOut(at("hook", 0.4, 2.2));
    zArches = easeOut(at("hook", 1.2, 3.2));
    zGhost = ease(fr("hook", 0.72, 0.9));
  } else if (since("design")) {
    zRise = since("site") ? 1 : easeOut(fr("design", 0, 0.45));
    zArches = since("site") ? 1 : ease(fr("design", 0.15, 0.7));
    zHi = since("blame") && !since("scrapped") ? ease(at("blame", 0, 0.8)) * (1 - fr("blame", 0.55, 0.75)) : 0;
    if (since("scrapped")) {
      zGhost = ease(at("scrapped", 0.6, 2.2));
      zArches = 1;
    }
    if (since("kuma")) zOpacity = 1 - 0.85 * ease(at("kuma", 0, 1.5));
    if (since("familiar")) zOpacity = 0.15;
    if (since("death")) zOpacity = lerp(0.15, 1, ease(at("death", 0, 1.2)));
    if (since("rugby")) zOpacity = lerp(1, 0, ease(at("rugby", 0, 1)));
    if (since("outro")) {
      zOpacity = ease(at("outro", 0.2, 1.4));
      zLift = 95 * ease(at("outro", 0.2, 2.2));
    }
    if (since("kuma")) zGhost = 1;
  } else {
    zRise = 0;
  }
  if (zRise > 0.001 && zOpacity > 0.01) {
    items.push(...zaha({ rise: Math.max(zRise, 0.02), ghost: zGhost, shell: zShell, arches: zArches, opacity: zOpacity, lift: zLift, highlightArches: zHi }));
  }

  if (!since("competition")) {
    tags.push({ key: "nns", text: "NEW NATIONAL STADIUM · ZHA", at: [0, 0, 92], opacity: fr("hook", 0.25, 0.4), tone: "paper" });
  }
  if (since("design") && !since("site")) {
    tags.push({ key: "arch", text: "KEEL ARCHES", at: [-120, -40, 70], opacity: fr("design", 0.3, 0.45), tone: "accent" });
    tags.push({ key: "seats", text: "80,000 SEATS", at: [80, 60, 50], opacity: fr("design", 0.6, 0.75) });
  }
  if (since("site") && !since("cost")) {
    tags.push({ key: "gaien", text: "MEIJI JINGU GAIEN", at: [260, -260, 20], opacity: fr("site", 0.08, 0.2) });
    tags.push({ key: "big", text: "“FAR TOO BIG” — MAKI · ITO", at: [0, 0, 100], opacity: fr("site", 0.35, 0.5), tone: "accent" });
    tags.push({ key: "petition", text: "PETITION · ~15,000 SIGNATURES", at: [40, 150, 10], opacity: fr("site", 0.5, 0.62) });
  }
  // ---------------- people for scale
  items.push(...people(40, (since("design") && !since("death")) || since("rugby") ? 1 : 0.6 * deathDim));

  // ---------------- cost
  if (since("cost") && !since("scrapped")) {
    const k1 = easeOut(fr("cost", 0.15, 0.4));
    const k2 = easeOut(fr("cost", 0.5, 0.75));
    const fade = 1 - at("blame", 0.6 * T.blame.d, 0.6 * T.blame.d + 0.8);
    const s = 0.55; // metres per billion yen
    items.push(...bar(150, 125, 163 * s * k1, C.inkSoft, fade));
    items.push(...bar(232, 125, lerp(163, 252, k2) * s * Math.min(1, k1 * 3), C.accent, fade));
    tags.push({ key: "y14", text: `2014 · ¥${Math.round(163 * k1)}BN`, at: [163, 138, 163 * s * k1 + 8], opacity: k1 > 0.02 ? fade : 0 });
    tags.push({
      key: "y15",
      text: `2015 · ¥${Math.round(lerp(163, 252, k2))}BN`,
      at: [245, 138, lerp(163, 252, k2) * s + 8],
      opacity: k2 > 0.02 ? fade : 0,
      tone: "accent",
    });
    tags.push({ key: "usd", text: "≈ US$2 BILLION", at: [245, 138, 252 * s * k2 + 34], opacity: fr("cost", 0.85, 0.95) * fade });
  }
  if (since("blame") && !since("scrapped")) {
    tags.push({ key: "b1", text: "OFFICIALS: “THE ARCHES”", at: [-60, -40, 88], opacity: fr("blame", 0.05, 0.15) - fr("blame", 0.9, 1), tone: "accent" });
    tags.push({ key: "b2", text: "ZHA: TOKYO BUILD COSTS +25%", at: [150, 150, 40], opacity: fr("blame", 0.5, 0.62) - fr("blame", 0.95, 1) });
  }
  if (since("scrapped") && !since("kuma")) {
    tags.push({ key: "abe", text: "PM SHINZO ABE · PLAN SCRAPPED", at: [0, 0, 105], opacity: at("scrapped", 0.8, 1.2), tone: "accent" });
  }
  if (since("withdraw") && !since("kuma")) {
    tags.push({ key: "nikken", text: "ZHA + NIKKEN SEKKEI", at: [-100, 80, 40], opacity: fr("withdraw", 0.05, 0.2) });
    tags.push({ key: "contractor", text: "CONTRACTOR: NONE", at: [100, -60, 60], opacity: fr("withdraw", 0.5, 0.65), tone: "accent" });
  }

  // ---------------- Kuma
  if (since("kuma")) {
    let kOp = 1;
    if (since("familiar") && !since("death")) kOp = 1 - 0.7 * ease(at("familiar", 0, 0.8));
    if (since("death") && !since("rugby")) kOp = 0.3 - 0.1 * ease(at("death", 0, 1));
    if (since("rugby")) kOp = lerp(0.2, 1, ease(at("rugby", 0, 1)));
    const tiers = since("familiar") ? 3 : 3 * easeOut(fr("kuma", 0.05, 0.55));
    items.push(...kuma({ tiers: Math.max(0.01, tiers), opacity: kOp, trees: since("familiar") ? 1 : easeOut(fr("kuma", 0.5, 0.75)) }));
    if (!since("familiar")) {
      tags.push({ key: "kk", text: "KENGO KUMA · TIMBER EAVES", at: [0, 0, 62], opacity: fr("kuma", 0.2, 0.32), tone: "paper" });
      tags.push({ key: "47", text: "WOOD FROM 47 PREFECTURES", at: [140, 60, 30], opacity: fr("kuma", 0.65, 0.78), tone: "accent" });
    }
  }
  if (since("familiar") && !since("death")) {
    const drop = ease(fr("familiar", 0.1, 0.65));
    items.push(...bowl({ ghost: 1, opacity: 1, rise: 1 }).map((it) => liftItem(it, lerp(70, 0.6, drop))));
    tags.push({ key: "bowl", text: "ZHA SEATING BOWL", at: [0, -80, lerp(70, 0, drop) + 40], opacity: fr("familiar", 0.1, 0.25), tone: "accent" });
  }
  if (since("death") && !since("rugby")) {
    tags.push({ key: "zh", text: "ZAHA HADID · 1950 – 2016", at: [0, 0, 100], opacity: at("death", 0.8, 1.6), tone: "paper" });
  }
  if (since("rugby") && !since("empty")) {
    const k = ease(fr("rugby", 0.15, 0.6));
    const arc: V3[] = Array.from({ length: 30 }, (_, i) => {
      const u = i / 29;
      return [lerp(60, 520, u), lerp(60, 380, u), 90 * Math.sin(Math.PI * u)];
    });
    items.push({ kind: "line", pts: arc, stroke: C.accent, sw: 2, dash: "6 6", progress: k, bias: 400 });
    tags.push({ key: "done", text: "COMPLETED · 30 NOV 2019", at: [0, 0, 60], opacity: fr("rugby", 0.05, 0.2) });
    tags.push({ key: "yoko", text: "RWC FINAL → YOKOHAMA", at: [380, 290, 70], opacity: fr("rugby", 0.5, 0.65), tone: "accent" });
  }
  if (since("empty") && !since("outro")) {
    const fill = easeOut(fr("empty", 0.0, 0.3));
    const leave = ease(fr("empty", 0.55, 0.85));
    const pts = seatPoints(900);
    pts.forEach((p, i) => {
      const show = i / pts.length < fill && i / pts.length >= leave;
      if (show) items.push({ kind: "dot", p, r: 0.9, fill: C.crowd, opacity: 0.9, bias: -200 });
    });
    tags.push({ key: "olympics", text: "TOKYO 2020 · HELD IN 2021", at: [0, -90, 55], opacity: fr("empty", 0.05, 0.2) });
    tags.push({ key: "zero", text: "SPECTATORS: 0", at: [0, 90, 45], opacity: fr("empty", 0.75, 0.88), tone: "accent" });
  }
  if (since("outro")) {
    tags.push({ key: "unbuilt", text: "ZAHA HADID · 2012 · UNBUILT", at: [0, 0, 95 + 95], opacity: at("outro", 1.6, 2.4), tone: "accent" });
    tags.push({ key: "built", text: "KENGO KUMA · 2019 · BUILT", at: [0, 120, 30], opacity: at("outro", 2.4, 3.2), tone: "paper" });
  }

  return { items, tags };
};

const liftItem = (it: Item, dz: number): Item => {
  if (it.kind === "dot") return { ...it, p: [it.p[0], it.p[1], it.p[2] + dz], bias: (it.bias ?? 0) + 500 };
  return { ...it, pts: it.pts.map((p) => [p[0], p[1], p[2] + dz] as V3), bias: (it.bias ?? 0) + 500 };
};
