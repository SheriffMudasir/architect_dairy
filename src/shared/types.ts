// Types shared by every episode. Keep this file free of runtime imports:
// episode script.ts files import it with `import type`, and the Node scripts
// (voice, music) load script.ts directly with --experimental-strip-types.
import type { Cam, Item, V3 } from "../iso/engine";
import type { Timeline } from "./timeline";

export type Beat = {
  id: string;
  /** Which headline is on screen during this beat. */
  act: string;
  /** Mono label under the headline: YEAR · PLACE */
  label: string;
  /** Exactly what the narrator says. Plain text only: no stage directions (TTS reads them aloud). */
  text: string;
};

export type Headline = { lead: string; accent: string };

export type SfxName = "whoosh" | "thud" | "swell";
export type SfxCue = { sfx: SfxName; beat: string; offset?: number; volume?: number };

export type MusicPlan = {
  /** Instruments, key, tempo, overall mood. */
  style: string;
  /** Sections keyed by beat ids; timestamps are filled in from the timeline. */
  sections: { from: string; to?: string; mood: string }[];
  /** Beats where the music dips almost to silence. */
  dips?: string[];
};

export type EpisodeScript = {
  id: string; // folder name, e.g. "ep02"
  number: number;
  title: string;
  beats: Beat[];
  headlines: Record<string, Headline>;
  music: MusicPlan;
  sfx: SfxCue[];
};

export type Tag = {
  key: string;
  text: string;
  at: V3;
  opacity: number;
  tone?: "ink" | "accent" | "paper";
  dy?: number;
  align?: "left" | "right";
};

export type World = { items: Item[]; tags: Tag[] };

export type EpisodeDef = EpisodeScript & {
  compositionId: string;
  worldAt: (tl: Timeline, t: number) => World;
  camAt: (tl: Timeline, t: number, sx: number, sy: number) => Cam;
};
