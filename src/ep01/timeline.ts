import { staticFile } from "remotion";
import { BEATS } from "./script";

export type Word = { text: string; startMs: number; endMs: number };
export type TBeat = { id: string; start: number; end: number; audio?: string };
export type Timeline = { beats: TBeat[]; words: Word[]; total: number; estimated?: boolean };

const GAP = 0.45; // seconds of air between beats
const LEAD = 0.4; // silence before the first beat
const TAIL = 2.2; // hold at the end

/** Rough timeline from word counts, used until the voiceover exists. */
export const estimateTimeline = (): Timeline => {
  let t = LEAD;
  const beats: TBeat[] = [];
  const words: Word[] = [];
  for (const b of BEATS) {
    const ws = b.text.split(/\s+/);
    const dur = ws.length / 2.7 + 0.3;
    ws.forEach((w, i) => {
      const s = t + (i / ws.length) * dur;
      words.push({ text: (i ? " " : "") + w, startMs: s * 1000, endMs: (s + dur / ws.length) * 1000 });
    });
    beats.push({ id: b.id, start: t, end: t + dur });
    t += dur + GAP;
  }
  return { beats, words, total: t + TAIL, estimated: true };
};

export const loadTimeline = async (): Promise<Timeline> => {
  try {
    const res = await fetch(staticFile("ep01/timeline.json"));
    if (!res.ok) throw new Error("no timeline");
    return (await res.json()) as Timeline;
  } catch {
    return estimateTimeline();
  }
};

export const beatIndexAt = (tl: Timeline, t: number) => {
  let idx = 0;
  for (let i = 0; i < tl.beats.length; i++) if (t >= tl.beats[i].start - 0.2) idx = i;
  return idx;
};
