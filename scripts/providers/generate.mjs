// Generative media providers: AI still images (cheap) and AI video clips (expensive — budgeted).
// Endpoints contacted (only the ones you configure in studio.config.json -> generate):
//   image  gemini       POST https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent
//   video  gemini-omni  POST https://generativelanguage.googleapis.com/v1beta/interactions  (+ GET …/interactions/<id> to poll)
//   *      file         none — you supply public/<ep>/gen-src/<name>.(jpg|png|mp4) from any tool
import fs from "node:fs";
import { GEMINI_API, gemini, http, requireKey } from "../lib.mjs";

const geminiKeyHeaders = () => ({ "content-type": "application/json", "x-goog-api-key": requireKey("gemini", "Gemini generation") });

// ---------------------------------------------------------------- images
export const getImageGen = (cfg) => {
  const g = cfg.generate?.image ?? {};
  const p = g.provider ?? "gemini";
  if (p === "gemini")
    return {
      name: `gemini:${g.model ?? "gemini-3.1-flash-image"}`,
      /** refs: array of file paths used as visual references (for consistency) */
      async generate(prompt, outFile, { refs = [], aspect = "9:16" } = {}) {
        const parts = [
          ...refs.map((f) => ({ inlineData: { mimeType: f.endsWith(".png") ? "image/png" : "image/jpeg", data: fs.readFileSync(f).toString("base64") } })),
          { text: prompt },
        ];
        const res = await gemini(`${GEMINI_API}/models/${g.model ?? "gemini-3.1-flash-image"}:generateContent`, {
          contents: [{ role: "user", parts }],
          generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: aspect } },
        });
        const img = res.candidates?.[0]?.content?.parts?.find((x) => x.inlineData);
        if (!img) throw new Error("No image returned: " + JSON.stringify(res).slice(0, 300));
        fs.writeFileSync(outFile, Buffer.from(img.inlineData.data, "base64"));
        return { tokens: res.usageMetadata?.candidatesTokenCount };
      },
    };
  if (p === "file")
    return {
      name: "file",
      async generate(_prompt, outFile, { name, ep }) {
        const src = ["jpg", "jpeg", "png", "webp"].map((x) => `public/${ep}/gen-src/${name}.${x}`).find((f) => fs.existsSync(f));
        if (!src) throw new Error(`Put the image at public/${ep}/gen-src/${name}.jpg (made with any image tool)`);
        fs.copyFileSync(src, outFile);
        return {};
      },
    };
  throw new Error(`Unknown generate.image.provider "${p}" (gemini | file)`);
};

// ---------------------------------------------------------------- video
export const getVideoGen = (cfg) => {
  const v = cfg.generate?.video ?? {};
  const p = v.provider ?? "gemini-omni";
  if (p === "gemini-omni")
    return {
      name: `gemini-omni:${v.model ?? "gemini-omni-1.2-flash"}`,
      /** image: optional keyframe path — the clip starts from it (keeps the subject consistent) */
      async generate(prompt, outFile, { image, duration = "6s", aspect = "9:16" } = {}) {
        const input = image
          ? [{ type: "image", mime_type: image.endsWith(".png") ? "image/png" : "image/jpeg", data: fs.readFileSync(image).toString("base64") }, { type: "text", text: prompt }]
          : prompt;
        const start = await http(`${GEMINI_API}/interactions`, {
          method: "POST",
          headers: geminiKeyHeaders(),
          body: JSON.stringify({
            model: v.model ?? "gemini-omni-1.2-flash",
            input,
            response_format: { type: "video", aspect_ratio: aspect, duration, delivery: "inline", ...(v.resolution ? { resolution: v.resolution } : {}) },
            background: true,
          }),
        });
        let job = start;
        for (let i = 0; i < 120 && job.status === "in_progress"; i++) {
          await new Promise((r) => setTimeout(r, 8000));
          job = await http(`${GEMINI_API}/interactions/${start.id}`, { headers: geminiKeyHeaders() });
        }
        if (job.status !== "completed") throw new Error(`video job ${start.id} ended as ${job.status}: ${JSON.stringify(job).slice(0, 300)}`);
        const media = (job.steps ?? []).flatMap((s) => s.content ?? []).find((c) => c.type === "video" && c.data);
        if (!media) throw new Error("No video in response: " + JSON.stringify(job).slice(0, 300));
        fs.writeFileSync(outFile, Buffer.from(media.data, "base64"));
        return { tokens: job.usage?.total_output_tokens };
      },
    };
  if (p === "file")
    return {
      name: "file",
      async generate(_prompt, outFile, { name, ep }) {
        const src = `public/${ep}/gen-src/${name}.mp4`;
        if (!fs.existsSync(src)) throw new Error(`Put the clip at ${src} (made with any video tool — e.g. Veo, Kling, Seedance)`);
        fs.copyFileSync(src, outFile);
        return {};
      },
    };
  throw new Error(`Unknown generate.video.provider "${p}" (gemini-omni | file)`);
};

// rough output-token estimates, for the cost preview only
export const ESTIMATE = { imageTokens: 1500, videoTokensPerSecond: 5800 };
