// Audition narrator voices with the same three lines, at the same loudness.
//   npm run voice-audition -- current                                  # the configured voice
//   npm run voice-audition -- warm --gemini-prompt "A woman in her 30s…"  # design a Gemini voice
//   npm run voice-audition -- adam --elevenlabs <voiceId>
//   npm run voice-audition -- kore --gemini-voice Kore
//   npm run voice-audition -- sage --openai sage
//   npm run voice-audition -- use <name>                                # make an audition the channel voice
// Output: voice/auditions/<name>.wav
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { CONFIG_FILE, GEMINI_API, gemini, loadConfig } from "./lib.mjs";
import { getTTS } from "./providers/tts.mjs";

const argv = process.argv.slice(2);
const [name, arg2] = argv;
const opt = (n) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const DIR = "voice/auditions";
const DB = "voice/auditions.json";
fs.mkdirSync(DIR, { recursive: true });
const db = fs.existsSync(DB) ? JSON.parse(fs.readFileSync(DB, "utf8")) : {};
const cfg = loadConfig();

if (name === "use") {
  const a = db[arg2];
  if (!a) throw new Error(`no audition "${arg2}"`);
  cfg.voice.provider = a.provider;
  if (a.provider === "gemini") cfg.voice.gemini.voice = a.voice;
  if (a.provider === "elevenlabs") cfg.voice.elevenlabs.voiceId = a.voice;
  if (a.provider === "openai") cfg.voice.openai.voice = a.voice;
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
  console.log(`Channel voice is now "${arg2}" (${a.provider}: ${a.voice}). Re-run: npm run voice -- <ep> --force`);
  process.exit(0);
}
if (!name) throw new Error("usage: npm run voice-audition -- <name> [--gemini-prompt … | --gemini-voice … | --elevenlabs <id> | --openai <voice>]");

const c = structuredClone(cfg);
let rec;
if (opt("gemini-prompt")) {
  const res = await gemini(`${GEMINI_API}/voices`, {
    store: true,
    voice: { type: "prompted", display_name: `Audition — ${name}`, gender: c.voice.gemini.design?.gender, language_code: c.voice.gemini.design?.language_code, prompted: { input: opt("gemini-prompt") } },
  });
  c.voice.provider = "gemini";
  c.voice.gemini.voice = res.id ?? res.name?.replace(/^voices\//, "");
  rec = { provider: "gemini", voice: c.voice.gemini.voice, prompt: opt("gemini-prompt") };
} else if (opt("gemini-voice")) {
  c.voice.provider = "gemini";
  c.voice.gemini.voice = opt("gemini-voice");
  rec = { provider: "gemini", voice: opt("gemini-voice") };
} else if (opt("elevenlabs")) {
  c.voice.provider = "elevenlabs";
  c.voice.elevenlabs.voiceId = opt("elevenlabs");
  rec = { provider: "elevenlabs", voice: opt("elevenlabs") };
} else if (opt("openai")) {
  c.voice.provider = "openai";
  c.voice.openai.voice = opt("openai");
  rec = { provider: "openai", voice: opt("openai") };
} else {
  const v = c.voice;
  rec = { provider: v.provider, voice: v.provider === "elevenlabs" ? v.elevenlabs.voiceId : v.provider === "openai" ? v.openai.voice : v.gemini.voice };
}

const LINES = [
  "In 1957, an unknown architect won a competition with a sketch. It took sixteen years to build.",
  "Then came the bill. Fourteen times the original budget.",
  "He never saw it finished. Today, it's one of the most famous buildings on Earth.",
];
const tts = getTTS(c);
await tts.prepare();
const parts = [];
for (const [i, text] of LINES.entries()) {
  const f = `${DIR}/${name}-${i}.wav`;
  await tts.synth(text, f, { id: `line${i}` }, "audition");
  parts.push(f);
}
const filter = parts.map((_, i) => `[${i}:a]apad=pad_dur=0.6[a${i}]`).join(";") + ";" + parts.map((_, i) => `[a${i}]`).join("") + `concat=n=${parts.length}:v=0:a=1,loudnorm=I=-14:TP=-1.5:LRA=7`;
execFileSync("ffmpeg", ["-v", "error", "-y", ...parts.flatMap((f) => ["-i", f]), "-filter_complex", filter, "-ar", "48000", "-ac", "1", `${DIR}/${name}.wav`]);
parts.forEach((f) => fs.rmSync(f, { force: true }));
db[name] = { ...rec, created: new Date().toISOString() };
fs.writeFileSync(DB, JSON.stringify(db, null, 2));
console.log(`${DIR}/${name}.wav  (${rec.provider}: ${rec.voice})`);
