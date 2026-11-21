// Sagrada Família, low-poly and schematic. Main axis along x: Glory façade
// (main entrance, unbuilt) at +x, apse at -x; transept along y: Nativity façade
// at +y, Passion façade at -y. Build phases are approximate (illustrative).
import { box, clamp01, easeOut, Item, mix, Poly, rng, V3 } from "../iso/engine";
import { spire } from "../iso/models";
import { C } from "../theme";

const ph = (year: number, a: number, b: number) => easeOut(clamp01((year - a) / (b - a)));

type Opts = {
  year: number;
  /** the whole design as a vermilion ghost (Gaudí's plan) 0..1 */
  plan?: number;
  /** how many of the 18 towers show in the plan ghost (for the "eighteen towers" count) */
  planTowers?: number;
  /** show the unbuilt Glory façade as a ghost */
  glory?: number;
  opacity?: number;
  highlightJesus?: number;
};

type TowerDef = { id: string; x: number; y: number; r: number; h: number; built: [number, number]; finial: "cross" | "star" | "ball"; kind: string; glory?: boolean };

export const TOWERS: TowerDef[] = [
  // Nativity façade (+y) — the part Gaudí saw rise
  { id: "nat1", x: -14, y: 40, r: 4.2, h: 98, built: [1903, 1925], finial: "ball", kind: "apostle" },
  { id: "nat2", x: -5, y: 40, r: 4.6, h: 107, built: [1915, 1930], finial: "ball", kind: "apostle" },
  { id: "nat3", x: 5, y: 40, r: 4.6, h: 107, built: [1915, 1930], finial: "ball", kind: "apostle" },
  { id: "nat4", x: 14, y: 40, r: 4.2, h: 98, built: [1915, 1930], finial: "ball", kind: "apostle" },
  // Passion façade (-y)
  { id: "pas1", x: -14, y: -40, r: 4.4, h: 107, built: [1960, 1976], finial: "ball", kind: "apostle" },
  { id: "pas2", x: -5, y: -40, r: 4.8, h: 112, built: [1960, 1976], finial: "ball", kind: "apostle" },
  { id: "pas3", x: 5, y: -40, r: 4.8, h: 112, built: [1960, 1976], finial: "ball", kind: "apostle" },
  { id: "pas4", x: 14, y: -40, r: 4.4, h: 107, built: [1960, 1976], finial: "ball", kind: "apostle" },
  // Glory façade (+x) — not built
  { id: "glo1", x: 62, y: -15, r: 4.8, h: 112, built: [9999, 9999], finial: "ball", kind: "apostle", glory: true },
  { id: "glo2", x: 62, y: -5, r: 5.2, h: 120, built: [9999, 9999], finial: "ball", kind: "apostle", glory: true },
  { id: "glo3", x: 62, y: 5, r: 5.2, h: 120, built: [9999, 9999], finial: "ball", kind: "apostle", glory: true },
  { id: "glo4", x: 62, y: 15, r: 4.8, h: 112, built: [9999, 9999], finial: "ball", kind: "apostle", glory: true },
  // Evangelists around the crossing, Mary over the apse, Jesus in the centre
  { id: "eva1", x: 17, y: 17, r: 6.5, h: 135, built: [2016, 2023], finial: "ball", kind: "evangelist" },
  { id: "eva2", x: 17, y: -17, r: 6.5, h: 135, built: [2016, 2023], finial: "ball", kind: "evangelist" },
  { id: "eva3", x: -17, y: 17, r: 6.5, h: 135, built: [2016, 2023], finial: "ball", kind: "evangelist" },
  { id: "eva4", x: -17, y: -17, r: 6.5, h: 135, built: [2016, 2023], finial: "ball", kind: "evangelist" },
  { id: "mary", x: -34, y: 0, r: 7, h: 138, built: [2014, 2021], finial: "star", kind: "mary" },
  { id: "jesus", x: 0, y: 0, r: 11, h: 172.5, built: [2018, 2026.15], finial: "cross", kind: "jesus" },
];

/** Gable (triangle) on top of a wall segment between two points at height z. */
const gable = (a: [number, number], b: [number, number], z: number, peak: number, style: Omit<Poly, "kind" | "pts">): Poly => ({
  kind: "poly",
  pts: [
    [a[0], a[1], z],
    [b[0], b[1], z],
    [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z + peak],
  ],
  ...style,
});

/** Pitched roof over a rectangle, ridge along x (dir "x") or y. */
const roof = (x0: number, y0: number, x1: number, y1: number, z: number, rise: number, dir: "x" | "y", style: Omit<Poly, "kind" | "pts">): Poly[] => {
  if (dir === "x") {
    const ym = (y0 + y1) / 2;
    return [
      { kind: "poly", pts: [[x0, y0, z], [x1, y0, z], [x1, ym, z + rise], [x0, ym, z + rise]], ...style },
      { kind: "poly", pts: [[x0, y1, z], [x1, y1, z], [x1, ym, z + rise], [x0, ym, z + rise]], ...style },
    ];
  }
  const xm = (x0 + x1) / 2;
  return [
    { kind: "poly", pts: [[x0, y0, z], [x0, y1, z], [xm, y1, z + rise], [xm, y0, z + rise]], ...style },
    { kind: "poly", pts: [[x1, y0, z], [x1, y1, z], [xm, y1, z + rise], [xm, y0, z + rise]], ...style },
  ];
};

const body = (k: number, ghost: number, opacity: number) => ({
  stroke: ghost ? C.accent : mix(C.stone, C.ink, 0.25),
  sw: ghost ? 1.2 : 0.7,
  opacity,
  fillOpacity: 1 - ghost,
  dash: ghost ? "4 4" : undefined,
  fill: C.stone,
});

/** The church at a given year (+ optional ghost of the full plan). */
export const sagrada = ({ year, plan = 0, planTowers = 18, glory = 0, opacity = 1, highlightJesus = 0 }: Opts): Item[] => {
  const items: Item[] = [];
  const solid = (k: number) => body(k, 0, opacity);

  // --- apse (1882–1893): semicircular chevet with pinnacles
  const apse = ph(year, 1882, 1894);
  if (apse > 0) {
    const n = 14;
    const ring = (z: number, r: number): V3[] =>
      Array.from({ length: n + 1 }, (_, i) => {
        const a = Math.PI / 2 + (i / n) * Math.PI;
        return [-32 + Math.cos(a) * r, Math.sin(a) * r, z] as V3;
      });
    const h = 34 * apse;
    const lo = ring(0, 22);
    const hi = ring(h, 22);
    for (let i = 0; i < n; i++) items.push({ kind: "poly", pts: [lo[i], lo[i + 1], hi[i + 1], hi[i]], ...solid(0) });
    if (apse > 0.9) {
      const top = ring(h, 22);
      top.forEach((p, i) => {
        if (i % 2 === 0) items.push(...spire(p[0], p[1], { r: 1.6, h: 16, base: h, rings: 1, finial: "none", opacity, taper: 0.9 }));
      });
    }
  }

  // --- Nativity façade body (1894–1910)
  const nat = ph(year, 1894, 1912);
  if (nat > 0) {
    items.push(...box(-19, 34, 0, 38, 8, 46 * nat, solid(0)));
    if (nat > 0.95) {
      const st = { ...solid(0), fill: C.stoneDark };
      items.push(gable([-19, 42], [-6, 42], 46, 22, st), gable([-6, 42], [6, 42], 46, 30, st), gable([6, 42], [19, 42], 46, 22, st));
    }
  }
  // --- Passion façade body (1954–1976)
  const pas = ph(year, 1954, 1972);
  if (pas > 0) {
    items.push(...box(-19, -42, 0, 38, 8, 46 * pas, solid(0)));
    if (pas > 0.95) {
      const st = { ...solid(0), fill: mix(C.stone, "#ffffff", 0.2) };
      items.push(gable([-19, -42], [19, -42], 46, 26, st));
    }
  }
  // --- nave + transept walls (1978–2000), roofs (2000–2010)
  const walls = ph(year, 1978, 2002);
  if (walls > 0) {
    items.push(...box(-32, -22, 0, 82, 44, 45 * walls, solid(0)));
    items.push(...box(-19, -34, 0, 38, 68, 45 * walls, solid(0)));
  }
  const roofs = ph(year, 2000, 2010);
  if (roofs > 0) {
    const st = { ...solid(0), fill: mix(C.stone, "#ffffff", 0.25), bias: 5 };
    items.push(...roof(-32, -22, 50, 22, 45, 22 * roofs, "x", st));
    items.push(...roof(-19, -34, 19, 34, 45, 22 * roofs, "y", st));
  }

  // --- towers
  for (const t of TOWERS) {
    const rise = t.glory ? 0 : ph(year, t.built[0], t.built[1]);
    if (rise > 0) {
      const col = t.kind === "jesus" ? mix(C.stone, C.accent, 0.35 * highlightJesus) : t.kind === "apostle" ? C.stone : mix(C.stone, "#ffffff", 0.25);
      items.push(...spire(t.x, t.y, { r: t.r, h: t.h, rise, finial: t.finial, color: col, opacity, rings: t.kind === "apostle" ? 4 : 5, taper: t.kind === "jesus" ? 0.6 : 0.75 }));
    }
  }

  // --- the full plan as a ghost
  if (plan > 0.01) {
    TOWERS.forEach((t, i) => {
      if (i >= planTowers) return;
      if (!t.glory && ph(year, t.built[0], t.built[1]) > 0.98) return;
      items.push(...spire(t.x, t.y, { r: t.r, h: t.h, ghost: 1, opacity: plan, finial: "none", rings: 0, taper: t.kind === "jesus" ? 0.6 : 0.75 }));
    });
    if (walls < 0.98) {
      items.push(...box(-32, -22, 0, 82, 44, 45, body(0, 1, plan * 0.8)));
    }
  }
  // --- Glory façade: the unbuilt main entrance (ghost)
  if (glory > 0.01) {
    const g = body(0, 1, glory);
    items.push(...box(50, -24, 0, 10, 48, 60, g));
    items.push(gable([60, -24], [60, 24], 60, 34, g));
    TOWERS.filter((t) => t.glory).forEach((t) => items.push(...spire(t.x, t.y, { r: t.r, h: t.h, ghost: 1, opacity: glory, finial: "none", rings: 0 })));
    // the staircase that would reach across the street
    for (let k = 0; k < 6; k++) items.push(...box(60 + k * 9, -18, 0, 9, 36, Math.max(0.5, 12 - k * 2), g));
  }
  return items;
};

/** Gaudí's on-site workshop (a shed by the apse) — burning in 1936. */
export const workshop = (x: number, y: number, o: { fire?: number; t?: number; opacity?: number }): Item[] => {
  const { fire = 0, t = 0, opacity = 1 } = o;
  const items: Item[] = [];
  const burnt = mix(C.mass, "#4A4038", fire * 0.75);
  items.push(...box(x - 16, y - 9, 0, 32, 18, 9, { fill: burnt, stroke: C.ink, sw: 0.8, opacity }));
  items.push(...roof(x - 16, y - 9, x + 16, y + 9, 9, 6, "x", { fill: mix(burnt, "#ffffff", 0.15), stroke: C.ink, sw: 0.8, opacity }));
  if (fire > 0.01) {
    const r = rng(21);
    for (let i = 0; i < 46; i++) {
      const px = x - 14 + r() * 28;
      const py = y - 8 + r() * 16;
      const ph0 = r() * 6;
      const life = (t * 1.6 + ph0) % 1;
      const z = 10 + life * (16 + r() * 18) * fire;
      items.push({ kind: "dot", p: [px, py, z], r: (2.4 - life * 1.8) * fire + 0.3, fill: life < 0.5 ? C.fire : C.accent, opacity: opacity * fire * (1 - life), bias: 200 });
    }
    // smoke
    for (let i = 0; i < 14; i++) {
      const life = (t * 0.5 + i / 14) % 1;
      items.push({ kind: "dot", p: [x + Math.sin(i) * 6 + life * 20, y + Math.cos(i) * 4, 30 + life * 60], r: 3 + life * 8, fill: "#8E877C", opacity: opacity * fire * 0.35 * (1 - life), bias: 210 });
    }
  }
  return items;
};

/** A plaster model (a stack of blocks shaped like a spire) that smashes and reassembles.
 *  k = 0 assembled, 1 fully scattered. */
export const plasterModel = (x: number, y: number, k: number, o: { opacity?: number; t?: number } = {}): Item[] => {
  const { opacity = 1 } = o;
  const items: Item[] = [];
  const r = rng(33);
  const L = 9;
  for (let lv = 0; lv < L; lv++) {
    const rr = 7 * (1 - 0.8 * (lv / L));
    const z0 = lv * 4.2;
    const seg = 6;
    for (let s = 0; s < seg; s++) {
      const a = (s / seg) * Math.PI * 2;
      const cx = x + Math.cos(a) * rr * 0.6;
      const cy = y + Math.sin(a) * rr * 0.6;
      const sz = rr * 0.75;
      const dx = (r() - 0.5) * 120;
      const dy = (r() - 0.5) * 120;
      const dz = -z0 + r() * 2;
      const kk = easeOut(clamp01(k * 1.25 - r() * 0.25));
      items.push(
        ...box(cx - sz / 2 + dx * kk, cy - sz / 2 + dy * kk, z0 + dz * kk, sz, sz, 3.8, {
          fill: "#F5F1E8",
          stroke: C.ink,
          sw: 0.7,
          opacity,
        }),
      );
    }
  }
  return items;
};

/** Plans (sheets of paper) blowing out of the workshop. */
export const sheets = (x: number, y: number, k: number, opacity = 1): Item[] => {
  const r = rng(44);
  const items: Item[] = [];
  for (let i = 0; i < 16; i++) {
    const a = r() * Math.PI * 2;
    const d = k * (20 + r() * 60);
    const cx = x + Math.cos(a) * d;
    const cy = y + Math.sin(a) * d;
    const z = 4 + Math.sin(k * 3 + i) * 6 * k + k * 12 * r();
    const w = 5;
    const burn = clamp01(k * 1.4 - r() * 0.6);
    items.push({
      kind: "poly",
      pts: [
        [cx, cy, z],
        [cx + w, cy + w * 0.3, z + 1],
        [cx + w * 0.8, cy + w * 1.2, z + 1.5],
        [cx - w * 0.2, cy + w * 0.9, z + 0.5],
      ],
      fill: mix("#FFFDF7", "#3B342D", burn),
      flat: true,
      stroke: C.ink,
      sw: 0.6,
      opacity: opacity * (1 - burn * 0.6),
      bias: 150,
    });
  }
  return items;
};

/** A 1920s tram on a street running along x at y. pos in metres. */
export const tram = (pos: number, y: number, opacity = 1): Item[] => [
  ...box(pos - 7, y - 1.4, 0.6, 14, 2.8, 3.4, { fill: "#E9D9B5", stroke: C.ink, sw: 0.8, opacity, bias: 20 }),
  ...box(pos - 7.3, y - 1.6, 4, 14.6, 3.2, 0.5, { fill: C.accent, stroke: C.ink, sw: 0.6, opacity, bias: 21 }),
  { kind: "line", pts: [[pos, y, 4.5], [pos + 2, y, 7.5]], stroke: C.ink, sw: 1, opacity, bias: 22 },
];

export const street = (y: number, x0: number, x1: number, opacity = 1): Item[] => [
  { kind: "poly", ground: true, flat: true, pts: [[x0, y - 6, 0], [x1, y - 6, 0], [x1, y + 6, 0], [x0, y + 6, 0]], fill: "#E2DCCF", opacity },
  { kind: "line", ground: true, pts: [[x0, y - 0.8, 0], [x1, y - 0.8, 0]], stroke: "#A69D8E", sw: 1, opacity },
  { kind: "line", ground: true, pts: [[x0, y + 0.8, 0], [x1, y + 0.8, 0]], stroke: "#A69D8E", sw: 1, opacity },
];

/** Dimension line (vertical) with ticks. */
export const dimension = (x: number, y: number, z0: number, z1: number, color: string, opacity = 1): Item[] => [
  { kind: "line", pts: [[x, y, z0], [x, y, z1]], stroke: color, sw: 1.4, opacity, bias: 300 },
  { kind: "line", pts: [[x - 4, y, z1], [x + 4, y, z1]], stroke: color, sw: 1.4, opacity, bias: 300 },
  { kind: "line", pts: [[x - 4, y, z0], [x + 4, y, z0]], stroke: color, sw: 1.4, opacity, bias: 300 },
];

