// Text-to-speech providers. Each returns { lead, words? } after writing a finished wav.
//   words: [{ text, start, end }] in seconds relative to the finished clip, when the provider
//   returns timestamps (ElevenLabs). Otherwise the pause-anchored aligner is used.
//
// Endpoints contacted (only the one you configure):
//   gemini      POST https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent
//               POST https://generativelanguage.googleapis.com/v1beta/voices   (voice design, once)
//   elevenlabs  POST https://api.elevenlabs.io/v1/text-to-speech/<voiceId>/with-timestamps
//   openai      POST https://api.openai.com/v1/audio/speech
//   file        none — uses audio you (or your agent's own tools) saved in public/<ep>/audio-src/
import fs from "node:fs";
import path from "node:path";
import { finishClip, GEMINI_API, gemini, http, requireKey } from "../lib.mjs";

const tmp = (out, ext) => out.replace(/\.wav$/, `.src.${ext}`);

// ---------------------------------------------------------------- Gemini
const geminiTTS = (cfg) => {
  const g = cfg.voice.gemini ?? {};
  const model = g.model ?? "gemini-3.8-flash-tts";
  let voice = g.voice;
  return {
    name: "gemini",
    async prepare() {
      if (voice) return;
      if (!g.design?.prompt) {
        voice = "Kore"; // a built-in voice
        return;
      }
      console.log("Designing a narrator voice with Gemini (once)…");
      const d = g.design;
      const res = await gemini(`${GEMINI_API}/voices`, {
        store: true,
        voice: {
          type: "prompted",
          display_name: d.display_name ?? "Narrator",
          gender: d.gender,
          language_code: d.language_code,
          accent: d.accent,
          persona: d.persona,
          context: d.context,
          prompted: { input: d.prompt },
        },
      });
      voice = res.id ?? res.name?.replace(/^voices\//, "");
      // persist the id so every episode uses the same voice
      const file = "studio.config.json";
      const c = JSON.parse(fs.readFileSync(file, "utf8"));
      c.voice.gemini.voice = voice;
      fs.writeFileSync(file, JSON.stringify(c, null, 2));
      console.log(`  voice id ${voice} saved to studio.config.json`);
    },
    async synth(text, out) {
      const voiceConfig = /^voice(key)?_/.test(voice) ? { voice } : { prebuiltVoiceConfig: { voiceName: voice } };
      const res = await gemini(`${GEMINI_API}/models/${model}:generateContent`, {
        contents: [{ role: "user", parts: [{ text }] }],
        generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig } },
      });
      const part = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
      if (!part) throw new Error("Gemini returned no audio: " + JSON.stringify(res).slice(0, 300));
      const { mimeType, data } = part.inlineData;
      const isWav = /wav/.test(mimeType);
      const src = tmp(out, isWav ? "wav" : "pcm");
      fs.writeFileSync(src, Buffer.from(data, "base64"));
      const lead = finishClip(src, out, isWav ? undefined : { pcm: true, rate: Number(/rate=(\d+)/.exec(mimeType)?.[1] ?? 24000) });
      fs.rmSync(src, { force: true });
      return { lead };
    },
  };
};

// ---------------------------------------------------------------- ElevenLabs
const elevenTTS = (cfg) => {
  const e = cfg.voice.elevenlabs ?? {};
  return {
    name: "elevenlabs",
    async prepare() {
      if (!e.voiceId) throw new Error("Set voice.elevenlabs.voiceId in studio.config.json (list voices: npm run voices)");
      requireKey("elevenlabs", "ElevenLabs voice");
    },
    async synth(text, out) {
      const key = requireKey("elevenlabs", "ElevenLabs voice");
      const res = await http(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(e.voiceId)}/with-timestamps?output_format=mp3_44100_128`, {
        method: "POST",
        headers: { "content-type": "application/json", "xi-api-key": key },
        body: JSON.stringify({
          text,
          model_id: e.model ?? "eleven_multilingual_v2",
          voice_settings: {
            stability: e.stability ?? 0.45,
            similarity_boost: e.similarity ?? 0.8,
            style: e.style ?? 0.2,
            use_speaker_boost: true,
            ...(e.speed ? { speed: e.speed } : {}),
          },
        }),
      });
      const src = tmp(out, "mp3");
      fs.writeFileSync(src, Buffer.from(res.audio_base64, "base64"));
      const lead = finishClip(src, out);
      fs.rmSync(src, { force: true });
      // characters -> words
      const al = res.alignment ?? res.normalized_alignment;
      const words = [];
      if (al?.characters?.length) {
        let cur = null;
        al.characters.forEach((ch, i) => {
          const s = al.character_start_times_seconds[i];
          const en = al.character_end_times_seconds[i];
          if (/\s/.test(ch)) {
            if (cur) words.push(cur);
            cur = null;
          } else if (!cur) cur = { text: ch, start: s, end: en };
          else {
            cur.text += ch;
            cur.end = en;
          }
        });
        if (cur) words.push(cur);
      }
      return { lead, words: words.map((w) => ({ ...w, start: Math.max(0, w.start - lead), end: Math.max(0, w.end - lead) })) };
    },
  };
};

// ---------------------------------------------------------------- OpenAI
const openaiTTS = (cfg) => {
  const o = cfg.voice.openai ?? {};
  return {
    name: "openai",
    async prepare() {
      requireKey("openai", "OpenAI voice");
    },
    async synth(text, out) {
      const key = requireKey("openai", "OpenAI voice");
      const res = await http("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        raw: true,
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: o.model ?? "gpt-4o-mini-tts", voice: o.voice ?? "sage", input: text, instructions: o.instructions, response_format: "wav" }),
      });
      const src = tmp(out, "wav");
      fs.writeFileSync(src, Buffer.from(await res.arrayBuffer()));
      const lead = finishClip(src, out);
      fs.rmSync(src, { force: true });
      return { lead };
    },
  };
};

// ---------------------------------------------------------------- your own audio
const fileTTS = () => ({
  name: "file",
  async prepare() {},
  async synth(_text, out, beat, ep) {
    const dir = `public/${ep}/audio-src`;
    const found = ["wav", "mp3", "m4a", "aac", "flac", "ogg"].map((x) => path.join(dir, `${beat.id}.${x}`)).find((f) => fs.existsSync(f));
    if (!found) throw new Error(`Missing ${dir}/${beat.id}.(wav|mp3|m4a…) — record it, or generate it with any TTS tool and save it there`);
    return { lead: finishClip(found, out) };
  },
});

export const getTTS = (cfg) => {
  const p = cfg.voice?.provider;
  if (p === "gemini") return geminiTTS(cfg);
  if (p === "elevenlabs") return elevenTTS(cfg);
  if (p === "openai") return openaiTTS(cfg);
  if (p === "file") return fileTTS(cfg);
  throw new Error(`Unknown voice.provider "${p}" (gemini | elevenlabs | openai | file)`);
};
