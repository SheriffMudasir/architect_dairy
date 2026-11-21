// Shared helpers for the studio scripts.
// Run scripts through `npm run …` so .env is loaded and Node uses the HTTP proxy if one is set.
import fs from "node:fs";
import { execFileSync } from "node:child_process";

// ---------------------------------------------------------------- config
export const CONFIG_FILE = "studio.config.json";
export const loadConfig = () => {
  if (!fs.existsSync(CONFIG_FILE)) throw new Error(`${CONFIG_FILE} not found — run: npm run setup`);
  return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
};

// ---------------------------------------------------------------- keys
// API keys are only ever read from environment variables (.env is loaded by npm scripts).
// They are never printed, logged or written to disk by these scripts.
export const KEY_VARS = {
  gemini: ["GEMINI_API_KEY", "GOOGLE_API_KEY", "Gemini_API_key"],
  elevenlabs: ["ELEVENLABS_API_KEY", "XI_API_KEY"],
  openai: ["OPENAI_API_KEY"],
  pexels: ["PEXELS_API_KEY"],
  pixabay: ["PIXABAY_API_KEY"],
};
export const keyFor = (provider) => {
  for (const v of KEY_VARS[provider] ?? []) if (process.env[v]) return process.env[v];
  return null;
};
/** Some sandboxes inject keys at the network proxy: STUDIO_KEYS_VIA_PROXY=gemini,elevenlabs */
export const viaProxy = (provider) => (process.env.STUDIO_KEYS_VIA_PROXY ?? "").split(",").map((s) => s.trim()).includes(provider);
export const keyOrProxy = (provider) => keyFor(provider) ?? (viaProxy(provider) ? "injected-by-proxy" : null);
export const requireKey = (provider, purpose) => {
  const k = keyOrProxy(provider);
  if (!k) throw new Error(`${purpose} needs ${KEY_VARS[provider][0]} — add it to .env (never paste keys into chat). Run: npm run doctor`);
  return k;
};

// ---------------------------------------------------------------- http
export const http = async (url, { method = "GET", headers = {}, body, json = true, raw = false, tries = 4, timeoutMs = 300_000 } = {}) => {
  for (let attempt = 1; attempt <= tries; attempt++) {
    let res;
    try {
      // a stalled connection must not hang the pipeline forever
      res = await fetch(url, { method, headers, body, signal: AbortSignal.timeout(timeoutMs) });
    } catch (e) {
      if (attempt < tries && (e.name === "TimeoutError" || e.name === "AbortError" || e.cause?.code === "ECONNRESET")) {
        console.warn(`  request ${e.name === "TimeoutError" ? "timed out" : "failed"}, retrying…`);
        continue;
      }
      throw e;
    }
    if (res.ok) {
      if (raw) return res;
      return json ? res.json() : res.text();
    }
    const text = await res.text();
    if (attempt < tries && (res.status === 429 || res.status >= 500)) {
      console.warn(`  ${res.status}, retrying…`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
      continue;
    }
    // never echo request headers (they may contain keys)
    throw new Error(`${method} ${url.toString().replace(/key=[^&]+/, "key=***")} -> ${res.status}: ${text.slice(0, 600)}`);
  }
};

export const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta";
export const API = GEMINI_API; // back-compat
export const gemini = (url, body, method = "POST") =>
  http(url, {
    method,
    headers: { "content-type": "application/json", "x-goog-api-key": requireKey("gemini", "Gemini") },
    body: body ? JSON.stringify(body) : undefined,
  });

// ---------------------------------------------------------------- episodes
/** Split argv into the episode id (first epNN arg) and the rest. */
export const parseArgs = () => {
  const argv = process.argv.slice(2);
  const ep = argv.find((a) => /^ep\d+$/.test(a)) ?? process.env.EP;
  if (!ep) throw new Error("Pass an episode id, e.g. ep01");
  const rest = argv.filter((a) => a !== ep);
  if (!fs.existsSync(`src/${ep}/script.ts`)) throw new Error(`No episode at src/${ep}/script.ts`);
  return { ep, rest };
};
export const loadScript = async (ep) => (await import(new URL(`../src/${ep}/script.ts`, import.meta.url))).SCRIPT;
export const timelinePath = (ep) => `public/${ep}/timeline.json`;
export const readTimeline = (ep) => JSON.parse(fs.readFileSync(timelinePath(ep), "utf8"));
export const writeTimeline = (ep, tl) => fs.writeFileSync(timelinePath(ep), JSON.stringify(tl, null, 1));

// ---------------------------------------------------------------- audio
export const duration = (f) =>
  Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim());

export const silences = (f, db = -38, min = 0.16) => {
  const log = `${f}.silence.log`;
  try {
    execFileSync("sh", ["-c", `ffmpeg -hide_banner -i "${f}" -af silencedetect=n=${db}dB:d=${min} -f null - 2> "${log}"`]);
  } catch {
    /* ffmpeg writes to stderr; exit code is fine to ignore */
  }
  const txt = fs.existsSync(log) ? fs.readFileSync(log, "utf8") : "";
  fs.rmSync(log, { force: true });
  const starts = [...txt.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
  const ends = [...txt.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
  return starts.map((s, i) => ({ s, e: ends[i] ?? s })).filter((p) => p.e > p.s);
};

/**
 * Normalise a raw clip: trim leading/trailing silence, loudness to -14 LUFS, 48 kHz mono wav.
 * Returns the seconds trimmed from the start (so provider word timestamps can be shifted).
 * rawFormat: { pcm: true, rate } for headerless 16-bit PCM.
 */
export const finishClip = (input, output, rawFormat) => {
  const pcm = rawFormat?.pcm ? ["-f", "s16le", "-ar", String(rawFormat.rate ?? 24000), "-ac", "1"] : [];
  // measure leading silence on a decoded copy
  const probe = `${output}.probe.wav`;
  execFileSync("ffmpeg", ["-v", "error", "-y", ...pcm, "-i", input, "-ar", "48000", "-ac", "1", probe]);
  const first = silences(probe, -45, 0.05)[0];
  const lead = first && first.s < 0.02 ? Math.max(0, first.e - 0.04) : 0;
  execFileSync("ffmpeg", [
    "-v", "error", "-y", "-ss", lead.toFixed(3), "-i", probe,
    "-af", "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.12,areverse,loudnorm=I=-14:TP=-1.2:LRA=7",
    "-ar", "48000", "-ac", "1", output,
  ]);
  fs.rmSync(probe, { force: true });
  return lead;
};
