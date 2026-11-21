// Write studio.config.json from the onboarding answers (the agent asks the questions,
// then runs this non-interactively). Never takes API keys — those go in .env.
//
//   npm run setup -- --channel "MY CHANNEL" --niche "architecture" \
//     --voice elevenlabs --elevenlabs-voice <voiceId> [--elevenlabs-model eleven_multilingual_v2] \
//     --music lyria|elevenlabs|file|none --media openverse,pexels,pixabay,wikimedia \
//     --transcribe gemini|elevenlabs|openai|none [--gemini-voice Kore|voice_…] \
//     [--voice-prompt "description for a designed Gemini voice"] [--openai-voice sage] [--wikimedia-contact URL]
//   npm run setup -- --show      # print current config
import fs from "node:fs";
import { CONFIG_FILE, KEY_VARS } from "./lib.mjs";
import { ensureFonts } from "./fonts.mjs";

const argv = process.argv.slice(2);
const opt = (n) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 ? argv[i + 1] : undefined;
};

const DEFAULT = {
  $schema_note: "Studio configuration. No secrets here — API keys live in environment variables (.env).",
  channel: { name: "MY CHANNEL", niche: "architecture" },
  voice: {
    provider: "gemini",
    gemini: { model: "gemini-3.8-flash-tts", voice: "", design: { display_name: "Narrator", gender: "female", language_code: "en-GB", prompt: "" } },
    elevenlabs: { voiceId: "", model: "eleven_multilingual_v2", stability: 0.45, similarity: 0.8, style: 0.2, speed: 1.0 },
    openai: { model: "gpt-4o-mini-tts", voice: "sage", instructions: "Warm, intelligent documentary narrator. Measured pace, clear diction, a hint of dry wit." },
  },
  music: { provider: "none", lyria: { model: "lyria-3.5" }, elevenlabs: { maxSeconds: 300 } },
  transcribe: { provider: "" },
  media: { providers: ["openverse"], wikimediaContact: "" },
};

const cfg = fs.existsSync(CONFIG_FILE) ? JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8")) : structuredClone(DEFAULT);
for (const k of Object.keys(DEFAULT)) cfg[k] = { ...structuredClone(DEFAULT[k]), ...(cfg[k] ?? {}) };
for (const k of ["gemini", "elevenlabs", "openai"]) cfg.voice[k] = { ...DEFAULT.voice[k], ...(cfg.voice[k] ?? {}) };

if (argv.includes("--show")) {
  console.log(JSON.stringify(cfg, null, 2));
  process.exit(0);
}

const set = (v, f) => v !== undefined && f(v);
set(opt("channel"), (v) => (cfg.channel.name = v.toUpperCase()));
set(opt("niche"), (v) => (cfg.channel.niche = v));
set(opt("voice"), (v) => (cfg.voice.provider = v));
set(opt("gemini-voice"), (v) => (cfg.voice.gemini.voice = v));
set(opt("gemini-model"), (v) => (cfg.voice.gemini.model = v));
set(opt("voice-prompt"), (v) => {
  cfg.voice.gemini.design.prompt = v;
  cfg.voice.gemini.voice = ""; // designed on first `npm run voice`
});
set(opt("voice-gender"), (v) => (cfg.voice.gemini.design.gender = v));
set(opt("voice-language"), (v) => (cfg.voice.gemini.design.language_code = v));
set(opt("elevenlabs-voice"), (v) => (cfg.voice.elevenlabs.voiceId = v));
set(opt("elevenlabs-model"), (v) => (cfg.voice.elevenlabs.model = v));
set(opt("openai-voice"), (v) => (cfg.voice.openai.voice = v));
set(opt("openai-instructions"), (v) => (cfg.voice.openai.instructions = v));
set(opt("music"), (v) => (cfg.music.provider = v));
set(opt("transcribe"), (v) => (cfg.transcribe.provider = v));
set(opt("media"), (v) => (cfg.media.providers = v.split(",").map((s) => s.trim()).filter(Boolean)));
set(opt("wikimedia-contact"), (v) => (cfg.media.wikimediaContact = v));

const valid = {
  voice: ["gemini", "elevenlabs", "openai", "file"],
  music: ["lyria", "elevenlabs", "file", "none"],
  transcribe: ["", "gemini", "elevenlabs", "openai", "none"],
  media: ["openverse", "pexels", "pixabay", "wikimedia"],
};
if (!valid.voice.includes(cfg.voice.provider)) throw new Error(`--voice must be one of ${valid.voice.join(", ")}`);
if (!valid.music.includes(cfg.music.provider)) throw new Error(`--music must be one of ${valid.music.join(", ")}`);
if (!valid.transcribe.includes(cfg.transcribe.provider)) throw new Error(`--transcribe must be one of ${valid.transcribe.join(", ")}`);
for (const m of cfg.media.providers) if (!valid.media.includes(m)) throw new Error(`--media: unknown provider ${m}`);

fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));

// which keys are needed for this configuration
const need = new Set();
if (["gemini", "elevenlabs", "openai"].includes(cfg.voice.provider)) need.add(cfg.voice.provider);
if (cfg.music.provider === "lyria") need.add("gemini");
if (cfg.music.provider === "elevenlabs") need.add("elevenlabs");
if (["gemini", "elevenlabs", "openai"].includes(cfg.transcribe.provider)) need.add(cfg.transcribe.provider);
for (const m of cfg.media.providers) if (m === "pexels" || m === "pixabay") need.add(m);

const example = [
  "# Copy to .env and fill in. Never commit .env, never paste keys into chat.",
  ...[...need].map((p) => `${KEY_VARS[p][0]}=`),
  "# Optional: if a sandbox proxy injects keys for you, list those providers instead",
  "# STUDIO_KEYS_VIA_PROXY=gemini",
  "",
].join("\n");
fs.writeFileSync(".env.example", example);
// create an empty .env for the user to fill in (never overwrite an existing one)
if (!fs.existsSync(".env")) fs.writeFileSync(".env", example.replace(/^# Copy to \.env and fill in\./, "# Fill in your keys here."));
console.log(`Saved ${CONFIG_FILE}.`);
console.log(need.size ? `Keys needed in .env: ${[...need].map((p) => KEY_VARS[p][0]).join(", ")} — open .env and paste them after the = sign (keep them out of chat)` : "No API keys needed for this configuration.");
const missingFonts = ensureFonts();
if (missingFonts.length) console.log(`Fonts: run npm install, then npm run fonts (missing ${missingFonts.length})`);
console.log("Next: npm run doctor");
