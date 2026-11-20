// Shared helpers for the episode scripts.
// Usage pattern: node --experimental-strip-types scripts/<x>.mjs <epNN> [args…]
import fs from "node:fs";

export const API = "https://generativelanguage.googleapis.com/v1beta";

// The key is normally injected by the sandbox proxy (network secret for
// generativelanguage.googleapis.com). Locally, export GEMINI_API_KEY.
export const headers = {
  "content-type": "application/json",
  "x-goog-api-key": process.env.GEMINI_API_KEY ?? process.env.Gemini_API_key ?? "injected-by-proxy",
};

export const gemini = async (url, body, method = "POST") => {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const text = await res.text();
    if (res.ok) return JSON.parse(text);
    if (attempt < 4 && (res.status === 429 || res.status >= 500)) {
      console.warn(`  ${res.status}, retrying…`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
      continue;
    }
    throw new Error(`${method} ${url} -> ${res.status}: ${text.slice(0, 800)}`);
  }
};

/** Split argv into the episode id (first epNN arg, default ep01) and the rest. */
export const parseArgs = () => {
  const argv = process.argv.slice(2);
  const ep = argv.find((a) => /^ep\d+$/.test(a)) ?? process.env.EP ?? "ep01";
  const rest = argv.filter((a) => a !== ep);
  if (!fs.existsSync(`src/${ep}/script.ts`)) throw new Error(`No episode at src/${ep}/script.ts`);
  return { ep, rest };
};

export const loadScript = async (ep) => (await import(new URL(`../src/${ep}/script.ts`, import.meta.url))).SCRIPT;

export const timelinePath = (ep) => `public/${ep}/timeline.json`;
export const readTimeline = (ep) => JSON.parse(fs.readFileSync(timelinePath(ep), "utf8"));
export const writeTimeline = (ep, tl) => fs.writeFileSync(timelinePath(ep), JSON.stringify(tl, null, 1));
