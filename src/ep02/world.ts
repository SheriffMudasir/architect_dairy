// Storyboard for episode 02 — the church's state is driven by a "year" that the
// beats animate (time-lapse, rewind, slow growth), all relative to the voice timing.
import { ease, ellipse as ell, Item, lerp, mix } from "../iso/engine";
import { crane, eixample, hill, people } from "../iso/models";
import { beatClock, makeCamAt, Shot } from "../shared/camera";
import { Timeline } from "../shared/timeline";
import { Tag, World } from "../shared/types";
import { C } from "../theme";
import { dimension, plasterModel, sagrada, sheets, street, tram, workshop } from "./models";

const SHOTS: Record<string, Shot> = {
  hook: { yaw: 0.05, scale: 3.45, target: [0, 0, 70], drift: 0.03, zoom: 0.01 },
  gaudi: { yaw: 0.25, scale: 4.86, target: [-25, 10, 15], drift: -0.03 },
  vision: { yaw: -0.15, scale: 4.05, target: [5, 0, 70], drift: 0.05 },
  lifetime: { yaw: 0.35, scale: 4.93, target: [-10, 25, 40], drift: -0.02 },
  tram: { yaw: 0.1, scale: 11.0, target: [104, -199, 2], drift: 0.012 },
  quarter: { yaw: 0.2, scale: 4.50, target: [-10, 10, 40], drift: 0.02 },
  fire: { yaw: -0.25, scale: 5.00, target: [-44, -44, 10], drift: 0.02 },
  puzzle: { yaw: 0.3, scale: 6.50, target: [-44, -44, 14], drift: 0.06 },
  money: { yaw: 0.1, scale: 3.26, target: [0, 0, 60], drift: 0.025 },
  permit: { yaw: -0.2, scale: 3.72, target: [0, 0, 55], drift: -0.02 },
  tower: { yaw: 0.15, scale: 4.00, target: [0, 0, 95], drift: 0.03 },
  montjuic: { yaw: 0.2, scale: 1.56, target: [-200, 130, 85], drift: 0.01 },
  centenary: { yaw: 0.4, scale: 4.32, target: [0, 0, 125], drift: 0.03 },
  outro: { yaw: -0.35, scale: 3.20, target: [40, 0, 55], drift: 0.03, zoom: -0.006 },
};

export const camAt = makeCamAt(SHOTS);

const PARKS: [number, number][] = [
  [0, 1],
  [0, -1],
];

export const worldAt = (tl: Timeline, t: number): World => {
  const { at, fr, since } = beatClock(tl, t);
  const items: Item[] = [];
  const tags: Tag[] = [];

  // ---------------- the year driving the church
  let year = 1882;
  if (!since("gaudi")) year = lerp(1882, 2026, ease(fr("hook", 0.3, 0.95)));
  else if (!since("vision")) year = lerp(2026, 1883, ease(at("gaudi", 0, 0.7))); // rewind
  else if (!since("lifetime")) year = lerp(1883, 1890, fr("vision", 0, 1));
  else if (!since("tram")) year = lerp(1890, 1926, ease(fr("lifetime", 0, 0.9)));
  else if (!since("puzzle")) year = 1926 + (since("fire") ? 10 : 0);
  else if (!since("money")) year = lerp(1936, 1976, ease(fr("puzzle", 0.2, 1)));
  else if (!since("permit")) year = lerp(1976, 2016, ease(fr("money", 0, 0.9)));
  else if (!since("tower")) year = 2019;
  else year = lerp(2019, 2026.2, ease(fr("tower", 0.05, 0.6)));

  // ---------------- city context: Eixample grid, parks either side
  const dim = since("tram") && !since("quarter") ? 0.55 : 1;
  const inTram = since("tram") && !since("quarter");
  items.push(
    ...eixample({
      radius: 3,
      opacity: 0.85 * dim,
      // during the tram scene, clear the row of blocks in front of Gran Via
      skip: (ix, iy) => (ix === 0 && iy === 0) || PARKS.some(([a, b]) => a === ix && b === iy) || (inTram && iy === -1 && ix >= -1 && ix <= 2),
    }),
  );
  // the church's own block
  items.push({ kind: "poly", ground: true, flat: true, pts: [[-56, -56, 0], [56, -56, 0], [56, 56, 0], [-56, 56, 0]], fill: C.site, opacity: 1 });
  for (const [ix, iy] of PARKS) {
    const cx = ix * 133;
    const cy = iy * 133;
    items.push({ kind: "poly", ground: true, flat: true, pts: [[cx - 56, cy - 56, 0], [cx + 56, cy - 56, 0], [cx + 56, cy + 56, 0], [cx - 56, cy + 56, 0]], fill: C.parkGround, opacity: dim });
    if (iy > 0) items.push({ kind: "poly", ground: true, flat: true, pts: ell(28, 16, 0.2, 20, cx + 10, cy + 8), fill: "#BCD3D6", stroke: "#8FB0B4", sw: 0.8, opacity: dim });
    for (let i = 0; i < 18; i++) {
      const a = i * 2.4;
      items.push({ kind: "dot", p: [cx + Math.cos(a) * (20 + (i % 3) * 12), cy + Math.sin(a) * (22 + (i % 4) * 8), 5], r: 4.2, fill: i % 2 ? C.tree : C.treeDark, stroke: mix(C.tree, C.ink, 0.4), sw: 0.6, opacity: dim });
    }
  }
  items.push(...people(26, 0.9 * dim, 5, [-60, 60, 70, 120]));

  // ---------------- the church
  const plan = since("vision") && !since("tram") ? (since("lifetime") ? lerp(1, 0.35, fr("lifetime", 0, 0.5)) : ease(fr("vision", 0.05, 0.25))) : 0;
  const planTowers = since("lifetime") ? 18 : Math.floor(lerp(0, 18.99, fr("vision", 0.2, 0.92)));
  const glory = since("outro") ? ease(fr("outro", 0.05, 0.4)) : !since("gaudi") ? 0.35 * fr("hook", 0.85, 1) : 0;
  const churchOpacity = since("tram") && !since("quarter") ? 0.4 : 1;
  items.push(...sagrada({ year, plan, planTowers, glory, opacity: churchOpacity, highlightJesus: since("tower") && !since("montjuic") ? fr("tower", 0.6, 0.8) : 0 }));

  // ---------------- cranes (from the 1980s)
  if (year > 1985) {
    const o = Math.min(1, (year - 1985) / 5) * (since("centenary") ? 0.7 : 1);
    items.push(...crane(34, 52, { h: 140, jib: 55, angle: 2.4 + t * 0.06, opacity: o }));
    items.push(...crane(-50, -42, { h: 150, jib: 60, angle: 0.6 - t * 0.05, opacity: o }));
    if (year > 2015) items.push(...crane(36, -48, { h: 195, jib: 65, angle: 1.9 + t * 0.04, opacity: o }));
  }

  // ---------------- beat-specific
  if (!since("gaudi")) {
    tags.push({ key: "yr", text: `${Math.floor(year)}`, at: [0, 0, 190], opacity: fr("hook", 0.32, 0.4) * (1 - fr("hook", 0.97, 1)), tone: "paper" });
    tags.push({ key: "unf", text: "STILL UNFINISHED", at: [62, 0, 130], opacity: fr("hook", 0.88, 0.97), tone: "accent" });
  }
  if (since("gaudi") && !since("vision")) {
    tags.push({ key: "rew", text: `◀◀ ${Math.floor(year)}`, at: [0, 0, 60], opacity: 1 - at("gaudi", 0.7, 1.1), tone: "accent" });
    tags.push({ key: "crypt", text: "CRYPT · 1882", at: [-32, 0, 38], opacity: at("gaudi", 0.8, 1.2) });
  }
  if (since("vision") && !since("lifetime")) {
    tags.push({ key: "n18", text: `${planTowers} / 18 TOWERS`, at: [0, 0, 185], opacity: fr("vision", 0.2, 0.3), tone: "accent" });
    if (planTowers >= 18) tags.push({ key: "jes", text: "JESUS", at: [0, 0, 176], opacity: fr("vision", 0.9, 1), tone: "paper", dy: -40 });
  }
  if (since("lifetime") && !since("tram")) {
    tags.push({ key: "nat", text: "NATIVITY FAÇADE", at: [0, 44, 60], opacity: fr("lifetime", 0.55, 0.65), tone: "paper" });
  }
  if (since("tram") && !since("quarter")) {
    items.push(...street(-199.5, -300, 400, 1));
    const pos = lerp(-120, 108, ease(fr("tram", 0.0, 0.32)));
    items.push(...tram(pos, -199.5 - 1.5, 1));
    // Gaudí on the crossing
    const hit = fr("tram", 0.28, 0.34);
    const gx = 116;
    const gy = -199.5 + 2.5 - hit * 2;
    items.push({ kind: "line", pts: [[gx, gy, 0], [gx, gy, 1.75 * (1 - hit * 0.9)]], stroke: C.ink, sw: 3, opacity: 1, bias: 30 });
    items.push({ kind: "dot", p: [gx, gy, 2.1 * (1 - hit * 0.9)], r: 0.45, fill: C.ink, opacity: 1, bias: 31 });
    if (hit > 0.5) items.push({ kind: "dot", p: [gx, gy, 0.6], r: 4 * (1 - fr("tram", 0.34, 0.5)), fill: C.accent, opacity: 0.4 * (1 - fr("tram", 0.34, 0.5)), bias: 10 });
    // passers-by
    items.push(...people(6, 1, 12, [98, 134, -192, -186]));
    tags.push({ key: "gv", text: "GRAN VIA", at: [70, -199.5, 1], opacity: fr("tram", 0.02, 0.12) * (1 - fr("tram", 0.4, 0.45)) });
    tags.push({ key: "beg", text: "“A BEGGAR?”", at: [122, -186, 6], opacity: fr("tram", 0.45, 0.55), tone: "paper", align: "left" });
    tags.push({ key: "died", text: "DIED · 10 JUNE 1926", at: [116, -199.5, 14], opacity: fr("tram", 0.8, 0.9), tone: "accent" });
  }
  if (since("fire") && !since("money")) {
    const fire = since("puzzle") ? 1 - at("puzzle", 0, 1.2) : ease(fr("fire", 0.3, 0.55));
    items.push(...workshop(-44, -44, { fire, t }));
    if (!since("puzzle")) items.push(...sheets(-44, -44, ease(fr("fire", 0.55, 0.85))));
    const smash = since("puzzle") ? 1 - ease(fr("puzzle", 0.12, 0.6)) : ease(fr("fire", 0.82, 0.95));
    if (smash < 1 || since("puzzle") || fr("fire", 0.8, 1) > 0) items.push(...plasterModel(-44, -20, smash));
    tags.push({ key: "ws", text: "GAUDÍ'S WORKSHOP", at: [-44, -44, 20], opacity: fr("fire", 0.1, 0.22) * (1 - fr("fire", 0.42, 0.47)) });
    if (since("puzzle")) tags.push({ key: "frag", text: "FRAGMENT BY FRAGMENT", at: [-44, -20, 44], opacity: fr("puzzle", 0.15, 0.25) * (1 - fr("puzzle", 0.58, 0.64)), tone: "accent" });
  }
  if (since("money") && !since("permit")) {
    tags.push({ key: "y", text: `${Math.floor(year)}`, at: [0, 0, 150], opacity: fr("money", 0.05, 0.12) * (1 - fr("money", 0.42, 0.47)), tone: "paper" });
  }
  if (since("tower") && !since("montjuic")) {
    tags.push({ key: "cr", text: "THE CROSS · 20 FEB 2026", at: [0, 0, 186], opacity: fr("tower", 0.45, 0.55) * (1 - fr("tower", 0.6, 0.64)), tone: "accent" });
  }
  if (since("montjuic") && !since("centenary")) {
    const k = ease(fr("montjuic", 0.05, 0.4));
    items.push(...hill(-430, 270, { rx: 190, ry: 130, h: 177 * k }));
    const ref = fr("montjuic", 0.35, 0.6);
    items.push({ kind: "line", pts: [[-430, 270, 177], [0, 0, 177]], stroke: C.accent, sw: 1.6, dash: "7 6", progress: ref, opacity: 1, bias: 400 });
    items.push(...dimension(-20, 20, 0, 172.5, C.ink, fr("montjuic", 0.5, 0.65)));
    tags.push({ key: "mj", text: "MONTJUÏC · ≈177 M", at: [-430, 270, 182], opacity: fr("montjuic", 0.3, 0.42), tone: "paper" });
    tags.push({ key: "jt", text: "172.5 M", at: [0, 0, 172.5], opacity: fr("montjuic", 0.55, 0.68), tone: "accent", align: "left" });
    tags.push({ key: "sch", text: "DISTANCE NOT TO SCALE", at: [-430, 270, 0], opacity: 0.8 * fr("montjuic", 0.3, 0.42), dy: 40 });
  }
  if (since("centenary") && !since("outro")) {
    tags.push({ key: "100", text: "10 JUNE 1926 → 10 JUNE 2026", at: [0, 0, 190], opacity: fr("centenary", 0.03, 0.12) * (1 - fr("centenary", 0.22, 0.27)), tone: "accent" });
  }
  if (since("outro")) {
    tags.push({ key: "glo", text: "GLORY FAÇADE · MAIN ENTRANCE", at: [62, 0, 140], opacity: fr("outro", 0.2, 0.32), tone: "accent" });
    tags.push({ key: "nb", text: "NEIGHBOURS' HOMES IN THE WAY", at: [133, 0, 30], opacity: fr("outro", 0.45, 0.58) });
    items.push({ kind: "line", ground: true, pts: [[77, -56, 0.3], [189, -56, 0.3], [189, 56, 0.3], [77, 56, 0.3], [77, -56, 0.3]], stroke: C.accent, sw: 2, dash: "8 6", progress: fr("outro", 0.42, 0.62), opacity: 1 });
  }
  return { items, tags };
};

