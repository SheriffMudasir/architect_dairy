// Storyboard for episode 6 (cinematic look) — the 3D carries two things: the Dessau Bauhaus
// assembling itself (pinwheel plan, glass workshop wing, bridge, studio tower), and the maps:
// Weimar → Dessau → Berlin, then the teachers' routes out of Germany.
import { box, ease, ellipse, Item, lerp, V3 } from "../iso/engine";
import { beatClock, makeCamAt, Shot } from "../shared/camera";
import { Timeline } from "../shared/timeline";
import { Tag, World } from "../shared/types";
import { C } from "../theme";

const PLATE = "#2B2825";
const WHITE = "#EDEAE3";
const GLASS = "#8FB3C9";
const RED = "#D8402E";
const YELLOW = "#F2C230";
const BLUE = "#2350A8";

const SHOTS: Record<string, Shot> = {
  hook: { yaw: 2.4, scale: 9, target: [10, 10, 8], drift: 0.03 },
  stakes: { yaw: 2.4, scale: 9, target: [10, 10, 8], drift: 0.03 },
  test: { yaw: 0.5, scale: 9, target: [10, 10, 8], drift: 0.03 },
  dessau: { yaw: 2.4, scale: 9.5, target: [10, 8, 6], drift: 0.05, zoom: 0.01 },
  nazis: { yaw: 0.0, scale: 26, target: [12.4 * 12, -51.8 * 12, 0], drift: 0.004 },
  twist: { yaw: 0.0, scale: 6.2, target: [-26 * 1.15, -44 * 1.15, 0], drift: 0.003 },
  spread: { yaw: 0.0, scale: 6.2, target: [-26 * 1.15, -44 * 1.15, 0], drift: 0.003 },
};

export const camAt = makeCamAt(SHOTS, { yaw: 2.4, scale: 9, target: [10, 10, 8], drift: 0.03 });

// ---------------- the Dessau building (metres, approximate)

/** Glass curtain wall: a box face of glass with a mullion grid. */
const curtain = (x0: number, y: number, z0: number, w: number, h: number, o: number): Item[] => {
  const items: Item[] = [{ kind: "poly", flat: true, pts: [[x0, y, z0], [x0 + w, y, z0], [x0 + w, y, z0 + h], [x0, y, z0 + h]], fill: GLASS, fillOpacity: 0.75, stroke: C.ink, sw: 0.8, opacity: o, bias: 1 }];
  for (let x = x0 + 2.5; x < x0 + w; x += 2.5) items.push({ kind: "line", pts: [[x, y - 0.02, z0], [x, y - 0.02, z0 + h]], stroke: "#45606F", sw: 0.6, opacity: o, bias: 2 });
  for (let z = z0 + 3.4; z < z0 + h; z += 3.4) items.push({ kind: "line", pts: [[x0, y - 0.02, z], [x0 + w, y - 0.02, z]], stroke: "#45606F", sw: 0.8, opacity: o, bias: 2 });
  return items;
};

/** Ribbon windows on a white wing. */
const ribbons = (x0: number, y: number, w: number, floors: number, o: number): Item[] => {
  const items: Item[] = [];
  for (let f = 0; f < floors; f++) {
    const z = 1.2 + f * 3.4;
    items.push({ kind: "poly", flat: true, pts: [[x0 + 1, y - 0.03, z], [x0 + w - 1, y - 0.03, z], [x0 + w - 1, y - 0.03, z + 1.4], [x0 + 1, y - 0.03, z + 1.4]], fill: "#3B4A55", opacity: o, bias: 2 });
  }
  return items;
};

type DessauOpts = { workshop: number; bridge: number; school: number; link: number; tower: number; glass: number; glow: number };

const dessau = ({ workshop, bridge, school, link, tower, glass, glow }: DessauOpts): Item[] => {
  const items: Item[] = [];
  const st = { stroke: C.ink, sw: 1 };
  const win = glow > 0 ? "#F6D27A" : GLASS;
  // site plate + road under the bridge
  items.push({ kind: "poly", ground: true, flat: true, pts: [[-45, -30, 0], [75, -30, 0], [75, 60, 0], [-45, 60, 0]], fill: PLATE, opacity: 1 });
  items.push({ kind: "poly", ground: true, flat: true, pts: [[-45, 14, 0.01], [75, 14, 0.01], [75, 22, 0.01], [-45, 22, 0.01]], fill: "#1D1B19", opacity: 1 });
  for (let x = -40; x < 75; x += 8) items.push({ kind: "line", ground: true, pts: [[x, 18, 0.02], [x + 4, 18, 0.02]], stroke: "#6B655D", sw: 1, opacity: 1 });
  // 1. workshop wing: 4 storeys, glass curtain wall on the street side
  if (workshop > 0) {
    const h = 14 * workshop;
    items.push(...box(-25, -10, 0, 44, 20, h, { fill: WHITE, ...st }));
    if (glass > 0 && workshop >= 1) items.push(...curtain(-25, -10.05, 1, 44 * glass, 12.5, 1));
    if (glow > 0) items.push({ kind: "poly", flat: true, pts: [[-25, -10.1, 1], [19, -10.1, 1], [19, -10.1, 13.5], [-25, -10.1, 13.5]], fill: win, fillOpacity: 0.85 * glow, opacity: 1, bias: 3 });
  }
  // 2. the bridge over the road (2 storeys on piers) to the vocational school
  if (bridge > 0) {
    const len = 26 * bridge;
    items.push(...box(-22, 10, 6.5, 16, len, 6.5, { fill: WHITE, ...st }));
    items.push(...ribbons(-22, 10, 16, 0, 1));
    for (const px of [-20, -9]) items.push(...box(px, 23, 0, 1, 1, 6.5, { fill: WHITE, ...st }));
  }
  // 3. vocational school wing (3 storeys)
  if (school > 0) {
    items.push(...box(-32, 36, 0, 34, 14, 11 * school, { fill: WHITE, ...st }));
    if (school >= 1) items.push(...ribbons(-32, 36, 34, 3, 1));
  }
  // 4. low link: auditorium + canteen
  if (link > 0) {
    items.push(...box(19, -6, 0, 26 * link, 12, 5, { fill: WHITE, ...st }));
    if (link >= 1) items.push(...ribbons(19, -6, 26, 1, 1));
  }
  // 5. the studio tower (Prellerhaus), 5 storeys with little balconies
  if (tower > 0) {
    const h = 18 * tower;
    items.push(...box(45, -12, 0, 12, 22, h, { fill: WHITE, ...st }));
    if (tower >= 1)
      for (let f = 1; f < 5; f++)
        for (let k = 0; k < 4; k++) {
          items.push(...box(43.4, -10 + k * 5.4, f * 3.5, 1.6, 2.4, 0.25, { fill: WHITE, stroke: C.ink, sw: 0.6 }));
          if (glow > 0) items.push({ kind: "poly", flat: true, pts: [[44.98, -10 + k * 5.4, f * 3.5 + 0.6], [44.98, -7.8 + k * 5.4, f * 3.5 + 0.6], [44.98, -7.8 + k * 5.4, f * 3.5 + 2.6], [44.98, -10 + k * 5.4, f * 3.5 + 2.6]], fill: "#F6D27A", opacity: glow * (((f + k) % 3) > 0 ? 1 : 0.3), bias: 3 });
        }
  }
  return items;
};

// ---------------- maps

const CITY: Record<string, [number, number]> = {
  weimar: [11.33, 50.98],
  dessau: [12.24, 51.84],
  berlin: [13.4, 52.52],
  harvard: [-71.12, 42.37],
  chicago: [-87.63, 41.88],
  blackmtn: [-82.32, 35.62],
  telaviv: [34.78, 32.08],
};
// equirectangular, x = east, y = south (so north is "up" on screen at yaw 0)
const geo = (c: [number, number], k: number): V3 => [c[0] * k, -c[1] * k, 0];

const arc = (a: V3, b: V3, lift: number, u: number): V3[] => {
  const pts: V3[] = [];
  const n = 40;
  for (let i = 0; i <= Math.round(n * u); i++) {
    const s = i / n;
    pts.push([lerp(a[0], b[0], s), lerp(a[1], b[1], s), Math.sin(s * Math.PI) * lift]);
  }
  return pts;
};

// ---------------- storyboard

export const worldAt = (tl: Timeline, t: number): World => {
  const { fr, since } = beatClock(tl, t);
  const items: Item[] = [];
  const tags: Tag[] = [];
  const between = (a: string, b: string) => since(a) && !since(b);

  // ---- maps
  const germany = between("nazis", "raid");
  const world = between("twist", "payoff");
  if (germany) {
    const k = 12;
    items.push({ kind: "poly", ground: true, flat: true, pts: ellipse(30, 22, 0, 40, 12.3 * k - 136, -51.8 * k + 620), fill: PLATE, opacity: 0 });
    const W = geo(CITY.weimar, k);
    const D = geo(CITY.dessau, k);
    const B = geo(CITY.berlin, k);
    const lineIn = ease(fr("nazis", 0.1, 0.4));
    items.push({ kind: "line", pts: arc(W, D, 2, 1), stroke: "#8A857C", sw: 2, dash: "6 6", opacity: 0.8 });
    if (lineIn > 0) items.push({ kind: "line", pts: arc(D, B, 3, lineIn), stroke: RED, sw: 4, opacity: 1, bias: 3 });
    for (const [key, p, col] of [["W", W, "#8A857C"], ["D", D, YELLOW], ["B", B, RED]] as const)
      items.push({ kind: "dot", p, r: key === "B" ? 0.9 * Math.min(1, lineIn * 1.5 + 0.0001) || 0.001 : 0.7, fill: col, stroke: "#000", sw: 1, opacity: key === "B" ? Math.min(1, lineIn * 2) : 1, bias: 4 });
    tags.push({ key: "w", text: "WEIMAR 1919", at: W, opacity: 0.8, tone: "paper", align: "left" });
    tags.push({ key: "d", text: "DESSAU 1925", at: D, opacity: 1, tone: "paper", align: "left" });
    tags.push({ key: "b", text: "BERLIN 1932", at: B, opacity: Math.min(1, lineIn * 2), tone: "accent", align: "left" });
  } else if (world) {
    const k = 1.15;
    const DE = geo(CITY.berlin, k);
    const dests: [string, string, string][] = [
      ["harvard", "HARVARD · GROPIUS", RED],
      ["chicago", "CHICAGO · MIES", BLUE],
      ["blackmtn", "BLACK MOUNTAIN · ALBERS", YELLOW],
      ["telaviv", "TEL AVIV", WHITE],
    ];
    // a faint graticule so the map reads as a map
    for (let lat = 20; lat <= 60; lat += 10) items.push({ kind: "line", ground: true, pts: [geo([-100, lat], k), geo([45, lat], k)], stroke: "#4C4741", sw: 1.4, opacity: 1 });
    for (let lon = -100; lon <= 45; lon += 15) items.push({ kind: "line", ground: true, pts: [geo([lon, 20], k), geo([lon, 60], k)], stroke: "#4C4741", sw: 1.4, opacity: 1 });
    items.push({ kind: "dot", p: DE, r: 1.4, fill: RED, stroke: "#000", sw: 1, opacity: 1, bias: 4 });
    tags.push({ key: "de", text: "GERMANY", at: DE, opacity: 1, tone: "accent", align: "right" });
    dests.forEach(([key, label, col], i) => {
      const u = since("spread") ? ease(fr("spread", 0.0 + i * 0.05, 0.25 + i * 0.05)) : since("twist") ? ease(fr("twist", 0.15, 0.35)) * 0.12 : 0;
      if (u <= 0) return;
      const P = geo(CITY[key], k);
      items.push({ kind: "line", pts: arc(DE, P, key === "telaviv" ? 8 : 22, u), stroke: col, sw: 3.5, opacity: 1, bias: 3 });
      if (u >= 0.99) {
        items.push({ kind: "dot", p: P, r: 1.2, fill: col, stroke: "#000", sw: 1, opacity: 1, bias: 4 });
        tags.push({ key, text: label, at: P, opacity: 1, tone: "paper", align: key === "telaviv" ? "right" : "left", dy: i === 2 ? 34 : 0 });
      }
    });
  } else {
    // ---- the Dessau building: assembles during "dessau", glows at night in the hook
    const a = (from: number, to: number) => (since("dessau") ? ease(fr("dessau", from, to)) : 1);
    const assembling = between("dessau", "chair");
    const glowHook = between("hook", "weimar") ? 1 : 0;
    items.push(
      ...dessau({
        workshop: assembling ? a(0.0, 0.25) : 1,
        glass: assembling ? a(0.55, 0.85) : 1,
        bridge: assembling ? a(0.2, 0.42) : 1,
        school: assembling ? a(0.3, 0.5) : 1,
        link: assembling ? a(0.38, 0.55) : 1,
        tower: assembling ? a(0.45, 0.65) : 1,
        glow: glowHook,
      }),
    );
    if (assembling) {
      tags.push({ key: "gl", text: "GLASS CURTAIN WALL", at: [-3, -10, 15], opacity: fr("dessau", 0.7, 0.82), tone: "accent" });
      tags.push({ key: "br", text: "BRIDGE OVER THE ROAD", at: [-14, 18, 14], opacity: fr("dessau", 0.35, 0.45) * (1 - fr("dessau", 0.66, 0.72)), tone: "paper" });
      tags.push({ key: "tw", text: "STUDENT STUDIOS", at: [51, -1, 20], opacity: fr("dessau", 0.55, 0.65) * (1 - fr("dessau", 0.66, 0.72)), tone: "paper" });
    }
  }

  return { items, tags };
};
