// Low-poly architectural models built from engine primitives.
import { band, box, close, ellipse, Item, Line, lerp, mix, Poly, rng, V3 } from "./engine";
import { C } from "../theme";

const N = 44;

// Shared seating bowl (used by both designs — that's part of the story).
const BOWL_RINGS: [number, number, number][] = [
  [62, 40, 1.5],
  [80, 56, 11],
  [94, 68, 20],
  [106, 79, 29],
];

export type BowlOpts = { rise?: number; opacity?: number; ghost?: number; color?: string };

export const bowl = ({ rise = 1, opacity = 1, ghost = 0, color = C.bowl }: BowlOpts = {}): Item[] => {
  const items: Item[] = [];
  const rings = BOWL_RINGS.map(([rx, ry, z]) => ellipse(rx, ry, z * rise, N));
  // pitch
  items.push({
    kind: "poly",
    pts: ellipse(62, 40, 1.2, N),
    fill: C.pitch,
    flat: true,
    opacity: opacity * (1 - ghost),
    bias: -400,
  });
  items.push({
    kind: "poly",
    pts: ellipse(44, 26, 1.3, N),
    fill: "none",
    flat: true,
    stroke: "#ffffff",
    sw: 1.2,
    opacity: opacity * 0.8 * (1 - ghost),
    bias: -399,
  });
  for (let k = 0; k < rings.length - 1; k++) {
    band(rings[k], rings[k + 1], {
      fill: color,
      stroke: ghost > 0 ? C.accent : mix(color, C.ink, 0.35),
      sw: 1,
      opacity,
      fillOpacity: 1 - ghost,
      dash: ghost > 0.5 ? "4 4" : undefined,
      bias: -300 + k * 5,
    }).forEach((p) => items.push(p));
  }
  return items;
};

/** Seat positions for crowd dots. */
export const seatPoints = (count: number): V3[] => {
  const r = rng(7);
  const pts: V3[] = [];
  for (let i = 0; i < count; i++) {
    const k = r();
    const a = r() * Math.PI * 2;
    const [rx0, ry0, z0] = BOWL_RINGS[0];
    const [rx1, ry1, z1] = BOWL_RINGS[3];
    pts.push([Math.cos(a) * lerp(rx0 + 4, rx1 - 2, k), Math.sin(a) * lerp(ry0 + 4, ry1 - 2, k), lerp(z0, z1, k) + 1.5]);
  }
  return pts;
};

// ---------------------------------------------------------------- Zaha Hadid
export type ZahaOpts = {
  rise?: number; // 0..1 vertical extrusion
  shell?: number; // 0..1 shell opacity
  ghost?: number; // 0 solid, 1 dashed accent wireframe
  arches?: number; // 0..1 draw-on of the keel arches
  opacity?: number;
  lift?: number; // metres, float the whole thing upward
  highlightArches?: number; // 0..1 turns arches accent
};

const shoulderZ = (a: number) => 40 + 24 * Math.pow(Math.sin(a), 2);

export const zaha = ({ rise = 1, shell = 1, ghost = 0, arches = 1, opacity = 1, lift = 0, highlightArches = 0 }: ZahaOpts = {}): Item[] => {
  const items: Item[] = [];
  const z = (v: number) => v * rise + lift;
  const angles = Array.from({ length: N }, (_, i) => (i / N) * Math.PI * 2);
  const r0 = angles.map((a) => [Math.cos(a) * 152, Math.sin(a) * 120, z(0)] as V3);
  const r1 = angles.map((a) => [Math.cos(a) * 136, Math.sin(a) * 103, z(shoulderZ(a))] as V3);
  const r2 = angles.map((a) => [Math.cos(a) * 92, Math.sin(a) * 66, z(shoulderZ(a) - 5)] as V3);

  // Solid: seamless skin (faint seams). Ghost: dashed vermilion wireframe.
  const stroke = ghost > 0.02 ? mix("#D9D2C6", C.accent, Math.min(1, ghost * 1.4)) : "#E3DDD2";
  const dash = ghost > 0.5 ? "5 5" : undefined;
  const style = {
    stroke,
    sw: ghost > 0.5 ? 1.5 : 0.8,
    opacity: opacity * shell,
    fillOpacity: 1 - ghost,
    dash,
  };
  if (lift === 0 && ghost < 1) items.push(...bowl({ rise, opacity: opacity * shell * (1 - ghost) }));
  band(r0, r1, { fill: C.mass, ...style }).forEach((p) => items.push(p));
  band(r1, r2, { fill: C.massTop, ...style }).forEach((p) => items.push(p));
  // contour lines that describe the sweeping form
  if (ghost < 1) {
    for (const [ring, w] of [[r0, 1.4], [r1, 1.6], [r2, 1.6]] as [V3[], number][]) {
      items.push({ kind: "line", pts: close(ring), stroke: C.ink, sw: w, opacity: opacity * shell * (1 - ghost), bias: 30 });
    }
  }

  // Keel arches: two trussed spines along the long axis.
  const archCol = mix(mix(C.ink, C.accent, ghost), C.accent, highlightArches);
  for (const y of [-40, 40]) {
    const top: V3[] = [];
    const bot: V3[] = [];
    const S = 36;
    for (let i = 0; i <= S; i++) {
      const u = i / S;
      const x = lerp(-190, 190, u);
      const h = 84 * Math.sin(Math.PI * u);
      top.push([x, y, z(h + 3)]);
      bot.push([x, y, z(Math.max(0, h - 3))]);
    }
    const lineStyle: Omit<Line, "kind" | "pts"> = {
      stroke: archCol,
      sw: 3.2,
      opacity: opacity,
      progress: arches,
      bias: 60,
    };
    items.push({ kind: "line", pts: top, ...lineStyle });
    items.push({ kind: "line", pts: bot, ...lineStyle, sw: 1.4 });
    // truss diagonals
    for (let i = 0; i < S; i++) {
      if (i / S > arches) break;
      items.push({
        kind: "line",
        pts: [i % 2 ? top[i] : bot[i], i % 2 ? bot[i + 1] : top[i + 1]],
        stroke: archCol,
        sw: 0.9,
        opacity: opacity * 0.9,
        bias: 60,
      });
    }
  }
  return items;
};

// ---------------------------------------------------------------- Kengo Kuma
export type KumaOpts = { rise?: number; opacity?: number; trees?: number; tiers?: number };

export const kuma = ({ rise = 1, opacity = 1, trees = 1, tiers = 3 }: KumaOpts = {}): Item[] => {
  const items: Item[] = [];
  if (opacity <= 0) return items;
  items.push(...bowl({ rise, opacity }));
  const visibleTiers = Math.ceil(tiers);
  for (let k = 0; k < visibleTiers; k++) {
    const tierRise = Math.min(1, tiers - k) * rise;
    if (tierRise <= 0) break;
    const z0 = k * 14 * rise;
    const h = 12 * tierRise;
    const rx = 136 - k * 9;
    const ry = 104 - k * 9;
    const wallA = ellipse(rx, ry, z0, N);
    const wallB = ellipse(rx, ry, z0 + h, N);
    band(wallA, wallB, { fill: C.wall, stroke: mix(C.wall, C.ink, 0.4), sw: 0.6, opacity }).forEach((p) => items.push(p));
    // eave: wood slab overhang
    const eo = ellipse(rx + 11, ry + 11, z0 + h, N);
    const eoB = ellipse(rx + 11, ry + 11, z0 + h - 2.5, N);
    const ei = ellipse(rx - 2, ry - 2, z0 + h, N);
    band(ei, eo, { fill: C.woodTop, flat: true, stroke: mix(C.wood, C.ink, 0.3), sw: 0.6, opacity, bias: 2 }).forEach((p) => items.push(p));
    band(eoB, eo, { fill: C.wood, stroke: mix(C.wood, C.ink, 0.45), sw: 0.6, opacity, bias: 3 }).forEach((p) => items.push(p));
    // timber louvres hanging from the eave
    const lou = 120;
    for (let i = 0; i < lou; i++) {
      const a = (i / lou) * Math.PI * 2;
      const x = Math.cos(a) * (rx + 10);
      const y = Math.sin(a) * (ry + 10);
      items.push({
        kind: "line",
        pts: [
          [x, y, z0 + h - 2.5],
          [x, y, z0 + h - 2.5 - 5 * tierRise],
        ],
        stroke: mix(C.wood, C.ink, 0.35),
        sw: 1,
        opacity: opacity * 0.9,
        cap: "butt",
        bias: 4,
      });
    }
    // trees on the top eave
    if (k === 2 && trees > 0) {
      const r = rng(11);
      for (let i = 0; i < 46; i++) {
        const a = (i / 46) * Math.PI * 2 + r() * 0.05;
        items.push({
          kind: "dot",
          p: [Math.cos(a) * (rx + 6), Math.sin(a) * (ry + 6), z0 + h + 3],
          r: 3.6 * trees,
          fill: i % 3 ? C.tree : C.treeDark,
          stroke: mix(C.tree, C.ink, 0.4),
          sw: 0.8,
          opacity,
          bias: 6,
        });
      }
    }
  }
  if (tiers >= 3) {
    // roof ring
    const zr = 42 * rise;
    const ro = ellipse(128, 96, zr, N);
    const ri = ellipse(90, 64, zr + 3 * rise, N);
    band(ro, ri, { fill: C.roof, stroke: mix(C.roof, C.ink, 0.35), sw: 0.7, opacity, bias: 8 }).forEach((p) => items.push(p));
  }
  return items;
};

// ---------------------------------------------------------------- Context
export const city = (opacity = 1, seed = 3): Item[] => {
  const items: Item[] = [];
  const r = rng(seed);
  const G = 46;
  for (let gx = -9; gx <= 9; gx++) {
    for (let gy = -9; gy <= 9; gy++) {
      const cx = gx * G;
      const cy = gy * G;
      // keep the stadium site + park clear
      if ((cx / 230) ** 2 + (cy / 200) ** 2 < 1) continue;
      if (cx > 150 && cy < -60 && cy > -360) continue; // Gaien park (ginkgo avenue)
      if (r() < 0.4) continue;
      const dist = Math.hypot(cx, cy);
      const fade = Math.max(0, Math.min(1, 1.35 - dist / 380));
      if (fade <= 0.02) continue;
      const w = 16 + r() * 18;
      const d = 16 + r() * 18;
      const h = 5 + Math.pow(r(), 2) * 30;
      box(cx - w / 2, cy - d / 2, 0, w, d, h, {
        fill: C.city,
        stroke: mix(C.city, C.ink, 0.16),
        sw: 0.6,
        opacity: opacity * fade,
      }).forEach((p) => items.push(p));
    }
  }
  return items;
};

export const park = (opacity = 1, grow = 1): Item[] => {
  const items: Item[] = [];
  // Ginkgo avenue: two rows of yellow trees heading away from the site.
  for (let i = 0; i < 12; i++) {
    for (const x of [185, 225]) {
      const y = -90 - i * 22;
      items.push({ kind: "dot", p: [x, y, 6], r: 6 * grow, fill: C.ginkgo, stroke: mix(C.ginkgo, C.ink, 0.35), sw: 0.8, opacity });
    }
  }
  const r = rng(5);
  for (let i = 0; i < 70; i++) {
    const x = 250 + r() * 160;
    const y = -80 - r() * 300;
    items.push({ kind: "dot", p: [x, y, 5], r: (4 + r() * 4) * grow, fill: r() > 0.5 ? C.tree : C.treeDark, stroke: mix(C.tree, C.ink, 0.35), sw: 0.7, opacity });
  }
  items.push({
    kind: "poly",
    ground: true,
    flat: true,
    pts: [
      [160, -60, 0],
      [420, -60, 0],
      [420, -400, 0],
      [160, -400, 0],
    ],
    fill: C.parkGround,
    opacity,
  });
  return items;
};

export const sitePlate = (opacity = 1, outline = 1): Item[] => [
  {
    kind: "poly",
    ground: true,
    flat: true,
    pts: [
      [-205, -165, 0],
      [205, -165, 0],
      [205, 165, 0],
      [-205, 165, 0],
    ],
    fill: C.site,
    opacity,
  },
  {
    kind: "line",
    ground: true,
    pts: close([
      [-205, -165, 0],
      [205, -165, 0],
      [205, 165, 0],
      [-205, 165, 0],
    ]),
    stroke: C.accent,
    sw: 1.4,
    dash: "8 6",
    opacity: opacity,
    progress: outline,
  },
];

/** Little people for scale. */
export const people = (count: number, opacity = 1, seed = 9, area: [number, number, number, number] = [-220, 220, 130, 200]): Item[] => {
  const r = rng(seed);
  const items: Item[] = [];
  for (let i = 0; i < count; i++) {
    const x = lerp(area[0], area[1], r());
    const y = lerp(area[2], area[3], r());
    items.push({ kind: "line", pts: [[x, y, 0], [x, y, 1.7]], stroke: C.ink, sw: 2.2, opacity, bias: 2 });
    items.push({ kind: "dot", p: [x, y, 2.1], r: 0.45, fill: C.ink, opacity, bias: 3 });
  }
  return items;
};

/** Competition entries: 46 small boards laid out on the site. */
export const entries = (t: number, chosen: number, fadeOthers: number): Poly[] => {
  const items: Poly[] = [];
  const cols = 8;
  for (let i = 0; i < 46; i++) {
    const c = i % cols;
    const rrow = Math.floor(i / cols);
    const x = -150 + c * 40;
    const y = -110 + rrow * 40;
    const appear = Math.max(0, Math.min(1, t * 46 - i));
    if (appear <= 0) continue;
    const isChosen = i === chosen;
    const h = isChosen ? 2 + 10 * fadeOthers : 2;
    box(x, y, 0, 26, 26, h * appear, {
      fill: isChosen ? mix(C.massTop, C.accent, fadeOthers) : C.massTop,
      stroke: C.ink,
      sw: 0.8,
      opacity: isChosen ? 1 : 1 - fadeOthers,
    }).forEach((p) => items.push(p));
  }
  return items;
};

/** A cost bar (box) whose height is proportional to value. */
export const bar = (x: number, y: number, height: number, color: string, opacity = 1): Poly[] =>
  box(x, y, 0, 26, 26, Math.max(0.1, height), { fill: color, stroke: mix(color, C.ink, 0.45), sw: 1, opacity });

// ---------------------------------------------------------------- Towers, grids, cranes (ep02+)
export type SpireOpts = {
  r: number; // base radius (m)
  h: number; // full height (m)
  rise?: number; // 0..1 growth
  sides?: number;
  taper?: number; // 0..1 how much it narrows before the tip
  color?: string;
  ghost?: number;
  opacity?: number;
  rings?: number; // horizontal contour rings
  finial?: "cross" | "star" | "ball" | "none";
  base?: number; // z of the base
};

/** Polygonal tapering tower with a pointed tip — bell towers, spires. */
export const spire = (x: number, y: number, o: SpireOpts): Item[] => {
  const { r, h, rise = 1, sides = 8, taper = 0.78, color = C.stone, ghost = 0, opacity = 1, rings = 4, finial = "ball", base = 0 } = o;
  const items: Item[] = [];
  if (rise <= 0.001 || opacity <= 0.003) return items;
  const H = h * rise;
  const L = 7;
  const tipStart = 0.86;
  const ringAt = (k: number): V3[] => {
    const t = (k / L) * tipStart;
    const rr = r * (1 - taper * Math.pow(t / tipStart, 1.8));
    return ellipse(rr, rr, base + H * t, sides, x, y, Math.PI / sides);
  };
  const stroke = ghost > 0.02 ? mix("#D9D2C6", C.accent, Math.min(1, ghost * 1.4)) : mix(color, C.ink, 0.18);
  const style = { stroke, sw: ghost > 0.5 ? 1.3 : 0.6, opacity, fillOpacity: 1 - ghost, dash: ghost > 0.5 ? "4 4" : undefined };
  for (let k = 0; k < L; k++) band(ringAt(k), ringAt(k + 1), { fill: color, ...style }).forEach((p) => items.push(p));
  // pointed tip
  const top = ringAt(L);
  const apex: V3 = [x, y, base + H];
  top.forEach((a, i) => items.push({ kind: "poly", pts: [a, top[(i + 1) % top.length], apex], fill: color, ...style }));
  // contour rings (ink) give the stacked-stone read
  if (ghost < 1) {
    for (let k = 1; k <= rings; k++) {
      const ring = ringAt(Math.round((k / (rings + 1)) * L));
      items.push({ kind: "line", pts: close(ring), stroke: mix(color, C.ink, 0.55), sw: 0.9, opacity: opacity * (1 - ghost), bias: 4 });
    }
  }
  const fc = ghost > 0.5 ? C.accent : C.accent;
  if (rise > 0.98 && finial !== "none") {
    if (finial === "cross") {
      const z = base + H;
      const s = Math.max(3, r * 0.6);
      items.push({ kind: "line", pts: [[x, y, z], [x, y, z + s * 2.2]], stroke: fc, sw: 3, opacity, bias: 50 });
      items.push({ kind: "line", pts: [[x - s, y, z + s * 1.4], [x + s, y, z + s * 1.4]], stroke: fc, sw: 3, opacity, bias: 50 });
      items.push({ kind: "line", pts: [[x, y - s, z + s * 1.4], [x, y + s, z + s * 1.4]], stroke: fc, sw: 3, opacity, bias: 50 });
    } else {
      items.push({ kind: "dot", p: [x, y, base + H + r * 0.25], r: Math.max(1.2, r * (finial === "star" ? 0.45 : 0.3)), fill: finial === "star" ? "#F4D27A" : fc, stroke: C.ink, sw: 0.6, opacity, bias: 50 });
    }
  }
  return items;
};

/** Barcelona Eixample block: square with chamfered corners and a courtyard. */
export const eixampleBlock = (cx: number, cy: number, o: { size?: number; chamfer?: number; depth?: number; h?: number; opacity?: number; color?: string } = {}): Item[] => {
  const { size = 113, chamfer = 20, depth = 24, h = 22, opacity = 1, color = mix(C.city, C.paper, 0.35) } = o;
  if (opacity <= 0.003) return [];
  const oct = (s: number, c: number, z: number): V3[] => {
    const a = s / 2;
    return [
      [cx - a + c, cy - a, z],
      [cx + a - c, cy - a, z],
      [cx + a, cy - a + c, z],
      [cx + a, cy + a - c, z],
      [cx + a - c, cy + a, z],
      [cx - a + c, cy + a, z],
      [cx - a, cy + a - c, z],
      [cx - a, cy - a + c, z],
    ];
  };
  const style = { fill: color, stroke: mix(color, C.ink, 0.18), sw: 0.6, opacity };
  const items: Item[] = [];
  const inner = size - depth * 2;
  const ic = Math.max(4, chamfer - depth * 0.4);
  band(oct(size, chamfer, 0), oct(size, chamfer, h), style).forEach((p) => items.push(p));
  band(oct(inner, ic, 0), oct(inner, ic, h), { ...style, bias: -20 }).forEach((p) => items.push(p));
  band(oct(size, chamfer, h), oct(inner, ic, h), { ...style, fill: mix(color, "#ffffff", 0.35) }).forEach((p) => items.push(p));
  return items;
};

/** A grid of Eixample blocks around the origin. skip(ix, iy) leaves a block empty. */
export const eixample = (o: { radius?: number; pitch?: number; opacity?: number; skip?: (ix: number, iy: number) => boolean; seed?: number } = {}): Item[] => {
  const { radius = 3, pitch = 133, opacity = 1, skip = () => false, seed = 4 } = o;
  const r = rng(seed);
  const items: Item[] = [];
  for (let ix = -radius; ix <= radius; ix++) {
    for (let iy = -radius; iy <= radius; iy++) {
      const h = 18 + r() * 10;
      if (skip(ix, iy)) continue;
      const d = Math.hypot(ix, iy) * pitch;
      const fade = Math.max(0, Math.min(1, 1.45 - d / (pitch * radius)));
      if (fade < 0.03) continue;
      items.push(...eixampleBlock(ix * pitch, iy * pitch, { h, opacity: opacity * fade }));
    }
  }
  return items;
};

/** Lattice tower crane (lines). jib angle in radians. */
export const crane = (x: number, y: number, o: { h?: number; jib?: number; angle?: number; opacity?: number; color?: string } = {}): Item[] => {
  const { h = 120, jib = 55, angle = 0, opacity = 1, color = C.crane } = o;
  if (opacity <= 0.003) return [];
  const items: Item[] = [];
  const s = 1.6;
  const corners: [number, number][] = [
    [-s, -s],
    [s, -s],
    [s, s],
    [-s, s],
  ];
  const st = { stroke: color, sw: 1.1, opacity, bias: 30 };
  corners.forEach(([dx, dy]) => items.push({ kind: "line", pts: [[x + dx, y + dy, 0], [x + dx, y + dy, h]], ...st }));
  for (let z = 0; z < h; z += 8) {
    items.push({ kind: "line", pts: [[x - s, y - s, z], [x + s, y + s, z + 8]], ...st, sw: 0.6 });
    items.push({ kind: "line", pts: [[x + s, y - s, z], [x - s, y + s, z + 8]], ...st, sw: 0.6 });
  }
  const c = Math.cos(angle);
  const sn = Math.sin(angle);
  const tip: V3 = [x + c * jib, y + sn * jib, h + 2];
  const back: V3 = [x - c * jib * 0.3, y - sn * jib * 0.3, h + 2];
  items.push({ kind: "line", pts: [back, tip], ...st, sw: 2 });
  items.push({ kind: "line", pts: [[x, y, h + 9], tip], ...st, sw: 0.8 });
  items.push({ kind: "line", pts: [[x, y, h + 9], back], ...st, sw: 0.8 });
  items.push({ kind: "line", pts: [[x, y, h], [x, y, h + 9]], ...st, sw: 1.6 });
  // hook cable
  const hk: V3 = [x + c * jib * 0.7, y + sn * jib * 0.7, h + 2];
  items.push({ kind: "line", pts: [hk, [hk[0], hk[1], h - 30]], stroke: C.ink, sw: 0.6, opacity: opacity * 0.7, bias: 30 });
  items.push(...box(back[0] - 2, back[1] - 2, h - 1, 4, 4, 4, { fill: mix(color, C.ink, 0.3), stroke: C.ink, sw: 0.5, opacity, bias: 31 }));
  return items;
};

/** A smooth hill (stacked rings). */
export const hill = (cx: number, cy: number, o: { rx: number; ry: number; h: number; opacity?: number; color?: string; ghost?: number }): Item[] => {
  const { rx, ry, h, opacity = 1, color = "#C9CFB4", ghost = 0 } = o;
  const items: Item[] = [];
  const L = 6;
  const ring = (k: number) => {
    const t = k / L;
    const s = Math.sqrt(1 - t * t * 0.96);
    return ellipse(rx * s, ry * s, h * t, 28, cx, cy);
  };
  for (let k = 0; k < L; k++)
    band(ring(k), ring(k + 1), { fill: color, stroke: ghost ? C.accent : mix(color, C.ink, 0.2), sw: 0.6, opacity, fillOpacity: 1 - ghost, dash: ghost ? "4 4" : undefined }).forEach((p) => items.push(p));
  items.push({ kind: "poly", pts: ring(L), fill: color, stroke: mix(color, C.ink, 0.2), sw: 0.6, opacity, fillOpacity: 1 - ghost });
  return items;
};
