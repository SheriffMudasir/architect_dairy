// Generate the episode voiceover with Gemini TTS + a designed (prompted) voice,
// then build public/ep01/timeline.json (beat timings + per-word timings).
//
//   node --experimental-strip-types scripts/voice.mjs            # all beats
//   node --experimental-strip-types scripts/voice.mjs hook cost  # redo some beats
//   node --experimental-strip-types scripts/voice.mjs --timeline # only rebuild timeline
//
// The API key is NOT read here: the sandbox proxy injects the x-goog-api-key
// header for generativelanguage.googleapis.com. Outside the sandbox, set
// GEMINI_API_KEY and it is sent instead.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { BEATS, DELIVERY, VOICE_DESIGN } from "../src/ep01/script.ts";

const API = "https://generativelanguage.googleapis.com/v1beta";
const TTS_MODEL = process.env.TTS_MODEL ?? "gemini-3.8-flash-tts";
const OUT = "public/ep01/audio";
const VOICE_FILE = "voice/narrator.json";
const LEAD = 0.5;
const GAP = 0.5;
const TAIL = 2.6;

const headers = {
  "content-type": "application/json",
  "x-goog-api-key": process.env.GEMINI_API_KEY ?? "injected-by-proxy",
};

const call = async (url, body, method = "POST") => {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const text = await res.text();
    if (res.ok) return JSON.parse(text);
    if (attempt < 4 && (res.status === 429 || res.status >= 500)) {
      console.warn(`  ${res.status}, retrying…`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
      continue;
    }
    throw new Error(`${method} ${url} -> ${res.status}: ${text.slice(0, 800)}`);
  }
};

// ---------------------------------------------------------------- voice design
const getVoice = async () => {
  if (fs.existsSync(VOICE_FILE)) return JSON.parse(fs.readFileSync(VOICE_FILE, "utf8"));
  console.log("Designing narrator voice…");
  const v = VOICE_DESIGN;
  const res = await call(`${API}/voices`, {
    store: true,
    voice: {
      type: "prompted",
      display_name: v.display_name,
      gender: v.gender,
      language_code: v.language_code,
      accent: v.accent,
      persona: v.persona,
      context: v.context,
      prompted: { input: v.prompt },
    },
  });
  const id = res.id ?? res.name?.replace(/^voices\//, "") ?? res.key;
  if (!id) throw new Error("No voice id in response: " + JSON.stringify(res).slice(0, 500));
  fs.mkdirSync(path.dirname(VOICE_FILE), { recursive: true });
  const saved = { id, display_name: v.display_name, prompt: v.prompt, created: new Date().toISOString(), raw: res };
  fs.writeFileSync(VOICE_FILE, JSON.stringify(saved, null, 2));
  console.log("  voice:", id);
  return saved;
};

// ---------------------------------------------------------------- synthesis
const synth = async (voiceId, beat) => {
  const body = {
    contents: [{ role: "user", parts: [{ text: `${DELIVERY}\n\n${beat.text}` }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: { voiceConfig: { voice: voiceId } },
    },
  };
  const res = await call(`${API}/models/${TTS_MODEL}:generateContent`, body);
  const part = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part) throw new Error("No audio in response: " + JSON.stringify(res).slice(0, 500));
  const { mimeType, data } = part.inlineData;
  const raw = path.join(OUT, `${beat.id}.raw`);
  const wav = path.join(OUT, `${beat.id}.wav`);
  fs.writeFileSync(raw, Buffer.from(data, "base64"));
  const rate = Number(/rate=(\d+)/.exec(mimeType)?.[1] ?? 24000);
  const isWav = /wav/.test(mimeType);
  // trim edge silence, gentle loudness normalisation
  execFileSync("ffmpeg", [
    "-v", "error", "-y",
    ...(isWav ? [] : ["-f", "s16le", "-ar", String(rate), "-ac", "1"]),
    "-i", raw,
    "-af",
    "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.12,areverse,loudnorm=I=-16:TP=-1.5:LRA=7",
    "-ar", "48000", "-ac", "1", wav,
  ]);
  fs.unlinkSync(raw);
  console.log(`  ${beat.id}  (${mimeType})`);
};

// ---------------------------------------------------------------- alignment
const duration = (f) =>
  Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim());

const silenceList = (f) => {
  let stderr = "";
  try {
    execFileSync("sh", ["-c", `ffmpeg -hide_banner -i "${f}" -af silencedetect=n=-38dB:d=0.16 -f null - 2> "${f}.log"`]);
    stderr = fs.readFileSync(`${f}.log`, "utf8");
    fs.unlinkSync(`${f}.log`);
  } catch (e) {
    stderr = String(e);
  }
  const starts = [...stderr.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
  const ends = [...stderr.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
  return starts.map((s, i) => ({ s, e: ends[i] ?? s })).filter((p) => p.e > p.s);
};

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
  const bounds = [];
  let acc = 0;
  for (let i = 0; i < phrases.length - 1; i++) {
    acc += weight(phrases[i]);
    const expected = (acc / total) * dur;
    // nearest unused pause within a tolerance
    let best = null;
    for (const g of internal) {
      if (bounds.some((b) => b.g === g)) continue;
      if (bounds.length && g.s <= bounds[bounds.length - 1].e) continue;
      const d = Math.abs((g.s + g.e) / 2 - expected);
      if (d < dur * 0.18 && (!best || d < best.d)) best = { g, d };
    }
    bounds.push(best ? { s: best.g.s, e: best.g.e, g: best.g } : { s: expected, e: expected, g: null });
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
    const ws = alignBeat(b.text, dur, silenceList(f));
    ws.forEach((w, i) =>
      words.push({ text: words.length ? " " + w.text : w.text, startMs: Math.round((t + w.start) * 1000), endMs: Math.round((t + w.end) * 1000) }),
    );
    beats.push({ id: b.id, start: +t.toFixed(3), end: +(t + dur).toFixed(3), audio: `ep01/audio/${b.id}.wav` });
    t += dur + GAP;
  }
  const tl = { beats, words, total: +(t - GAP + TAIL).toFixed(3) };
  fs.writeFileSync("public/ep01/timeline.json", JSON.stringify(tl, null, 1));
  console.log(`timeline: ${tl.total.toFixed(1)}s, ${beats.length} beats, ${words.length} words`);
};

// ---------------------------------------------------------------- main
fs.mkdirSync(OUT, { recursive: true });
const args = process.argv.slice(2);
if (!args.includes("--timeline")) {
  const voice = await getVoice();
  const only = args.filter((a) => !a.startsWith("--"));
  for (const b of BEATS) {
    if (only.length && !only.includes(b.id)) continue;
    if (!only.length && fs.existsSync(path.join(OUT, `${b.id}.wav`)) && !args.includes("--force")) continue;
    await synth(voice.id, b);
  }
}
buildTimeline();
