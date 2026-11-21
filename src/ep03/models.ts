// The Gherkin as our engine sees it: a shell of FLAT triangles on a diagrid — which is the episode's point.
// Proportions approximate: 180 m tall, ~49 m across at the base, ~56.5 m at its widest (~a third up).
import { clamp01, ellipse, Item, lerp, mix, V3 } from "../iso/engine";
import { C } from "../theme";

const H = 180;
const RINGS = 22; // each diamond row ≈ two floors
const SEG = 28;

/** radius at height z */
export const radiusAt = (z: number) => {
  const zm = 60;
  const k = z <= zm ? (zm - z) / 120 : (z - zm) / 121.5;
  return 28.25 * Math.sqrt(Math.max(0.0, 1 - k * k));
};

const GLASS = "#9DB2C2";
const GLASS_DARK = "#3E4D5D";
const STEEL = "#1F252B";

const node = (k: number, i: number): V3 => {
  const z = (k / RINGS) * (H - 6);
  const r = Math.max(2.5, radiusAt(z));
  const a = ((i + (k % 2) * 0.5) / SEG) * Math.PI * 2;
  return [Math.cos(a) * r, Math.sin(a) * r, z];
};

export type GherkinOpts = {
  rise?: number; // 0..1 vertical build
  facets?: number; // 0..1 how many rows of flat panes are filled (bottom-up)
  diagrid?: number; // 0..1 draw-on of the steel diagonals
  spirals?: number; // 0..1 darken the six light-well spirals
  ghost?: number; // 0..1 smooth silhouette rings ("what your eye sees")
  lens?: number; // 0..1 highlight the curved lens cap
  airflow?: number; // 0..1 show airflow lines
  t?: number; // seconds, for airflow animation
  highlightRow?: number; // row index to emphasise (the "tiny angle" close-up)
  opacity?: number;
};

export const gherkin = (o: GherkinOpts = {}): Item[] => {
  const { rise = 1, facets = 1, diagrid = 1, spirals = 0, ghost = 0, lens = 0, airflow = 0, t = 0, highlightRow = -1, opacity = 1 } = o;
  const items: Item[] = [];
  const zMax = rise * H;
  const rowsShown = Math.floor(RINGS * clamp01(facets) + 0.0001);

  // flat triangular panes
  for (let k = 0; k < RINGS; k++) {
    if (k >= rowsShown) break;
    for (let i = 0; i < SEG; i++) {
      const a0 = node(k, i);
      const a1 = node(k, i + 1);
      const b0 = node(k + 1, i);
      const b1 = node(k + 1, i + 1);
      if (b0[2] > zMax) continue;
      // six spiral bands: index drifts with height
      const band = ((i - Math.floor(k * 0.9)) % SEG + SEG) % SEG;
      const inSpiral = band % Math.round(SEG / 6) === 0;
      const base = inSpiral ? mix(GLASS, GLASS_DARK, spirals) : GLASS;
      const hl = k === highlightRow ? 0.6 : 0;
      const fill = hl ? mix(base, C.accent, 0.35) : base;
      const st = { fill, stroke: mix(fill, "#ffffff", 0.55), sw: 0.7, opacity };
      items.push({ kind: "poly", pts: [a0, a1, b0], ...st });
      items.push({ kind: "poly", pts: [a1, b1, b0], ...st, fill: mix(fill, "#ffffff", 0.06) });
    }
  }

  // steel diagonals (the diagrid), drawn on bottom-up
  const maxK = Math.floor(RINGS * clamp01(diagrid));
  for (let k = 0; k < maxK; k++) {
    for (let i = 0; i < SEG; i++) {
      const a = node(k, i);
      const b = node(k + 1, i);
      const c = node(k + 1, i - 1 + (k % 2));
      const b2 = k % 2 ? node(k + 1, i) : node(k + 1, i);
      if (b[2] > zMax) continue;
      const st = { stroke: STEEL, sw: k === highlightRow ? 2.4 : 1.7, opacity, bias: 3 };
      items.push({ kind: "line", pts: [a, k % 2 ? node(k + 1, i + 1) : b2], ...st });
      items.push({ kind: "line", pts: [a, c], ...st });
    }
  }

  // lens cap (the only curved glass)
  const capZ = (RINGS / RINGS) * (H - 6);
  if (zMax >= capZ - 0.5 && facets > 0.99) {
    const r0 = Math.max(2.5, radiusAt(capZ));
    for (let s = 0; s < 4; s++) {
      const z0 = capZ + (s / 4) * 6;
      const z1 = capZ + ((s + 1) / 4) * 6;
      const ra = r0 * Math.cos(((s / 4) * Math.PI) / 2);
      const rb = r0 * Math.cos((((s + 1) / 4) * Math.PI) / 2);
      const A = ellipse(ra, ra, z0, 20);
      const B = ellipse(Math.max(0.3, rb), Math.max(0.3, rb), z1, 20);
      for (let i = 0; i < 20; i++) {
        const j = (i + 1) % 20;
        items.push({ kind: "poly", pts: [A[i], A[j], B[j], B[i]], fill: mix(GLASS_DARK, C.accent, lens * 0.7), stroke: lens > 0.1 ? C.accent : mix(GLASS_DARK, "#ffffff", 0.2), sw: lens > 0.1 ? 0.9 : 0.4, opacity, bias: 6 });
      }
    }
  }

  // "what your eye sees": smooth silhouette rings
  if (ghost > 0.01) {
    for (let z = 4; z < H - 4; z += 9) {
      const r = radiusAt(z) + 1.2;
      items.push({ kind: "line", pts: [...ellipse(r, r, z, 48), ellipse(r, r, z, 48)[0]], stroke: C.accent, sw: 1.4, dash: "6 5", opacity: opacity * ghost, bias: 40 });
    }
  }

  // airflow up the light wells
  if (airflow > 0.01) {
    for (let s = 0; s < 6; s++) {
      const pts: V3[] = [];
      for (let q = 0; q <= 60; q++) {
        const z = (q / 60) * (H - 20);
        const a = (s / 6) * Math.PI * 2 + z * 0.028;
        const r = radiusAt(z) + 3;
        pts.push([Math.cos(a) * r, Math.sin(a) * r, z]);
      }
      const head = (t * 0.35 + s / 6) % 1;
      items.push({ kind: "line", pts, stroke: "#3FA9E6", sw: 3.4, opacity: opacity * airflow * 0.85, progress: lerp(0.2, 1, head), bias: 900 });
    }
  }
  return items;
};

/** The Baltic Exchange (schematic block) — ghost or solid. */
export const balticExchange = (o: { opacity?: number; ghost?: number } = {}): Item[] => {
  const { opacity = 1, ghost = 0 } = o;
  const items: Item[] = [];
  const st = { fill: "#D9D1C2", stroke: ghost ? C.accent : mix("#D9D1C2", C.ink, 0.35), sw: ghost ? 1.2 : 0.8, opacity, fillOpacity: 1 - ghost, dash: ghost ? "5 4" : undefined };
  const p = (x: number, y: number, z: number): V3 => [x, y, z];
  const box = (x: number, y: number, w: number, d: number, h: number) => {
    const f: V3[][] = [
      [p(x, y, h), p(x + w, y, h), p(x + w, y + d, h), p(x, y + d, h)],
      [p(x, y + d, 0), p(x + w, y + d, 0), p(x + w, y + d, h), p(x, y + d, h)],
      [p(x + w, y, 0), p(x + w, y + d, 0), p(x + w, y + d, h), p(x + w, y, h)],
      [p(x, y, 0), p(x + w, y, 0), p(x + w, y, h), p(x, y, h)],
      [p(x, y, 0), p(x, y + d, 0), p(x, y + d, h), p(x, y, h)],
    ];
    f.forEach((pts) => items.push({ kind: "poly", pts, ...st }));
  };
  box(-34, -26, 68, 52, 24);
  box(-30, -22, 60, 44, 30);
  return items;
};
