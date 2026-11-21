// Music providers. Each writes raw audio to a temp file and returns { file, rawFormat?, notes? }.
//
// Endpoints contacted (only the one you configure):
//   lyria       POST https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent
//   elevenlabs  POST https://api.elevenlabs.io/v1/music
//   file        none — uses public/<ep>/music-src.(mp3|wav|m4a) that you supply (licensed music)
//   none        no music
import fs from "node:fs";
import { GEMINI_API, gemini, http, requireKey } from "../lib.mjs";

export const getMusic = (cfg) => {
  const p = cfg.music?.provider ?? "none";
  if (p === "lyria")
    return {
      name: "lyria",
      async generate(prompt, seconds, tmpBase) {
        const model = cfg.music.lyria?.model ?? "lyria-3.5";
        const json = await gemini(`${GEMINI_API}/models/${model}:generateContent`, {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["AUDIO"] },
        });
        const parts = json.candidates?.[0]?.content?.parts ?? [];
        const audio = parts.find((x) => x.inlineData);
        if (!audio) throw new Error("Lyria returned no audio: " + JSON.stringify(json).slice(0, 300));
        const { mimeType, data } = audio.inlineData;
        const ext = /mpeg|mp3/.test(mimeType) ? "mp3" : /wav/.test(mimeType) ? "wav" : "pcm";
        const file = `${tmpBase}.${ext}`;
        fs.writeFileSync(file, Buffer.from(data, "base64"));
        return {
          file,
          rawFormat: ext === "pcm" ? { pcm: true, rate: Number(/rate=(\d+)/.exec(mimeType)?.[1] ?? 48000), channels: 2 } : undefined,
          notes: parts.filter((x) => x.text).map((x) => x.text).join("\n"),
        };
      },
    };
  if (p === "elevenlabs")
    return {
      name: "elevenlabs",
      async generate(prompt, seconds, tmpBase) {
        const key = requireKey("elevenlabs", "ElevenLabs music");
        const ms = Math.round(Math.min(seconds, cfg.music.elevenlabs?.maxSeconds ?? 300) * 1000);
        const res = await http("https://api.elevenlabs.io/v1/music", {
          method: "POST",
          raw: true,
          headers: { "content-type": "application/json", "xi-api-key": key },
          body: JSON.stringify({ prompt, music_length_ms: ms, force_instrumental: true }),
        });
        const file = `${tmpBase}.mp3`;
        const type = res.headers.get("content-type") ?? "";
        if (type.includes("json")) {
          const j = await res.json();
          fs.writeFileSync(file, Buffer.from(j.audio_base64 ?? j.audio, "base64"));
        } else fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
        return { file };
      },
    };
  if (p === "file")
    return {
      name: "file",
      async generate(_prompt, _seconds, _tmp, ep) {
        const f = ["mp3", "wav", "m4a", "flac", "ogg"].map((x) => `public/${ep}/music-src.${x}`).find((x) => fs.existsSync(x));
        if (!f) throw new Error(`Put a licensed track at public/${ep}/music-src.mp3 (or .wav/.m4a)`);
        return { file: f, keep: true };
      },
    };
  if (p === "none") return { name: "none", async generate() { return null; } };
  throw new Error(`Unknown music.provider "${p}" (lyria | elevenlabs | file | none)`);
};
