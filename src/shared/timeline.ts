import { staticFile } from "remotion";
import type { Beat } from "./types";

export type Word = { text: string; startMs: number; endMs: number };
export type TBeat = { id: string; start: number; end: number; audio?: string };
export type Timeline = { beats: TBeat[]; words: Word[]; total: number; music?: string; estimated?: boolean };

const GAP = 0.45; // seconds of air between beats
const LEAD = 0.4; // silence before the first beat
const TAIL = 2.2; // hold at the end

/** Rough timeline from word counts, used until the voiceover exists. */
export const estimateTimeline = (beatsIn: Beat[]): Timeline => {
  let t = LEAD;
  const beats: TBeat[] = [];
  const words: Word[] = [];
  for (const b of beatsIn) {
    const ws = b.text.split(/\s+/);
    const dur = ws.length / 2.7 + 0.3;
    ws.forEach((w, i) => {
      const s = t + (i / ws.length) * dur;
      words.push({ text: (words.length ? " " : "") + w, startMs: s * 1000, endMs: (s + dur / ws.length) * 1000 });
    });
    beats.push({ id: b.id, start: t, end: t + dur });
    t += dur + GAP;
  }
  return { beats, words, total: t + TAIL, estimated: true };
};

/** public/<ep>/timeline.json if the voiceover exists, else an estimate. */
export const loadTimeline = async (ep: string, beats: Beat[]): Promise<Timeline> => {
  try {
    const res = await fetch(staticFile(`${ep}/timeline.json`));
    if (!res.ok) throw new Error("no timeline");
    const tl = (await res.json()) as Timeline;
    // a script edit since the voice was generated -> fall back to estimate
    if (tl.beats.length !== beats.length || tl.beats.some((b, i) => b.id !== beats[i].id)) return estimateTimeline(beats);
    return tl;
  } catch {
    return estimateTimeline(beats);
  }
};

export const beatIndexAt = (tl: Timeline, t: number) => {
  let idx = 0;
  for (let i = 0; i < tl.beats.length; i++) if (t >= tl.beats[i].start - 0.2) idx = i;
  return idx;
};
