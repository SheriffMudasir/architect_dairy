// Generate the score with Lyria, shaped around the voiceover timeline.
//   node scripts/music.mjs            -> public/ep01/music.wav
// The API key is injected by the sandbox proxy (or set GEMINI_API_KEY locally).
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const MODEL = process.env.MUSIC_MODEL ?? "lyria-3.5";
const tl = JSON.parse(fs.readFileSync("public/ep01/timeline.json", "utf8"));
const at = (id) => tl.beats.find((b) => b.id === id);
const s = (x) => `${Math.round(x)}s`;

const prompt = `Instrumental underscore for a ${Math.ceil(tl.total)}-second architecture documentary about Zaha Hadid's unbuilt Tokyo Olympic stadium. No vocals. It sits under a spoken voiceover, so keep it sparse, mid-low register, nothing busy in the speech frequencies.

Instruments: felt piano, warm analog synth pads, soft sub pulse, a little koto or shakuhachi colour used sparingly, light ticking percussion. Key: D minor. Tempo around 84 BPM.

Structure (timestamps):
- 0s–${s(at("design").end)}: curious and elegant. Sparse piano motif over a soft pad; at ${s(at("design").start)} a gentle lift as the stadium rises.
- ${s(at("site").start)}–${s(at("blame").end)}: tension grows. A steady ticking pulse enters and slowly builds, low strings swell as costs climb.
- ${s(at("scrapped").start)}: an abrupt stop: one deep, soft low hit, then near silence with a lingering pad.
- ${s(at("withdraw").start)}–${s(at("withdraw").end)}: hollow and uncertain, single piano notes.
- ${s(at("kuma").start)}–${s(at("familiar").end)}: warmer, wooden: koto plucks and a calm pulse, a quiet new beginning.
- ${s(at("death").start)}–${s(at("death").end)}: almost nothing: a single sustained pad and one soft piano chord. Reverent.
- ${s(at("rugby").start)}–${s(at("empty").end)}: a slow, bittersweet build with ticking percussion, echoing and empty.
- ${s(at("outro").start)}–${s(tl.total)}: resolve on the opening piano motif, fading out cleanly by the end.`;

const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-goog-api-key": process.env.GEMINI_API_KEY ?? process.env.Gemini_API_key ?? "injected-by-proxy",
  },
  body: JSON.stringify({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["AUDIO"] },
  }),
});
const json = await res.json();
if (!res.ok) throw new Error(JSON.stringify(json).slice(0, 1000));
const parts = json.candidates?.[0]?.content?.parts ?? [];
const audio = parts.find((p) => p.inlineData);
if (!audio) throw new Error("No audio: " + JSON.stringify(json).slice(0, 1000));
const { mimeType, data } = audio.inlineData;
const ext = /mpeg|mp3/.test(mimeType) ? "mp3" : /wav/.test(mimeType) ? "wav" : "raw";
const raw = `public/ep01/music-raw.${ext}`;
fs.writeFileSync(raw, Buffer.from(data, "base64"));
const rate = Number(/rate=(\d+)/.exec(mimeType)?.[1] ?? 48000);
execFileSync("ffmpeg", [
  "-v", "error", "-y",
  ...(ext === "raw" ? ["-f", "s16le", "-ar", String(rate), "-ac", "2"] : []),
  "-i", raw,
  "-af", "loudnorm=I=-20:TP=-2:LRA=9",
  "-ar", "48000", "-ac", "2",
  "public/ep01/music.wav",
]);
fs.unlinkSync(raw);
const text = parts.filter((p) => p.text).map((p) => p.text).join("\n");
fs.writeFileSync("public/ep01/music-prompt.txt", prompt + (text ? `\n\n--- model notes ---\n${text}` : "") + "\n");
tl.music = "ep01/music.wav";
fs.writeFileSync("public/ep01/timeline.json", JSON.stringify(tl, null, 1));
console.log("music:", mimeType, "->", "public/ep01/music.wav");
