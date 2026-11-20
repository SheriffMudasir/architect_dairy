// Design a candidate narrator voice and render a short audition with it.
//   npm run voice-audition -- <name> "<voice description>"
//   npm run voice-audition -- current              # audition the voice in voice/narrator.json
//   npm run voice-audition -- use <name>           # make an audition the channel voice
// Auditions: voice/auditions/<name>.wav, ids in voice/auditions.json.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { VOICE_DESIGN } from "../src/channel.ts";
import { API, gemini } from "./lib.mjs";

const [name, prompt] = process.argv.slice(2);
const DIR = "voice/auditions";
const DB = "voice/auditions.json";
const TTS_MODEL = process.env.TTS_MODEL ?? "gemini-3.8-flash-tts";
const LINES = [
  "In 2012, Japan picked Zaha Hadid to build its new National Stadium. It was never built.",
  "Then came the bill. A year later: two hundred and fifty-two billion yen.",
  "One stadium was never built. The other was built, and almost no one got to watch.",
];
fs.mkdirSync(DIR, { recursive: true });
const db = fs.existsSync(DB) ? JSON.parse(fs.readFileSync(DB, "utf8")) : {};

if (name === "use") {
  const a = db[prompt];
  if (!a) throw new Error(`no audition "${prompt}"`);
  const cur = JSON.parse(fs.readFileSync("voice/narrator.json", "utf8"));
  fs.writeFileSync("voice/narrator.previous.json", JSON.stringify(cur, null, 2));
  fs.writeFileSync("voice/narrator.json", JSON.stringify({ id: a.id, display_name: a.name, prompt: a.prompt, created: a.created }, null, 2));
  console.log(`channel voice is now "${prompt}" (${a.id}); previous saved to voice/narrator.previous.json`);
  process.exit(0);
}

let id;
if (name === "current") {
  id = JSON.parse(fs.readFileSync("voice/narrator.json", "utf8")).id;
} else {
  if (!name || !prompt) throw new Error('usage: npm run voice-audition -- <name> "<voice description>"');
  const res = await gemini(`${API}/voices`, {
    store: true,
    voice: {
      type: "prompted",
      display_name: `Architect Diary — ${name}`,
      gender: VOICE_DESIGN.gender,
      language_code: VOICE_DESIGN.language_code,
      persona: "Documentary narrator",
      context: "Short-form architecture documentary",
      prompted: { input: prompt },
    },
  });
  id = res.id ?? res.name?.replace(/^voices\//, "");
  db[name] = { id, name, prompt, created: new Date().toISOString() };
  fs.writeFileSync(DB, JSON.stringify(db, null, 2));
}

const parts = [];
for (const [i, text] of LINES.entries()) {
  const res = await gemini(`${API}/models/${TTS_MODEL}:generateContent`, {
    contents: [{ role: "user", parts: [{ text }] }],
    generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { voice: id } } },
  });
  const p = res.candidates[0].content.parts.find((x) => x.inlineData);
  const f = `${DIR}/${name}-${i}.wav`;
  fs.writeFileSync(f, Buffer.from(p.inlineData.data, "base64"));
  parts.push(f);
}
// join with short pauses, normalise to the same loudness as episode clips
const inputs = parts.flatMap((f) => ["-i", f]);
const filter =
  parts.map((_, i) => `[${i}:a]aresample=48000,apad=pad_dur=0.6[a${i}]`).join(";") +
  ";" +
  parts.map((_, i) => `[a${i}]`).join("") +
  `concat=n=${parts.length}:v=0:a=1,loudnorm=I=-14:TP=-1.5:LRA=7`;
execFileSync("ffmpeg", ["-v", "error", "-y", ...inputs, "-filter_complex", filter, "-ar", "48000", "-ac", "1", `${DIR}/${name}.wav`]);
parts.forEach((f) => fs.unlinkSync(f));
console.log(`${DIR}/${name}.wav  (voice ${id})`);
