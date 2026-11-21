// Generate an episode's voiceover with the configured TTS provider, then build
// public/<ep>/timeline.json (beat timings + per-word caption timings).
//
//   npm run voice -- ep02              # synthesize missing beats + timeline
//   npm run voice -- ep02 hook cost    # redo specific beats
//   npm run voice -- ep02 --force      # redo every beat
//   npm run voice -- ep02 --timeline   # only rebuild the timeline
//
// Provider = studio.config.json -> voice.provider (gemini | elevenlabs | openai | file).
// Word timings: provider timestamps when available (ElevenLabs), otherwise a
// pause-anchored aligner (no extra downloads needed).
import fs from "node:fs";
import path from "node:path";
import { duration, loadConfig, loadScript, parseArgs, readTimeline, silences, timelinePath, writeTimeline } from "./lib.mjs";
import { getTTS } from "./providers/tts.mjs";

const { ep, rest: args } = parseArgs();
const { beats: BEATS } = await loadScript(ep);
const cfg = loadConfig();
const OUT = `public/${ep}/audio`;
const LEAD = 0.5;
const GAP = 0.5;
const TAIL = 5.5; // room for the credits card

// ---------------------------------------------------------------- alignment
const syllables = (w) => {
  const clean = w.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (/^\d+$/.test(clean)) return clean.length * 1.6;
  const groups = clean.match(/[aeiouy]+/g)?.length ?? 1;
  return Math.max(1, groups - (clean.endsWith("e") && groups > 1 ? 0.6 : 0)) + 0.35;
};

/** Distribute words over the clip, anchoring phrase breaks to detected pauses. */
const alignBeat = (text, dur, gaps) => {
  const words = text.split(/\s+/).filter(Boolean);
  // phrases end on punctuation
  const phrases = [];
  let cur = [];
  words.forEach((w) => {
    cur.push(w);
    if (/[,.:;?!—]$/.test(w)) {
      phrases.push(cur);
      cur = [];
    }
  });
  if (cur.length) phrases.push(cur);

  const weight = (ph) => ph.reduce((a, w) => a + syllables(w), 0);
  const total = phrases.reduce((a, p) => a + weight(p), 0);
  // expected boundary times
  const internal = gaps.filter((g) => g.s > 0.15 && g.e < dur - 0.1);
  // Place each phrase break relative to the previous one, so times only move
  // forward: expected = prevEnd + share of the remaining time by syllable weight.
  const bounds = [];
  let prevEnd = 0;
  let remaining = total;
  for (let i = 0; i < phrases.length - 1; i++) {
    const w = weight(phrases[i]);
    const span = dur - prevEnd;
    const expected = prevEnd + (w / remaining) * span;
    let best = null;
    for (const g of internal) {
      if (g.s <= prevEnd + 0.15) continue; // need room for at least one word
      const d = Math.abs((g.s + g.e) / 2 - expected);
      if (d < Math.max(0.35, span * 0.2) && (!best || d < best.d)) best = { g, d };
    }
    const b = best ? { s: best.g.s, e: best.g.e } : { s: expected, e: expected };
    bounds.push(b);
    prevEnd = b.e;
    remaining -= w;
  }
  const out = [];
  let t0 = 0;
  phrases.forEach((ph, i) => {
    const t1 = i < bounds.length ? bounds[i].s : dur;
    const w = weight(ph);
    let t = t0;
    ph.forEach((word) => {
      const d = ((t1 - t0) * syllables(word)) / w;
      out.push({ text: word, start: t, end: t + d });
      t += d;
    });
    t0 = i < bounds.length ? bounds[i].e : dur;
  });
  return out;
};

const buildTimeline = () => {
  let t = LEAD;
  const beats = [];
  const words = [];
  for (const b of BEATS) {
    const f = path.join(OUT, `${b.id}.wav`);
    if (!fs.existsSync(f)) throw new Error(`missing ${f}`);
    const dur = duration(f);
    // provider timestamps (if saved) win; otherwise align by pauses + syllables
    const wf = path.join(OUT, `${b.id}.words.json`);
    let ws = fs.existsSync(wf) ? JSON.parse(fs.readFileSync(wf, "utf8")) : null;
    if (!ws?.length) ws = alignBeat(b.text, dur, silences(f));
    ws.forEach((w) =>
      words.push({ text: words.length ? " " + w.text : w.text, startMs: Math.round((t + w.start) * 1000), endMs: Math.round((t + Math.min(w.end, dur)) * 1000) }),
    );
    beats.push({ id: b.id, start: +t.toFixed(3), end: +(t + dur).toFixed(3), audio: `${ep}/audio/${b.id}.wav` });
    t += dur + GAP;
  }
  const prev = fs.existsSync(timelinePath(ep)) ? readTimeline(ep) : {};
  const tl = { beats, words, total: +(t - GAP + TAIL).toFixed(3), ...(prev.music ? { music: prev.music } : {}) };
  writeTimeline(ep, tl);
  console.log(`timeline: ${tl.total.toFixed(1)}s, ${beats.length} beats, ${words.length} words`);
};

// ---------------------------------------------------------------- main
fs.mkdirSync(OUT, { recursive: true });
if (!args.includes("--timeline")) {
  const tts = getTTS(cfg);
  await tts.prepare();
  const only = args.filter((a) => !a.startsWith("--"));
  for (const b of BEATS) {
    if (only.length && !only.includes(b.id)) continue;
    if (!only.length && fs.existsSync(path.join(OUT, `${b.id}.wav`)) && !args.includes("--force")) continue;
    const out = path.join(OUT, `${b.id}.wav`);
    const { words } = await tts.synth(b.text, out, b, ep);
    const wf = path.join(OUT, `${b.id}.words.json`);
    if (words?.length) fs.writeFileSync(wf, JSON.stringify(words));
    else fs.rmSync(wf, { force: true });
    console.log(`  ${b.id}  (${tts.name}${words?.length ? ", timestamps" : ""})`);
  }
}
buildTimeline();
