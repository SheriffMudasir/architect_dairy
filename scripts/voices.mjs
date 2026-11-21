// List voices for the configured (or given) TTS provider.
//   npm run voices                 # uses voice.provider
//   npm run voices -- elevenlabs
import { GEMINI_API, gemini, http, loadConfig, requireKey } from "./lib.mjs";

const p = process.argv[2] ?? loadConfig().voice?.provider;
if (p === "elevenlabs") {
  const d = await http("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": requireKey("elevenlabs", "ElevenLabs") } });
  for (const v of d.voices) console.log(`${v.voice_id}  ${v.name.padEnd(28)} ${[v.labels?.gender, v.labels?.accent, v.labels?.age, v.labels?.description ?? v.labels?.use_case].filter(Boolean).join(" · ")}`);
} else if (p === "gemini") {
  const d = await gemini(`${GEMINI_API}/voices?pageSize=100`, undefined, "GET");
  for (const v of d.voices ?? []) console.log(`${(v.id ?? v.display_name ?? "").padEnd(24)} ${(v.display_name ?? "").padEnd(20)} ${[v.type, v.gender, v.accent, v.persona].filter(Boolean).join(" · ")}`);
  console.log("\nTip: or design a new voice from a description: npm run setup -- --voice-prompt \"…\"");
} else if (p === "openai") {
  console.log("OpenAI voices: alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer, verse (set with --openai-voice)");
} else console.log(`No voice list for provider "${p}".`);
