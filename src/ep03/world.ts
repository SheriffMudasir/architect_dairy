// Storyboard for episode 3 — the 3D engine carries the explanation between AI clips/stills.
import { ease, ellipse, Item, lerp } from "../iso/engine";
import { people } from "../iso/models";
import { beatClock, makeCamAt, Shot } from "../shared/camera";
import { Timeline } from "../shared/timeline";
import { Tag, World } from "../shared/types";
import { C } from "../theme";
import { balticExchange, gherkin, radiusAt } from "./models";

const SHOTS: Record<string, Shot> = {
  hook: { yaw: 0.1, scale: 5.80, target: [0, 0, 95], drift: 0.03 },
  name: { yaw: 0.2, scale: 5.80, target: [0, 0, 95], drift: 0.03 },
  problem: { yaw: 0.3, scale: 5.80, target: [0, 0, 95], drift: 0.03 },
  question: { yaw: 0.0, scale: 5.93, target: [0, 0, 92], drift: 0.06 },
  diagrid: { yaw: -0.3, scale: 6.07, target: [0, 0, 92], drift: 0.05 },
  flat: { yaw: 0.25, scale: 7.18, target: [0, 0, 80], drift: -0.03 },
  angle: { yaw: 0.6, scale: 12.00, target: [20, 18, 66], drift: 0.02 },
  glass: { yaw: 0.3, scale: 5.80, target: [0, 0, 92], drift: 0.03 },
  lens: { yaw: 0.2, scale: 11.00, target: [0, 0, 172], drift: 0.05 },
  spirals: { yaw: -0.2, scale: 5.93, target: [0, 0, 92], drift: 0.08 },
  energy: { yaw: 0.1, scale: 5.80, target: [0, 0, 92], drift: 0.03 },
  site: { yaw: 0.35, scale: 6.90, target: [0, 0, 40], drift: -0.02 },
  climax: { yaw: 0.2, scale: 5.80, target: [0, 0, 92], drift: 0.03 },
  outro: { yaw: -0.1, scale: 5.66, target: [0, 0, 94], drift: 0.07, zoom: -0.01 },
};

export const camAt = makeCamAt(SHOTS);

export const worldAt = (tl: Timeline, t: number): World => {
  const { fr, since } = beatClock(tl, t);
  const items: Item[] = [];
  const tags: Tag[] = [];

  // plaza + people for scale
  items.push({ kind: "poly", ground: true, flat: true, pts: ellipse(70, 70, 0, 40), fill: C.site, opacity: 1 });
  items.push({ kind: "line", ground: true, pts: [...ellipse(70, 70, 0, 40), ellipse(70, 70, 0, 40)[0]], stroke: C.accent, sw: 1.2, dash: "8 6", opacity: 0.8 });
  items.push(...people(26, 1, 3, [-60, 60, 34, 66]));

  // ---------------- state of the tower per beat
  let rise = 1;
  let facets = 1;
  let diagrid = 1;
  let spirals = 0.55;
  let ghost = 0;
  let lens = 0;
  let airflow = 0;
  let highlightRow = -1;
  let opacity = 1;

  if (since("question") && !since("diagrid")) {
    ghost = ease(fr("question", 0.1, 0.4));
    tags.push({ key: "eye", text: "WHAT YOUR EYE SEES: A CURVE", at: [0, 0, 186], opacity: fr("question", 0.3, 0.45), tone: "accent" });
  }
  if (since("diagrid") && !since("flat")) {
    facets = 0;
    spirals = 0;
    diagrid = ease(fr("diagrid", 0.36, 0.62));
    tags.push({ key: "dg", text: "DIAGRID · DIAGONAL STEEL", at: [0, 0, 186], opacity: fr("diagrid", 0.4, 0.5) * (1 - fr("diagrid", 0.62, 0.66)), tone: "paper" });
  }
  if (since("flat") && !since("angle")) {
    spirals = 0;
    facets = ease(fr("flat", 0.0, 0.55));
    tags.push({ key: "fl", text: "EVERY PANE IS FLAT", at: [radiusAt(80) + 2, 0, 80], opacity: fr("flat", 0.25, 0.4), tone: "accent", align: "left" });
  }
  if (since("angle") && !since("glass")) {
    spirals = 0;
    highlightRow = 9;
    tags.push({ key: "p1", text: "FLAT", at: [18, 20, 70], opacity: fr("angle", 0.1, 0.25), tone: "paper", align: "right" });
    tags.push({ key: "p2", text: "TILTED A TOUCH", at: [26, 9, 64], opacity: fr("angle", 0.35, 0.5), tone: "accent", align: "left" });
  }
  if (since("lens") && !since("spirals")) {
    lens = ease(fr("lens", 0.0, 0.15));
    tags.push({ key: "ln", text: "THE ONLY CURVED GLASS", at: [0, 0, 182], opacity: fr("lens", 0.03, 0.12) * (1 - fr("lens", 0.14, 0.18)), tone: "accent" });
  }
  if (since("spirals") && !since("energy")) {
    spirals = lerp(0.55, 1, ease(fr("spirals", 0, 0.25)));
    airflow = ease(fr("spirals", 0.15, 0.4));
    tags.push({ key: "sp", text: "6 LIGHT WELLS", at: [0, 0, 186], opacity: fr("spirals", 0.08, 0.2) * (1 - fr("spirals", 0.5, 0.56)), tone: "paper" });
    tags.push({ key: "air", text: "DAYLIGHT + FRESH AIR", at: [radiusAt(110), 0, 110], opacity: fr("spirals", 0.3, 0.42) * (1 - fr("spirals", 0.5, 0.56)), tone: "accent", align: "left" });
  }
  if (since("site") && !since("climax")) {
    // the Baltic Exchange stood here; the tower rises in its place
    const swap = ease(fr("site", 0.6, 0.95));
    rise = swap;
    items.push(...balticExchange({ ghost: swap, opacity: 1 - swap * 0.5 }));
    tags.push({ key: "be", text: "BALTIC EXCHANGE", at: [0, 0, 34], opacity: fr("site", 0.08, 0.2) * (1 - fr("site", 0.55, 0.6)), tone: "paper" });
    tags.push({ key: "30", text: "30 ST MARY AXE · 2004", at: [0, 0, 186], opacity: fr("site", 0.85, 0.95), tone: "accent" });
  }
  if (since("outro")) {
    ghost = 1 - ease(fr("outro", 0.05, 0.5));
    spirals = 0.55 * (1 - ease(fr("outro", 0.3, 0.7)));
    tags.push({ key: "sl", text: "STRAIGHT LINES ONLY", at: [0, 0, 186], opacity: fr("outro", 0.45, 0.6), tone: "accent" });
    tags.push({ key: "ai", text: "AI SHOTS = VISUALISATIONS", at: [0, -70, 0], opacity: 0.85 * fr("outro", 0.6, 0.75) });
  }

  items.push(...gherkin({ rise, facets, diagrid, spirals, ghost, lens, airflow, t, highlightRow, opacity }));
  return { items, tags };
};

