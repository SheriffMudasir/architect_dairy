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
  /** Year shown on the running year bar. */
  year?: number;
  /** Caption words to highlight in the accent colour (case-insensitive, punctuation ignored). */
  em?: string[];
};

/** Timing of an insert inside a beat: fractions of the beat's duration. `untilBeat` lets it run into a later beat. */
type InsertTiming = { beat: string; from?: number; to?: number; untilBeat?: string };

export type Insert = InsertTiming &
  (
    | {
        kind: "photo";
        /** media name in public/<ep>/media (without .jpg); credit comes from credits.json */
        src: string;
        /** card = tilted print over the scene; full = full-bleed, blended into the paper */
        layout: "card" | "full";
        caption?: string;
        tilt?: number; // degrees, card only
        side?: "left" | "right"; // card slides in from
        grade?: "warm" | "mono"; // colour treatment
        focus?: [number, number]; // ken-burns zoom origin, 0..1
      }
    | {
        kind: "video";
        /** media name in public/<ep>/media (without .mp4) — stock footage via `npm run media … --video` */
        src: string;
        grade?: "warm" | "mono";
        focus?: [number, number];
      }
    | { kind: "person"; name: string; role: string; photo?: string }
    | { kind: "number"; value: number; prefix?: string; suffix?: string; label: string; sub?: string; accent?: boolean; format?: "full" | "plain" }
    | { kind: "stamp"; text: string; sub?: string }
    | { kind: "quote"; text: string; by: string }
  );

export type Headline = { lead: string; accent: string };

export type SfxName = "whoosh" | "thud" | "swell" | "tick";
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
  /** Photos, name cards, numbers, stamps, quotes layered over the 3D world. */
  inserts?: Insert[];
  /** Range of the running year bar. Omit to hide it. */
  years?: [number, number];
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
