// Storyboard for episode 4 — a diagram stage: her legacy on a plinth, four executor pillars,
// the firm and the foundation, and money flowing between them. Photo/letters beats cover the rest.
import { box, ease, ellipse, Item, lerp } from "../iso/engine";
import { people } from "../iso/models";
import { beatClock, makeCamAt, Shot } from "../shared/camera";
import { Timeline } from "../shared/timeline";
import { Tag, World } from "../shared/types";
import { C } from "../theme";

const SHOTS: Record<string, Shot> = {
  hook: { yaw: 0.3, scale: 7.5, target: [0, 0, 14], drift: 0.02 },
  stakes: { yaw: 0.3, scale: 7.5, target: [0, 0, 14], drift: 0.02 },
  death: { yaw: 0.3, scale: 7.5, target: [0, 0, 14], drift: 0.02 },
  will: { yaw: 0.25, scale: 8.5, target: [0, 0, 12], drift: 0.05 },
  four: { yaw: -0.2, scale: 9.0, target: [0, 0, 12], drift: 0.04 },
  court: { yaw: 0.1, scale: 8.0, target: [0, 0, 12], drift: 0.02 },
  split: { yaw: 0.0, scale: 7.6, target: [0, 0, 12], drift: 0.03 },
  claims: { yaw: 0.15, scale: 7.2, target: [0, 0, 18], drift: 0.02 },
  settled: { yaw: 0.45, scale: 6.6, target: [10, 0, 12], drift: 0.04 },
  tragedy: { yaw: 0.45, scale: 6.4, target: [10, 0, 14], drift: 0.02 },
  royalty: { yaw: 0.3, scale: 6.4, target: [0, 0, 14], drift: 0.04 },
  total: { yaw: 0.2, scale: 6.2, target: [0, 0, 16], drift: 0.03 },
  hc2024: { yaw: -0.1, scale: 6.6, target: [0, 0, 14], drift: 0.03 },
  appeal: { yaw: 0.35, scale: 6.6, target: [0, 0, 14], drift: -0.03 },
  supreme: { yaw: 0.2, scale: 6.8, target: [0, 0, 16], drift: 0.02 },
  rename: { yaw: 0.2, scale: 6.8, target: [0, 0, 16], drift: 0.02 },
  irony: { yaw: 0.1, scale: 7.2, target: [-20, 0, 14], drift: 0.03 },
  question: { yaw: 0.1, scale: 6.8, target: [0, 0, 14], drift: 0.02 },
};

export const camAt = makeCamAt(SHOTS);

const FIRM: [number, number] = [-34, 0]; // x, y centre
const FOUND: [number, number] = [34, 0];
// the four executor pillars around the legacy plinth: Schumacher, Rana Hadid, Palumbo, Clarke
const PILLARS: { key: string; name: string; at: [number, number] }[] = [
  { key: "ps", name: "SCHUMACHER", at: [-11, -11] },
  { key: "rh", name: "R. HADID", at: [11, -11] },
  { key: "pp", name: "PALUMBO", at: [11, 11] },
  { key: "bc", name: "CLARKE", at: [-11, 11] },
];

export const worldAt = (tl: Timeline, t: number): World => {
  const { fr, since } = beatClock(tl, t);
  const items: Item[] = [];
  const tags: Tag[] = [];

  // ground: a round plaza and a few people for scale
  items.push({ kind: "poly", ground: true, flat: true, pts: ellipse(62, 40, 0, 48), fill: C.site, opacity: 1 });
  items.push(...people(14, 0.8, 4, [-55, 55, 26, 38]));

  // ---- the legacy plinth: a low curved slab with a ribbon roof (a nod to her forms)
  const plinth = ellipse(7, 7, 0, 24);
  items.push({ kind: "poly", flat: true, pts: plinth.map(([x, y]) => [x, y, 2] as [number, number, number]), fill: C.massTop, stroke: C.ink, sw: 1, opacity: 1 });
  for (let i = 0; i < plinth.length; i++) {
    const a = plinth[i];
    const b = plinth[(i + 1) % plinth.length];
    items.push({ kind: "poly", pts: [[a[0], a[1], 0], [b[0], b[1], 0], [b[0], b[1], 2], [a[0], a[1], 2]], fill: C.mass, opacity: 1 });
  }
  const legacyTag = since("will") && !since("split");
  if (legacyTag) tags.push({ key: "lg", text: "HER LEGACY", at: [0, 0, 6], opacity: fr("will", 0.2, 0.4), tone: "paper" });

  // ---- four executor pillars
  const rise = since("will") ? ease(fr("will", 0.15, 0.85)) : 0;
  let splitT = 0;
  if (since("split")) splitT = ease(fr("split", 0.05, 0.4));
  if (since("settled")) splitT = 1 - ease(fr("settled", 0.0, 0.3));
  const fadePillars = since("royalty") ? 1 - ease(fr("royalty", 0, 0.25)) : 1;
  PILLARS.forEach((p, i) => {
    const appear = since("four") ? 1 : rise;
    const r = Math.max(0, Math.min(1, appear * 1.6 - i * 0.2));
    if (r <= 0 || fadePillars <= 0) return;
    const isPS = i === 0;
    // in the split, Schumacher goes left, the other three gather right
    const tx = isPS ? lerp(p.at[0], -26, splitT) : lerp(p.at[0], 18 + (i - 2) * 6, splitT);
    const ty = isPS ? lerp(p.at[1], 0, splitT) : lerp(p.at[1], (i - 2) * 9, splitT);
    const h = 22 * r;
    const fill = isPS && since("split") ? C.accent : C.mass;
    items.push(...box(tx - 2.2, ty - 2.2, 0, 4.4, 4.4, h, { fill, stroke: C.ink, sw: 1, opacity: fadePillars }));
    // names only once the person cards have gone (from the split on)
    if (isPS && since("split") && !since("royalty"))
      tags.push({ key: p.key, text: p.name, at: [tx, ty, h + 3], opacity: fadePillars, tone: "accent" });
  });
  if (since("split") && !since("settled")) {
    tags.push({ key: "v3", text: "THE OTHER THREE", at: [20, 0, 27], opacity: fr("split", 0.3, 0.42), tone: "ink" });
    tags.push({ key: "vs", text: "VS", at: [-6, 0, 4], opacity: fr("split", 0.35, 0.5), tone: "paper" });
  }

  // ---- the firm (left) and the foundation (right) appear from the settlement on
  const blocks = since("settled") ? ease(fr("settled", 0.1, 0.45)) : 0;
  const rename = since("rename") ? ease(fr("rename", 0.2, 0.6)) : 0;
  const labels = since("irony") ? 0 : 1; // no floating labels over the closing portrait
  if (blocks > 0) {
    // firm: a stepped tower with a sweeping top
    const fh = 26 * blocks;
    items.push(...box(FIRM[0] - 8, FIRM[1] - 6, 0, 16, 12, fh, { fill: C.mass, stroke: C.ink, sw: 1.1 }));
    items.push(...box(FIRM[0] - 5, FIRM[1] - 4, fh, 10, 8, 8 * blocks, { fill: C.massTop, stroke: C.ink, sw: 1 }));
    // foundation: a broad low museum block
    items.push(...box(FOUND[0] - 10, FOUND[1] - 8, 0, 20, 16, 14 * blocks, { fill: C.stone, stroke: C.ink, sw: 1.1 }));
    const firmName = rename > 0.5 ? "ZHA" : "ZAHA HADID ARCHITECTS";
    tags.push({ key: "firm", text: since("supreme") || rename > 0 ? firmName : "THE FIRM", at: [FIRM[0], FIRM[1], fh + 12], opacity: blocks * labels, tone: since("royalty") ? "ink" : "paper" });
    tags.push({ key: "fnd", text: "ZAHA HADID FOUNDATION", at: [FOUND[0], FOUND[1], 18], opacity: blocks * labels, tone: "paper" });
  }

  // ---- money: dots flowing along an arc
  const arc = (u: number, from: [number, number], to: [number, number], z0: number, z1: number, lift: number): [number, number, number] => [
    lerp(from[0], to[0], u),
    lerp(from[1], to[1], u),
    lerp(z0, z1, u) + Math.sin(u * Math.PI) * lift,
  ];
  const flow = (n: number, from: [number, number], to: [number, number], z0: number, z1: number, lift: number, op: number, color: string, speed = 0.35) => {
    if (op <= 0) return;
    for (let k = 0; k < n; k++) {
      const u = (t * speed + k / n) % 1;
      items.push({ kind: "dot", p: arc(u, from, to, z0, z1, lift), r: 1.1, fill: color, stroke: C.ink, sw: 0.6, opacity: op * Math.min(1, u * 6, (1 - u) * 6) });
    }
  };
  // settlement: the estate goes from the plinth to the foundation
  if (since("settled") && !since("royalty")) flow(10, [0, 0], FOUND, 3, 15, 10, fr("settled", 0.3, 0.45), C.ginkgo);
  // the licence: 6% from the firm to the foundation, stopping at the appeal
  let royalty = 0;
  if (since("royalty")) royalty = ease(fr("royalty", 0.3, 0.55));
  if (since("appeal")) royalty = 1 - ease(fr("appeal", 0.3, 0.55));
  flow(since("total") ? 16 : 9, FIRM, FOUND, 20, 15, 16, royalty, C.accent, since("total") ? 0.55 : 0.35);
  if (royalty > 0.01) tags.push({ key: "6", text: "6% OF INCOME", at: [0, 0, 36], opacity: royalty * fr("royalty", 0.45, 0.6), tone: "accent" });
  if (since("appeal") && !since("rename")) tags.push({ key: "stop", text: "LICENCE ENDED", at: [0, 0, 36], opacity: fr("appeal", 0.5, 0.62), tone: "ink" });

  // a lone pillar returns for the irony beat
  if (since("irony")) {
    const r = ease(fr("irony", 0, 0.3));
    items.push(...box(-24 - 2.2, -12 - 2.2, 0, 4.4, 4.4, 22 * r, { fill: C.accent, stroke: C.ink, sw: 1 }));
  }

  return { items, tags };
};
