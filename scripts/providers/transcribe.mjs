// Speech-to-text, used only by `npm run check-voice` to catch misreads.
// Endpoints contacted (only the one you configure):
//   gemini      POST https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent
//   elevenlabs  POST https://api.elevenlabs.io/v1/speech-to-text
//   openai      POST https://api.openai.com/v1/audio/transcriptions
//   none        skip the check
import fs from "node:fs";
import { GEMINI_API, gemini, http, keyOrProxy, requireKey } from "../lib.mjs";

const pick = (cfg) => {
  const p = cfg.transcribe?.provider;
  if (p) return p;
  // default: reuse whatever key the voice provider already uses
  if (cfg.voice?.provider === "elevenlabs") return "elevenlabs";
  if (cfg.voice?.provider === "openai") return "openai";
  if (keyOrProxy("gemini")) return "gemini";
  return "none";
};

export const getTranscriber = (cfg) => {
  const p = pick(cfg);
  if (p === "gemini")
    return {
      name: p,
      async transcribe(file) {
        const res = await gemini(`${GEMINI_API}/models/${cfg.transcribe?.gemini?.model ?? "gemini-3.8-flash"}:generateContent`, {
          contents: [{ parts: [{ inline_data: { mime_type: "audio/wav", data: fs.readFileSync(file).toString("base64") } }, { text: "Transcribe verbatim. Spell numbers out as words. Output only the transcript." }] }],
        });
        return res.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
      },
    };
  if (p === "elevenlabs")
    return {
      name: p,
      async transcribe(file) {
        const form = new FormData();
        form.append("model_id", cfg.transcribe?.elevenlabs?.model ?? "scribe_v1");
        form.append("file", new Blob([fs.readFileSync(file)], { type: "audio/wav" }), "clip.wav");
        const res = await http("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": requireKey("elevenlabs", "ElevenLabs transcription") }, body: form });
        return (res.text ?? "").trim();
      },
    };
  if (p === "openai")
    return {
      name: p,
      async transcribe(file) {
        const form = new FormData();
        form.append("model", cfg.transcribe?.openai?.model ?? "whisper-1");
        form.append("file", new Blob([fs.readFileSync(file)], { type: "audio/wav" }), "clip.wav");
        const res = await http("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { authorization: `Bearer ${requireKey("openai", "OpenAI transcription")}` }, body: form });
        return (res.text ?? "").trim();
      },
    };
  return { name: "none", async transcribe() { return null; } };
};
