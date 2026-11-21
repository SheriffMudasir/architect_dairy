// Transcribe every generated clip and compare it with the script, so misreads,
// spoken stage directions or dropped words are caught before render.
//   npm run check-voice -- ep02
// Uses studio.config.json -> transcribe.provider (gemini | elevenlabs | openai | none).
import fs from "node:fs";
import { loadConfig, loadScript, parseArgs } from "./lib.mjs";
import { getTranscriber } from "./providers/transcribe.mjs";

const { ep } = parseArgs();
const { beats } = await loadScript(ep);
const stt = getTranscriber(loadConfig());
if (stt.name === "none") {
  console.log("No transcription provider configured — listen to public/" + ep + "/audio/*.wav yourself, or set transcribe.provider.");
  process.exit(0);
}
const NUM = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, a: 1, an: 1 };
// written abbreviations are spoken in full
const ABBR = { st: "saint", mt: "mount", mr: "mister", mrs: "missus", dr: "doctor", no: "number", vs: "versus" };
const norm = (s) =>
  s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => ABBR[w] ?? w)
    .filter((w) => !(w in NUM));

let problems = 0;
for (const b of beats) {
  const f = `public/${ep}/audio/${b.id}.wav`;
  if (!fs.existsSync(f)) {
    console.log(`✗ ${b.id}: missing audio`);
    problems++;
    continue;
  }
  const heard = await stt.transcribe(f);
  const a = norm(b.text);
  const hw = norm(heard);
  // accept hyphenated words written either way ("over-ambitious" vs "overambitious")
  const h = new Set([...hw, ...hw.slice(1).map((w, i) => hw[i] + w)]);
  const joined = new Set(
    (b.text.toLowerCase().match(/[a-z]+(?:-[a-z]+)+/g) ?? []).flatMap((x) => (h.has(x.replace(/-/g, "")) ? x.split("-") : [])),
  );
  // numbers may be written differently ("2015" vs "twenty fifteen"), so be lenient
  const missing = a.filter((w) => !/^\d+$/.test(w) && !h.has(w) && !joined.has(w));
  const extra = norm(heard).length - a.length;
  const ok = missing.length <= 1 && extra < 6;
  if (!ok) problems++;
  console.log(`${ok ? "✓" : "✗"} ${b.id.padEnd(14)} ${heard}`);
  if (!ok) console.log(`    expected: ${b.text}\n    missing: ${missing.join(", ") || "-"}  extra words: ${extra}`);
}
console.log(problems ? `\n${problems} beat(s) need attention (re-run: npm run voice -- ${ep} <beat ids>)` : `\nAll beats match the script (${stt.name}).`);
process.exit(problems ? 1 : 0);
