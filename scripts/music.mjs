// Generate an episode's score with the configured music provider (studio.config.json -> music.provider),
// shaped around its voiceover timeline.
//   npm run music -- ep02         -> public/ep02/music.wav (+ music-prompt.txt)
//   npm run music -- ep02 --dry   -> print the prompt only
// Run AFTER the voice: section timestamps come from public/<ep>/timeline.json.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { duration, loadConfig, loadScript, parseArgs, readTimeline, writeTimeline } from "./lib.mjs";
import { getMusic } from "./providers/music.mjs";

const { ep, rest } = parseArgs();
const script = await loadScript(ep);
const provider = getMusic(loadConfig());
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

const cfgNiche = loadConfig().channel?.niche ?? "architecture";
const prompt = `Instrumental underscore for a ${Math.ceil(tl.total)}-second short ${cfgNiche} documentary: "${script.title}". No vocals. It sits under a spoken voiceover, so keep it sparse, mid-low register, nothing busy in the speech frequencies.

${script.music.style}

Structure (timestamps):
${sections}`;

if (rest.includes("--dry")) {
  console.log(prompt);
  process.exit(0);
}

if (provider.name === "none") {
  delete tl.music;
  writeTimeline(ep, tl);
  console.log("music.provider is none — episode will have voice + effects only");
  process.exit(0);
}
const got = await provider.generate(prompt, tl.total, `public/${ep}/music-raw`, ep);
const pcm = got.rawFormat?.pcm ? ["-f", "s16le", "-ar", String(got.rawFormat.rate), "-ac", String(got.rawFormat.channels ?? 2)] : [];
// loudness-normalise; fade the tail so a too-long track ends cleanly with the episode
execFileSync("ffmpeg", [
  "-v", "error", "-y", ...pcm, "-i", got.file,
  "-t", String(tl.total),
  "-af", `loudnorm=I=-20:TP=-2:LRA=9,afade=t=out:st=${Math.max(0, tl.total - 3).toFixed(2)}:d=3`,
  "-ar", "48000", "-ac", "2", `public/${ep}/music.wav`,
]);
if (!got.keep) fs.rmSync(got.file, { force: true });
fs.writeFileSync(`public/${ep}/music-prompt.txt`, `provider: ${provider.name}\n\n` + prompt + (got.notes ? `\n\n--- model notes ---\n${got.notes}` : "") + "\n");
tl.music = `${ep}/music.wav`;
writeTimeline(ep, tl);
console.log(`music (${provider.name}): ${duration(`public/${ep}/music.wav`).toFixed(1)}s (episode ${tl.total.toFixed(1)}s) -> public/${ep}/music.wav`);
