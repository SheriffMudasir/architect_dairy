// Transcribe every generated clip with Gemini and compare it with the script,
// so misreads, spoken stage directions or dropped words are caught before render.
//   npm run check-voice -- ep02
import fs from "node:fs";
import { API, gemini, loadScript, parseArgs } from "./lib.mjs";

const { ep } = parseArgs();
const { beats } = await loadScript(ep);
const norm = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ");

let problems = 0;
for (const b of beats) {
  const f = `public/${ep}/audio/${b.id}.wav`;
  if (!fs.existsSync(f)) {
    console.log(`✗ ${b.id}: missing audio`);
    problems++;
    continue;
  }
  const res = await gemini(`${API}/models/${process.env.CHECK_MODEL ?? "gemini-3.8-flash"}:generateContent`, {
    contents: [
      {
        parts: [
          { inline_data: { mime_type: "audio/wav", data: fs.readFileSync(f).toString("base64") } },
          { text: "Transcribe verbatim. Spell numbers out as words. Output only the transcript." },
        ],
      },
    ],
  });
  const heard = res.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  // crude word-overlap score; numbers may be written differently, so be lenient
  const a = norm(b.text);
  const h = new Set(norm(heard));
  const missing = a.filter((w) => !/^\d+$/.test(w) && !h.has(w));
  const extra = norm(heard).length - a.length;
  const ok = missing.length <= 1 && extra < 6;
  if (!ok) problems++;
  console.log(`${ok ? "✓" : "✗"} ${b.id.padEnd(14)} ${heard}`);
  if (!ok) console.log(`    expected: ${b.text}\n    missing: ${missing.join(", ") || "-"}  extra words: ${extra}`);
}
console.log(problems ? `\n${problems} beat(s) need attention (re-run: npm run voice -- ${ep} <beat ids>)` : "\nAll beats match the script.");
process.exit(problems ? 1 : 0);
