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
  /** Extra silence after this beat, in seconds (e.g. to let viewers type a guess). */
  pause?: number;
};

/** Timing of an insert inside a beat: fractions of the beat's duration. `untilBeat` lets it run into a later beat. */
type InsertTiming = { beat: string; from?: number; to?: number; untilBeat?: string };

export type Insert = InsertTiming &
  (
    | {
        kind: "photo";
        /** media name in public/<ep>/media (without .jpg); credit comes from credits.json */
        src: string;
        /** card = tilted print over the scene; full = full-bleed, blended into the paper;
         *  wide = full-width photo on a blurred copy of itself (for small/landscape archive photos) */
        layout: "card" | "full" | "wide";
        caption?: string;
        tilt?: number; // degrees, card only
        side?: "left" | "right"; // card slides in from
        grade?: "warm" | "mono"; // colour treatment
        focus?: [number, number]; // ken-burns zoom origin, 0..1
        /** full layout: camera move over the still (default "in") and an optional light sweep */
        move?: "in" | "out" | "left" | "right" | "up" | "down";
        sweep?: boolean;
      }
    | {
        kind: "video";
        /** media name in public/<ep>/media (without .mp4) — stock footage via `npm run media … --video` */
        src: string;
        grade?: "warm" | "mono";
        focus?: [number, number];
        /** seconds to skip at the start of the clip (e.g. to cut an AI artefact) */
        trimStart?: number;
      }
    | { kind: "person"; name: string; role: string; photo?: string }
    | { kind: "number"; value: number; prefix?: string; suffix?: string; label: string; sub?: string; accent?: boolean; format?: "full" | "plain" }
    | { kind: "stamp"; text: string; sub?: string }
    /** a sign whose letters fall away, leaving `keep` (indices into text) which slide together */
    | { kind: "letters"; text: string; keep: number[]; fallAt?: number; sub?: string }
    | { kind: "quote"; text: string; by: string }
    // ---- cinematic look (look: "cinematic")
    /** archival portrait cut-out on a Bauhaus colour block with a big geometric shape */
    | { kind: "poster"; src: string; name: string; role?: string; color?: "red" | "yellow" | "blue"; shape?: "circle" | "square" | "triangle" }
    /** one-word full-screen flash card, timed to a spoken word (atWord) or to `from` */
    | { kind: "flash"; text: string; atWord?: string; dur?: number; tone?: "light" | "dark" | "red" | "yellow" | "blue" }
    /** hand-drawn marker annotation over the frame (px in the 1080×1920 frame) */
    | { kind: "mark"; shape: "circle" | "arrow" | "underline"; x: number; y: number; w: number; h: number; color?: string; label?: string }
    /** Kandinsky's three shapes: outlines, then filled yellow/red/blue at `revealAt` (fraction of the insert) */
    | { kind: "shapes"; revealAt?: number }
    /** chapter slate: big number + title on a colour block */
    | { kind: "chapter"; n: number; title: string; color?: "red" | "yellow" | "blue" }
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
  /** "cinematic": dark full-bleed look — no headline/label/year bar, film grain, hard cuts. */
  look?: "cinematic";
  /** Range of the running year bar. Omit to hide it. */
  years?: [number, number];
  /** Big on-screen hook text shown from frame 0 (works without sound). 2 short lines, ≤ 22 chars each. */
  hook?: { lines: string[]; until?: number; /** px from the top (default 300) — move it off faces */ top?: number };
  /** Comment prompt shown over the last beat, e.g. "Which building should we break down next?" */
  cta?: string;
  /** Mid-video comment prompts (e.g. "Comment your guess 👇" before a reveal). Shown from `from`
   *  (fraction of the beat) until the next beat starts, or until `untilBeat` starts. */
  prompts?: { beat: string; text: string; from?: number; untilBeat?: string }[];
  /** Cover image (npm run cover): big title over the frame at `beat` (+offset seconds). */
  cover?: { lines: string[]; sub?: string; beat: string; offset?: number; /** "hook": reuse the opening hook title (same size/position) instead of the big cover title */ style?: "hook"; /** px from the top of the title block (default 260) — move it off faces */ top?: number };
  /** End card with media credits (default true). Set false for loop-friendly shorts — each photo
   *  still shows its own credit line, and credits go in the description. */
  endCard?: boolean;
  /** AI-generated media for this episode (npm run gen). Images are cheap; video is budgeted. */
  generate?: {
    /** style bible — appended to every prompt */
    style?: string;
    /** subject bibles — exact descriptions kept consistent across shots */
    subjects?: Record<string, string>;
    images?: { name: string; prompt: string; subject?: string; refs?: string[]; aspect?: string }[];
    /** keep to 1–3 per episode; `from` = an image name used as the first frame (consistency) */
    videos?: { name: string; prompt: string; subject?: string; from?: string; duration?: string }[];
  };
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
