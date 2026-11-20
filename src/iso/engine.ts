// Tiny orthographic 3D -> SVG engine.
// World units are metres. z is up. The camera orbits (yaw) around a target
// and projects with a 2:1 dimetric ("isometric") projection, so line widths
// stay constant and everything reads like a crisp architectural diagram.

export type V3 = [number, number, number];

export type Cam = {
  yaw: number; // radians
  scale: number; // px per metre
  target: V3;
  sx: number; // screen x of target
  sy: number; // screen y of target
};

export type Poly = {
  kind: "poly";
  pts: V3[];
  fill: string; // base colour; shaded by orientation unless flat
  flat?: boolean;
  stroke?: string;
  sw?: number;
  opacity?: number;
  fillOpacity?: number;
  dash?: string;
  bias?: number; // depth bias
  ground?: boolean; // drawn in ground layer (under everything)
};

export type Line = {
  kind: "line";
  pts: V3[];
  stroke: string;
  sw?: number;
  opacity?: number;
  dash?: string;
  progress?: number; // 0..1 draw-on
  bias?: number;
  ground?: boolean;
  cap?: "round" | "butt";
};

export type Dot = {
  kind: "dot";
  p: V3;
  r: number; // metres
  fill: string;
  stroke?: string;
  sw?: number;
  opacity?: number;
  bias?: number;
};

export type Item = Poly | Line | Dot;

const COS30 = Math.cos(Math.PI / 6);
const ZF = 0.82; // vertical squash

export const rot = (p: V3, cam: Cam): V3 => {
  const x = p[0] - cam.target[0];
  const y = p[1] - cam.target[1];
  const c = Math.cos(cam.yaw);
  const s = Math.sin(cam.yaw);
  return [x * c - y * s, x * s + y * c, p[2] - cam.target[2]];
};

export const project = (p: V3, cam: Cam): [number, number] => {
  const [x, y, z] = rot(p, cam);
  return [
    cam.sx + (x - y) * COS30 * cam.scale,
    cam.sy + ((x + y) * 0.5 - z * ZF) * cam.scale,
  ];
};

const depthOf = (pts: V3[], cam: Cam) => {
  let d = 0;
  for (const p of pts) {
    const [x, y, z] = rot(p, cam);
    d += x + y + z * 0.9;
  }
  return d / pts.length;
};

// ---------- colour helpers ----------
const hex = (c: string) => {
  const h = c.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const toHex = (rgb: number[]) =>
  "#" +
  rgb
    .map((v) =>
      Math.max(0, Math.min(255, Math.round(v)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");
export const mix = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  return toHex(A.map((v, i) => v + (B[i] - v) * t));
};

const LIGHT: V3 = (() => {
  const l: V3 = [0.25, 0.55, 1];
  const n = Math.hypot(...l);
  return [l[0] / n, l[1] / n, l[2] / n];
})();

const shade = (pts: V3[], base: string, cam: Cam) => {
  // Newell normal on rotated coords
  const r = pts.map((p) => rot(p, cam));
  let nx = 0;
  let ny = 0;
  let nz = 0;
  for (let i = 0; i < r.length; i++) {
    const a = r[i];
    const b = r[(i + 1) % r.length];
    nx += (a[1] - b[1]) * (a[2] + b[2]);
    ny += (a[2] - b[2]) * (a[0] + b[0]);
    nz += (a[0] - b[0]) * (a[1] + b[1]);
  }
  const n = Math.hypot(nx, ny, nz) || 1;
  nx /= n;
  ny /= n;
  nz /= n;
  // face the viewer
  if (nx + ny + nz * 1.2 < 0) {
    nx = -nx;
    ny = -ny;
    nz = -nz;
  }
  const d = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2];
  // d ~ 1 for tops, lower for sides
  if (d > 0.8) return mix(base, "#ffffff", (d - 0.8) * 0.6);
  return mix(base, "#1a1a1a", (0.8 - d) * 0.42);
};

// ---------- polyline truncation for draw-on ----------
const len3 = (a: V3, b: V3) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
export const truncate = (pts: V3[], t: number): V3[] => {
  if (t >= 1) return pts;
  if (t <= 0) return [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += len3(pts[i - 1], pts[i]);
  let left = total * t;
  const out: V3[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const l = len3(pts[i - 1], pts[i]);
    if (l >= left) {
      const k = l === 0 ? 0 : left / l;
      const a = pts[i - 1];
      const b = pts[i];
      out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]);
      return out;
    }
    left -= l;
    out.push(pts[i]);
  }
  return out;
};

// ---------- render list ----------
export type Drawable = {
  key: string;
  depth: number;
  ground: boolean;
  el:
    | { t: "path"; d: string; fill: string; stroke: string; sw: number; opacity: number; fillOpacity: number; dash?: string; cap: string }
    | { t: "circle"; cx: number; cy: number; r: number; fill: string; stroke: string; sw: number; opacity: number };
};

export const compile = (items: Item[], cam: Cam): Drawable[] => {
  const out: Drawable[] = [];
  items.forEach((it, i) => {
    if ((it.opacity ?? 1) <= 0.003) return;
    if (it.kind === "poly") {
      const p2 = it.pts.map((p) => project(p, cam));
      const d = "M" + p2.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join("L") + "Z";
      out.push({
        key: "p" + i,
        depth: depthOf(it.pts, cam) + (it.bias ?? 0),
        ground: !!it.ground,
        el: {
          t: "path",
          d,
          fill: it.fill === "none" ? "none" : it.flat ? it.fill : shade(it.pts, it.fill, cam),
          stroke: it.stroke ?? "none",
          sw: it.sw ?? 1.6,
          opacity: it.opacity ?? 1,
          fillOpacity: it.fillOpacity ?? 1,
          dash: it.dash,
          cap: "round",
        },
      });
    } else if (it.kind === "line") {
      const pts = truncate(it.pts, it.progress ?? 1);
      if (pts.length < 2) return;
      const p2 = pts.map((p) => project(p, cam));
      const d = "M" + p2.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join("L");
      out.push({
        key: "l" + i,
        depth: depthOf(it.pts, cam) + (it.bias ?? 0),
        ground: !!it.ground,
        el: {
          t: "path",
          d,
          fill: "none",
          stroke: it.stroke,
          sw: it.sw ?? 1.6,
          opacity: it.opacity ?? 1,
          fillOpacity: 1,
          dash: it.dash,
          cap: it.cap ?? "round",
        },
      });
    } else {
      const [cx, cy] = project(it.p, cam);
      out.push({
        key: "d" + i,
        depth: depthOf([it.p], cam) + (it.bias ?? 0),
        ground: false,
        el: {
          t: "circle",
          cx,
          cy,
          r: it.r * cam.scale,
          fill: it.fill,
          stroke: it.stroke ?? "none",
          sw: it.sw ?? 1.4,
          opacity: it.opacity ?? 1,
        },
      });
    }
  });
  const ground = out.filter((d) => d.ground);
  const rest = out.filter((d) => !d.ground).sort((a, b) => a.depth - b.depth);
  return [...ground, ...rest];
};

// ---------- geometry helpers ----------
export const ellipse = (rx: number, ry: number, z: number, n: number, cx = 0, cy = 0, a0 = 0): V3[] =>
  Array.from({ length: n }, (_, i) => {
    const a = a0 + (i / n) * Math.PI * 2;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, z] as V3;
  });

export const close = (pts: V3[]): V3[] => [...pts, pts[0]];

/** Axis-aligned box as 6 faces (only the ones that can face the viewer matter, but we emit all). */
export const box = (
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  h: number,
  style: Omit<Poly, "kind" | "pts">,
): Poly[] => {
  const p = (dx: number, dy: number, dz: number): V3 => [x + dx, y + dy, z + dz];
  const faces: V3[][] = [
    [p(0, 0, h), p(w, 0, h), p(w, d, h), p(0, d, h)], // top
    [p(0, d, 0), p(w, d, 0), p(w, d, h), p(0, d, h)], // +y
    [p(w, 0, 0), p(w, d, 0), p(w, d, h), p(w, 0, h)], // +x
    [p(0, 0, 0), p(w, 0, 0), p(w, 0, h), p(0, 0, h)], // -y
    [p(0, 0, 0), p(0, d, 0), p(0, d, h), p(0, 0, h)], // -x
  ];
  return faces.map((pts) => ({ kind: "poly" as const, pts, ...style }));
};

/** Wall strip between two parallel closed rings (same vertex count). */
export const band = (a: V3[], b: V3[], style: Omit<Poly, "kind" | "pts">): Poly[] =>
  a.map((_, i) => {
    const j = (i + 1) % a.length;
    return { kind: "poly" as const, pts: [a[i], a[j], b[j], b[i]], ...style };
  });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
export const ease = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

/** Deterministic PRNG */
export const rng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
