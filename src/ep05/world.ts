// Storyboard for episode 5 — Gando: the village, the cramped classroom, the concrete box the
// village wanted, and Kéré's clay school with its floating double roof (heat out, breeze through).
import { box, ease, ellipse, Item, lerp, mix, rng, V3 } from "../iso/engine";
import { people } from "../iso/models";
import { beatClock, makeCamAt, Shot } from "../shared/camera";
import { Timeline } from "../shared/timeline";
import { Tag, World } from "../shared/types";
import { C } from "../theme";

const SAND = "#E9D7B5";
const CLAY = "#C97B4A";
const CLAY_TOP = "#DB9468";
const METAL = "#A7AEB2";
const CEMENT = "#9C9A94";
const GLASS = "#9FC3D6";
const HUT = "#C99A6B";
const THATCH = "#B89255";

const SHOTS: Record<string, Shot> = {
  hook: { yaw: 0.5, scale: 20, target: [0, 0, 4], drift: 0.02 },
  stakes: { yaw: 0.3, scale: 22, target: [0, 0, 4], drift: 0.03 },
  gando: { yaw: 0.2, scale: 13, target: [0, 20, 2], drift: 0.04 },
  classroom: { yaw: 0.6, scale: 38, target: [0, 0, 2], drift: 0.03 },
  germany: { yaw: 0.6, scale: 30, target: [0, 0, 2], drift: 0.03 },
  money: { yaw: 0.4, scale: 18, target: [0, 0, 2], drift: 0.03 },
  pushback: { yaw: 0.35, scale: 21, target: [0, 0, 4], drift: 0.03 },
  heat: { yaw: 0.2, scale: 18, target: [0, 0, 8], drift: 0.02 },
  guess: { yaw: 0.0, scale: 20, target: [0, 0, 6], drift: 0.04 },
  walls: { yaw: 0.45, scale: 21, target: [0, 0, 3], drift: 0.03 },
  roof: { yaw: 0.3, scale: 19, target: [0, 0, 6], drift: 0.03 },
  air: { yaw: 1.2, scale: 28, target: [0, 0, 4.5], drift: 0.02 },
  cooler: { yaw: 1.1, scale: 26, target: [0, 0, 4.5], drift: 0.02 },
  opened: { yaw: 0.4, scale: 18, target: [0, 0, 3], drift: 0.04 },
  growth: { yaw: 0.5, scale: 12, target: [8, 8, 3], drift: 0.04 },
  prize: { yaw: 0.6, scale: 19, target: [0, 0, 4], drift: 0.03 },
  mud: { yaw: 0.5, scale: 21, target: [0, 0, 4], drift: 0.04 },
  question: { yaw: 0.5, scale: 20, target: [0, 0, 4], drift: 0.02 },
};

export const camAt = makeCamAt(SHOTS);

// ---------------- models

/** Round mud hut with a cone roof. */
const hut = (x: number, y: number, r: number, h: number, o = 1): Item[] => {
  if (o <= 0) return [];
  const n = 14;
  const lo = ellipse(r, r, 0, n, x, y);
  const hi = ellipse(r, r, h, n, x, y);
  const items: Item[] = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    items.push({ kind: "poly", pts: [lo[i], lo[j], hi[j], hi[i]], fill: HUT, opacity: o });
  }
  const eave = ellipse(r * 1.25, r * 1.25, h - 0.2, n, x, y);
  const apex: V3 = [x, y, h + r * 1.1];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    items.push({ kind: "poly", pts: [eave[i], eave[j], apex], fill: THATCH, stroke: C.ink, sw: 0.4, opacity: o });
  }
  return items;
};

const ROOMS: [number, number][] = [
  [-18, -8],
  [-5, 5],
  [8, 18],
];
const W2 = 4.5; // half depth of the classrooms
const WALL_H = 3.4;

type SchoolOpts = { walls: number; ceiling: number; roof: number; roofLift: number; opacity?: number; roofSee?: number; dx?: number; dy?: number; scale?: number };

/** Gando Primary School: three clay classrooms, a perforated clay ceiling, a floating metal roof. */
const school = ({ walls, ceiling, roof, roofLift, roofSee = 0, opacity = 1, dx = 0, dy = 0, scale = 1 }: SchoolOpts): Item[] => {
  if (opacity <= 0) return [];
  const items: Item[] = [];
  const P = (x: number, y: number, z: number): V3 => [dx + x * scale, dy + y * scale, z * scale];
  const S = (v: number) => v * scale;
  // stone plinth
  items.push(...box(dx + S(-19.5), dy + S(-6.5), 0, S(39), S(13), S(0.6), { fill: C.stone, stroke: C.ink, sw: 0.6, opacity }));
  // classrooms: walls rise course by course
  const h = WALL_H * walls;
  if (h > 0.05)
    for (const [x0, x1] of ROOMS) {
      items.push(...box(dx + S(x0), dy + S(-W2), S(0.6), S(x1 - x0), S(2 * W2), S(h), { fill: CLAY, stroke: C.ink, sw: 0.8, opacity }));
      // brick courses on the front face
      for (let z = 0.5; z < h; z += 0.5)
        items.push({ kind: "line", pts: [P(x0, -W2 - 0.01, 0.6 + z), P(x1, -W2 - 0.01, 0.6 + z)], stroke: CLAY_TOP, sw: 0.7, opacity: opacity * 0.9, bias: 1 });
      // doors
      if (walls > 0.7)
        items.push({ kind: "poly", flat: true, pts: [P(x0 + 1.2, -W2 - 0.02, 0.6), P(x0 + 2.6, -W2 - 0.02, 0.6), P(x0 + 2.6, -W2 - 0.02, 2.8), P(x0 + 1.2, -W2 - 0.02, 2.8)], fill: C.ginkgo, stroke: C.ink, sw: 0.5, opacity, bias: 2 });
    }
  // perforated clay ceiling slab across the whole bar
  if (ceiling > 0) {
    const zc = 0.6 + WALL_H;
    items.push(...box(dx + S(-18), dy + S(-W2), S(zc), S(36), S(2 * W2), S(0.35 * ceiling), { fill: CLAY_TOP, stroke: C.ink, sw: 0.6, opacity: opacity * ceiling }));
    for (let x = -16; x <= 16; x += 2)
      for (let y = -3; y <= 3; y += 2)
        items.push({ kind: "dot", p: P(x, y, zc + 0.37), r: S(0.28), fill: "#7A4A2C", opacity: opacity * ceiling, bias: 2 });
  }
  // floating metal roof on light steel trusses
  if (roof > 0) {
    const zr = 0.6 + WALL_H + 2.3 + roofLift;
    const zc = 0.6 + WALL_H + 0.35;
    for (const y of [-W2 + 0.4, 0, W2 - 0.4])
      for (let x = -18; x < 18; x += 2)
        items.push({ kind: "line", pts: [P(x, y, zc), P(x + 1, y, zr - 0.05), P(x + 2, y, zc)], stroke: C.accent, sw: 0.8, opacity: opacity * roof * (roofLift > 0.5 ? 0.3 : 1) });
    const sag = (x: number) => -0.5 * (1 - (x / 21) ** 2);
    const xs = [-21, -14, -7, 0, 7, 14, 21];
    for (let i = 0; i < xs.length - 1; i++) {
      const a = xs[i];
      const b = xs[i + 1];
      items.push({ kind: "poly", pts: [P(a, -7.5, zr + sag(a)), P(b, -7.5, zr + sag(b)), P(b, 7.5, zr + sag(b)), P(a, 7.5, zr + sag(a))], fill: METAL, stroke: C.ink, sw: 0.7, opacity: opacity * roof * (1 - 0.6 * roofSee) });
    }
    for (let y = -7; y <= 7; y += 1.4)
      items.push({ kind: "line", pts: xs.map((x) => P(x, y, zr + sag(x) + 0.03)), stroke: "#8A9296", sw: 0.5, opacity: opacity * roof * (1 - 0.6 * roofSee), bias: 1 });
  }
  return items;
};

/** The building the village asked for: a concrete-and-glass box. */
const concreteBox = (rise: number, heat: number, o: number): Item[] => {
  if (o <= 0 || rise <= 0) return [];
  const h = 7 * rise;
  const fill = mix(CEMENT, C.accent, heat * 0.75);
  const items: Item[] = [...box(-14, -6, 0, 28, 12, h, { fill, stroke: C.ink, sw: 1, opacity: o })];
  // glass bands
  for (const z of [1.2, 4.2])
    if (h > z + 2)
      items.push({ kind: "poly", flat: true, pts: [[-13, -6.02, z], [13, -6.02, z], [13, -6.02, z + 2], [-13, -6.02, z + 2]], fill: mix(GLASS, "#F3B28E", heat), stroke: C.ink, sw: 0.6, opacity: o, bias: 2 });
  return items;
};

/** A small dark classroom packed with children (top-down dots inside low walls). */
const crowdedRoom = (o: number, fill: number): Item[] => {
  if (o <= 0) return [];
  const items: Item[] = [];
  const style = { fill: "#77746E", stroke: C.ink, sw: 0.8, opacity: o };
  items.push({ kind: "poly", ground: true, flat: true, pts: [[-5, -4, 0.01], [5, -4, 0.01], [5, 4, 0.01], [-5, 4, 0.01]], fill: "#5E5B56", opacity: o });
  items.push(...box(-5, 3.7, 0, 10, 0.3, 3, style)); // back wall
  items.push(...box(-5.3, -4, 0, 0.3, 8, 3, style)); // side wall
  items.push(...box(5, -4, 0, 0.3, 8, 3, style));
  items.push(...box(-5, -4, 0, 10, 0.3, 1.0, style)); // low front (cut-away)
  const r = rng(5);
  const n = Math.round(104 * fill);
  for (let i = 0; i < n; i++) {
    const x = lerp(-4.6, 4.6, (i % 13) / 12) + (r() - 0.5) * 0.3;
    const y = lerp(-3.4, 3.3, Math.floor(i / 13) / 7) + (r() - 0.5) * 0.3;
    items.push({ kind: "dot", p: [x, y, 1.1], r: 0.22, fill: C.ink, opacity: o, bias: 3 });
  }
  return items;
};

/** Animated flow arrows: dots moving along a path. */
const flow = (path: V3[], t: number, n: number, o: number, color: string, speed = 0.5): Item[] => {
  if (o <= 0) return [];
  const items: Item[] = [{ kind: "line", pts: path, stroke: color, sw: 1, dash: "3 4", opacity: o * 0.6, bias: 4 }];
  const seg = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1], p[2] - path[i][2]));
  const L = seg.reduce((a, b) => a + b, 0);
  for (let k = 0; k < n; k++) {
    let d = (((t * speed) / L + k / n) % 1) * L;
    let i = 0;
    while (i < seg.length - 1 && d > seg[i]) d -= seg[i++];
    const u = Math.min(1, d / seg[i]);
    const a = path[i];
    const b = path[i + 1];
    items.push({ kind: "dot", p: [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)], r: 0.35, fill: color, opacity: o, bias: 5 });
  }
  return items;
};

// ---------------- storyboard

export const worldAt = (tl: Timeline, t: number): World => {
  const { fr, since } = beatClock(tl, t);
  const items: Item[] = [];
  const tags: Tag[] = [];

  // savanna ground
  items.push({ kind: "poly", ground: true, flat: true, pts: ellipse(46, 34, 0, 56), fill: SAND, opacity: 1 });

  const between = (a: string, b: string) => since(a) && !since(b);

  // ---- stakes: concrete vs clay, side by side
  if (between("stakes", "gando")) {
    const k = ease(fr("stakes", 0.0, 0.3));
    const sink = ease(fr("stakes", 0.7, 0.95));
    items.push(...box(-16, -4, 0, 10, 8, 7 * k * (1 - sink * 0.85), { fill: CEMENT, stroke: C.ink, sw: 1 }));
    items.push(...box(6, -4, 0, 10, 8, 4 * ease(fr("stakes", 0.3, 0.55)), { fill: CLAY, stroke: C.ink, sw: 1 }));
    tags.push({ key: "con", text: "CONCRETE", at: [-11, 0, 9], opacity: fr("stakes", 0.1, 0.25), tone: "ink" });
    tags.push({ key: "cla", text: "CLAY", at: [11, 0, 6.5], opacity: fr("stakes", 0.35, 0.5), tone: "accent" });
  }

  // ---- the village
  const village = since("gando") && !since("classroom") ? ease(fr("gando", 0, 0.3)) : 0;
  if (village > 0) {
    const r = rng(11);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + r() * 0.3;
      const d = 14 + r() * 18;
      items.push(...hut(Math.cos(a) * d, Math.sin(a) * d * 0.8 + 16, 2 + r() * 1.2, 2.4, village));
    }
    items.push(...people(18, village, 5, [-25, 25, 6, 40]));
    // the empty plot: no school
    items.push({ kind: "line", ground: true, pts: [[-6, 10, 0.02], [6, 10, 0.02], [6, 22, 0.02], [-6, 22, 0.02], [-6, 10, 0.02]], stroke: C.accent, sw: 1.4, dash: "6 5", opacity: village * fr("gando", 0.25, 0.4) });
    tags.push({ key: "ns", text: "NO SCHOOL", at: [0, 16, 2], opacity: fr("gando", 0.25, 0.4), tone: "accent" });
  }

  // ---- Tenkodogo: the cramped classroom
  if (between("classroom", "money")) {
    const o = since("germany") ? 1 - ease(fr("germany", 0, 0.3)) : 1;
    items.push(...crowdedRoom(o, ease(fr("classroom", 0.05, 0.6))));
    tags.push({ key: "cb", text: "CEMENT BLOCKS · NO AIR", at: [0, 4, 4.5], opacity: o * fr("classroom", 0.15, 0.3), tone: "ink" });
  }

  // ---- the plot, then the concrete box the village wanted
  if (between("money", "walls")) {
    items.push({ kind: "line", ground: true, pts: [[-20, -7, 0.02], [20, -7, 0.02], [20, 7, 0.02], [-20, 7, 0.02], [-20, -7, 0.02]], stroke: C.accent, sw: 1.4, dash: "6 5", opacity: fr("money", 0.1, 0.3) });
    const rise = ease(fr("pushback", 0.2, 0.7));
    const heat = since("heat") ? ease(fr("heat", 0.0, 0.5)) : 0;
    const ghost = since("guess") ? 1 - 0.75 * ease(fr("guess", 0, 0.3)) : 1;
    items.push(...concreteBox(rise, heat, ghost));
    if (since("pushback") && !since("guess")) tags.push({ key: "cg", text: "CONCRETE + GLASS", at: [0, 0, 9], opacity: fr("pushback", 0.5, 0.65), tone: "ink" });
    if (since("heat") && !since("guess")) {
      tags.push({ key: "hot", text: "TRAPS HEAT", at: [-8, -6, 7], opacity: fr("heat", 0.15, 0.3), tone: "accent", align: "right" });
      tags.push({ key: "ac", text: "A/C ✕ NO ELECTRICITY", at: [10, -6, 3], opacity: fr("heat", 0.6, 0.75), tone: "ink", align: "left" });
    }
    if (since("guess")) tags.push({ key: "q", text: "?", at: [0, 0, 10], opacity: fr("guess", 0.1, 0.25), tone: "accent" });
  }

  // ---- the sun (heat beats and the reveal)
  const sunOn = between("heat", "guess") || between("air", "opened");
  if (sunOn) {
    const o = since("air") ? fr("air", 0, 0.2) : fr("heat", 0, 0.2);
    const sun: V3 = [-18, -22, 26];
    items.push({ kind: "dot", p: sun, r: 2.4, fill: C.ginkgo, stroke: C.ink, sw: 0.8, opacity: o, bias: 6 });
    const targets: V3[] = since("air") ? [[-12, -4, 7], [0, -4, 7], [12, -4, 7]] : [[-10, -6, 6], [0, -6, 5], [10, -6, 4]];
    for (const p of targets) items.push({ kind: "line", pts: [sun, p], stroke: C.ginkgo, sw: 1.4, dash: "4 5", opacity: o * 0.9, bias: 5 });
    if (since("air")) tags.push({ key: "sh", text: "THE ROOF TAKES THE SUN", at: [-12, -8, 9], opacity: fr("air", 0.7, 0.82) * (1 - fr("air", 0.97, 1)), tone: "ink", align: "right" });
  }

  // ---- the clay school, built step by step
  if (since("walls")) {
    const walls = ease(fr("walls", 0.05, 0.8));
    const ceiling = since("roof") ? ease(fr("roof", 0.0, 0.3)) : 0;
    const roof = since("roof") ? ease(fr("roof", 0.25, 0.4)) : 0;
    const roofLift = since("roof") ? 8 * (1 - ease(fr("roof", 0.3, 0.85))) : 8;
    const roofSee = between("air", "opened") ? ease(fr("air", 0, 0.15)) * (since("cooler") ? 1 - ease(fr("cooler", 0.6, 1)) : 1) : 0;
    items.push(...school({ walls, ceiling, roof, roofLift, roofSee }));
    if (between("walls", "roof")) tags.push({ key: "br", text: "HAND-PRESSED CLAY BRICKS", at: [0, -5, 5.5], opacity: fr("walls", 0.3, 0.45), tone: "accent" });
    if (between("roof", "air")) {
      tags.push({ key: "rf", text: "ROOF 2 · METAL, FLOATING", at: [0, 0, 8.6 + roofLift], opacity: fr("roof", 0.4, 0.55), tone: "ink" });
      tags.push({ key: "cl", text: "ROOF 1 · CLAY CEILING", at: [18, -4.5, 4.3], opacity: fr("roof", 0.7, 0.85), tone: "accent", align: "left" });
    }
    // hot air up through the ceiling, breeze across under the roof
    if (between("air", "opened")) {
      const o1 = ease(fr("air", 0.05, 0.2));
      const o2 = ease(fr("air", 0.35, 0.5));
      for (const x of [-13, 0, 13]) items.push(...flow([[x, 0, 1.5], [x, 0, 5.2], [x, 3, 5.6], [x, 9, 5.6]], t, 4, o1, C.accent, 1.2));
      for (const x of [-16, -6, 6, 16]) items.push(...flow([[x, -11, 5.4], [x, 11, 5.4]], t, 5, o2, "#3A6FD8", 2.4));
      tags.push({ key: "ha", text: "HOT AIR OUT", at: [0, 8, 6.4], opacity: fr("air", 0.15, 0.28), tone: "accent", align: "left" });
      tags.push({ key: "bz", text: "BREEZE", at: [-16, -11, 5.4], opacity: fr("air", 0.4, 0.52), tone: "ink", align: "right" });
    }
    // life around the school
    if (since("opened")) items.push(...people(22, ease(fr("opened", 0, 0.3)), 8, [-24, 24, -14, -9]));
    // what came next: extension and a secondary school nearby
    if (since("growth") && !since("prize")) {
      const g = ease(fr("growth", 0.0, 0.4));
      items.push(...school({ walls: g, ceiling: g, roof: g, roofLift: 0, dx: 6, dy: 24, scale: 0.7 }));
      items.push(...box(-30, 14, 0, 10, 8, 3.6 * ease(fr("growth", 0.15, 0.5)), { fill: CLAY, stroke: C.ink, sw: 0.8 }));
      tags.push({ key: "lib", text: "LIBRARY", at: [-25, 18, 6], opacity: fr("growth", 0.25, 0.4), tone: "ink" });
      tags.push({ key: "sec", text: "SECONDARY SCHOOL", at: [6, 24, 8], opacity: fr("growth", 0.35, 0.5), tone: "ink" });
    }
  }

  return { items, tags };
};
