// Generate an episode's score with Lyria, shaped around its voiceover timeline.
//   npm run music -- ep02         -> public/ep02/music.wav (+ music-prompt.txt)
//   npm run music -- ep02 --dry   -> print the prompt only
// Run AFTER the voice: section timestamps come from public/<ep>/timeline.json.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { API, gemini, loadScript, parseArgs, readTimeline, writeTimeline } from "./lib.mjs";

const { ep, rest } = parseArgs();
const script = await loadScript(ep);
const MODEL = process.env.MUSIC_MODEL ?? "lyria-3.5";
const tl = readTimeline(ep);
if (tl.estimated) throw new Error("Generate the voice first (npm run voice -- " + ep + ")");
const beat = (id) => {
  const b = tl.beats.find((x) => x.id === id);
  if (!b) throw new Error(`music section refers to unknown beat "${id}"`);
  return b;
};
const s = (x) => `${Math.round(x)}s`;

const sections = script.music.sections
  .map((sec, i, all) => {
    const start = beat(sec.from).start;
    const nextStart = all[i + 1] ? beat(all[i + 1].from).start : tl.total;
    const end = sec.to ? beat(sec.to).end : nextStart;
    return `- ${i === 0 ? "0s" : s(start)}–${s(i === all.length - 1 ? tl.total : end)}: ${sec.mood.replace(/\.$/, "")}.`;
  })
  .join("\n");

const prompt = `Instrumental underscore for a ${Math.ceil(tl.total)}-second short architecture documentary: "${script.title}". No vocals. It sits under a spoken voiceover, so keep it sparse, mid-low register, nothing busy in the speech frequencies.

${script.music.style}

Structure (timestamps):
${sections}`;

if (rest.includes("--dry")) {
  console.log(prompt);
  process.exit(0);
}

const json = await gemini(`${API}/models/${MODEL}:generateContent`, {
  contents: [{ role: "user", parts: [{ text: prompt }] }],
  generationConfig: { responseModalities: ["AUDIO"] },
});
const parts = json.candidates?.[0]?.content?.parts ?? [];
const audio = parts.find((p) => p.inlineData);
if (!audio) throw new Error("No audio: " + JSON.stringify(json).slice(0, 1000));
const { mimeType, data } = audio.inlineData;
const ext = /mpeg|mp3/.test(mimeType) ? "mp3" : /wav/.test(mimeType) ? "wav" : "raw";
const raw = `public/${ep}/music-raw.${ext}`;
fs.writeFileSync(raw, Buffer.from(data, "base64"));
const rate = Number(/rate=(\d+)/.exec(mimeType)?.[1] ?? 48000);
execFileSync("ffmpeg", [
  "-v", "error", "-y",
  ...(ext === "raw" ? ["-f", "s16le", "-ar", String(rate), "-ac", "2"] : []),
  "-i", raw,
  "-af", "loudnorm=I=-20:TP=-2:LRA=9",
  "-ar", "48000", "-ac", "2",
  `public/${ep}/music.wav`,
]);
fs.unlinkSync(raw);
const notes = parts.filter((p) => p.text).map((p) => p.text).join("\n");
fs.writeFileSync(`public/${ep}/music-prompt.txt`, prompt + (notes ? `\n\n--- model notes ---\n${notes}` : "") + "\n");
tl.music = `${ep}/music.wav`;
writeTimeline(ep, tl);
const dur = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", `public/${ep}/music.wav`]).toString().trim();
console.log(`music: ${mimeType}, ${Number(dur).toFixed(1)}s (episode ${tl.total.toFixed(1)}s) -> public/${ep}/music.wav`);
