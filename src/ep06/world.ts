// Storyboard for episode 6. The world is a pure function of time t and the
// voice timeline: use at()/fr()/since() from beatClock, never absolute seconds.
import { box, easeOut, Item } from "../iso/engine";
import { city, people, sitePlate } from "../iso/models";
import { beatClock, makeCamAt, Shot } from "../shared/camera";
import { Timeline } from "../shared/timeline";
import { Tag, World } from "../shared/types";
import { C } from "../theme";

// One camera per beat. scale ≈ px per metre (1.0 wide … 2.4 close),
// yaw in radians, drift = slow orbit per second.
const SHOTS: Record<string, Shot> = {
  hook: { yaw: 0.05, scale: 1.25, target: [0, 0, 20], drift: -0.012, zoom: 0.01 },
  context: { yaw: -0.3, scale: 1.8, target: [0, 0, 25], drift: 0.04 },
  conflict: { yaw: 0.2, scale: 1.5, target: [0, 0, 30], drift: 0.02 },
  turn: { yaw: 0.4, scale: 1.8, target: [0, 0, 20], drift: -0.02 },
  outro: { yaw: 0.2, scale: 1.3, target: [0, 0, 40], drift: 0.03, zoom: -0.008 },
};

export const camAt = makeCamAt(SHOTS);

export const worldAt = (tl: Timeline, t: number): World => {
  const { at, fr, since } = beatClock(tl, t);
  const items: Item[] = [];
  const tags: Tag[] = [];

  items.push(...city(0.95));
  items.push(...sitePlate(1, easeOut(at("hook", 0, 1.6))));
  items.push(...people(30, 1));

  // TODO: replace this placeholder massing with the episode's models (src/iso/models.ts).
  const rise = easeOut(fr("hook", 0.1, 0.6));
  if (rise > 0) items.push(...box(-80, -60, 0, 160, 120, 60 * rise, { fill: C.mass, stroke: C.ink, sw: 1.2 }));
  tags.push({ key: "name", text: "BUILDING NAME · ARCHITECT", at: [0, 0, 75], opacity: fr("hook", 0.4, 0.55), tone: "paper" });
  if (since("conflict")) tags.push({ key: "num", text: "THE HARD NUMBER", at: [90, 70, 40], opacity: fr("conflict", 0.3, 0.45), tone: "accent" });

  return { items, tags };
};
