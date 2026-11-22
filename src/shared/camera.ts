import { Cam, ease, lerp, V3 } from "../iso/engine";
import { Timeline } from "./timeline";

/** One camera setup per beat. drift = yaw radians/sec, zoom = scale change/sec. */
export type Shot = { yaw: number; scale: number; target: V3; drift?: number; zoom?: number };

const shotAt = (s: Shot, u: number, sx: number, sy: number): Cam => ({
  yaw: s.yaw + (s.drift ?? 0) * u,
  scale: s.scale * (1 + (s.zoom ?? 0) * u),
  target: s.target,
  sx,
  sy,
});

const blendCam = (a: Cam, b: Cam, k: number): Cam => ({
  yaw: lerp(a.yaw, b.yaw, k),
  scale: Math.exp(lerp(Math.log(a.scale), Math.log(b.scale), k)),
  target: [lerp(a.target[0], b.target[0], k), lerp(a.target[1], b.target[1], k), lerp(a.target[2], b.target[2], k)],
  sx: a.sx,
  sy: a.sy,
});

/** Camera that holds a shot per beat and eases into the next one at each beat change. */
export const makeCamAt =
  (shots: Record<string, Shot>, fallback: Shot = { yaw: 0, scale: 1.2, target: [0, 0, 0] }) =>
  (tl: Timeline, t: number, sx: number, sy: number): Cam => {
    const bs = tl.beats;
    const get = (id: string) => shots[id] ?? fallback;
    let i = 0;
    for (let k = 0; k < bs.length; k++) if (t >= bs[k].start - 0.35) i = k;
    const b = bs[i];
    const u = t - b.start;
    const cur = shotAt(get(b.id), Math.max(u, 0), sx, sy);
    if (i === 0) return cur;
    const p = bs[i - 1];
    const prev = shotAt(get(p.id), p.end - p.start + 0.8, sx, sy);
    return blendCam(prev, cur, ease((u + 0.35) / 1.5));
  };

/** Timing helpers for choreography inside worldAt. */
export const beatClock = (tl: Timeline, t: number) => {
  const T: Record<string, { s: number; e: number; d: number }> = {};
  for (const b of tl.beats) T[b.id] = { s: b.start, e: b.end, d: b.end - b.start };
  const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
  const has = (id: string) => id in T;
  return {
    T,
    /** 0..1 between (beat start + a) and (beat start + b), in seconds (0 if the beat was cut) */
    at: (id: string, a: number, b: number) => (has(id) ? clamp01((t - (T[id].s + a)) / (b - a)) : 0),
    /** 0..1 between fractions a and b of the beat's duration (0 if the beat was cut) */
    fr: (id: string, a: number, b: number) => (has(id) ? clamp01((t - (T[id].s + a * T[id].d)) / ((b - a) * T[id].d)) : 0),
    /** true from just before the beat starts, onwards; always false for a beat that was cut —
     *  so a range `since(a) && !since(b)` with a cut `b` runs to the end: re-point it to a kept beat. */
    since: (id: string) => (has(id) ? t >= T[id].s - 0.2 : false),
  };
};
