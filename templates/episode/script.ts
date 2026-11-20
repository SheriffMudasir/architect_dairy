// Episode __N__ — "__TITLE__"
// Node-safe data file: read by Remotion AND by scripts/voice.mjs + scripts/music.mjs.
// Rules: one beat = one sentence or two (one TTS clip). `text` is spoken verbatim:
// no stage directions, no brackets. Write numbers the way they should be heard.
import type { Beat, EpisodeScript } from "../shared/types";

const beats: Beat[] = [
  // TODO: replace with the researched script (aim for 12–16 beats, ~190–230 words, 75–100 s).
  { id: "hook", act: "a", label: "YEAR · PLACE", year: 2000, em: ["twist"], text: "One-sentence hook that states the twist up front." },
  { id: "context", act: "a", label: "YEAR · PLACE", text: "Who, where, and what was promised." },
  { id: "conflict", act: "a", label: "YEAR · PLACE", text: "What went wrong, with one hard number." },
  { id: "turn", act: "b", label: "YEAR · PLACE", text: "The turning point." },
  { id: "outro", act: "end", label: "ARCHITECT · ARCHITECT", text: "A closing line that mirrors the hook." },
];

export const SCRIPT: EpisodeScript = {
  id: "__EP__",
  number: __N__,
  title: "__TITLE__",
  beats,
  headlines: {
    a: { lead: "TODO headline for act A.", accent: "Accent phrase." },
    b: { lead: "TODO headline for act B.", accent: "Accent phrase." },
    end: { lead: "TODO closing headline.", accent: "Accent phrase." },
  },
  years: [2000, 2010],
  // Motion-graphics layer: photos (npm run media), name cards, numbers, stamps, quotes.
  // Aim for something new on screen every 2–3 s (see the skill, section 4b).
  inserts: [
    { kind: "person", beat: "context", from: 0.1, to: 0.6, name: "Architect Name", role: "Architect" },
    { kind: "number", beat: "conflict", from: 0.3, to: 1, value: 1000000, prefix: "$", label: "The hard number", accent: true },
    { kind: "stamp", beat: "turn", from: 0.3, to: 1, text: "CANCELLED" },
  ],
  music: {
    style: "Instruments: felt piano, warm pads, soft pulse. Key: TODO. Tempo around 80–90 BPM.",
    sections: [
      { from: "hook", to: "context", mood: "curious and elegant" },
      { from: "conflict", mood: "tension builds" },
      { from: "turn", mood: "a shift in colour" },
      { from: "outro", mood: "resolve on the opening motif, fade out cleanly" },
    ],
    dips: [],
  },
  sfx: [
    { sfx: "swell", beat: "hook", offset: 0.2, volume: 0.28 },
    { sfx: "thud", beat: "conflict", offset: 0.5, volume: 0.6 },
  ],
};
