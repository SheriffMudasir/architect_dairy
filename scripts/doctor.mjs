// Check that everything the configured pipeline needs is in place.
// Prints "set"/"missing" for keys — never their values.
//   npm run doctor
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { CONFIG_FILE, KEY_VARS, keyOrProxy, viaProxy } from "./lib.mjs";

let bad = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const no = (m, fix) => {
  bad++;
  console.log(`  ✗ ${m}${fix ? `\n      → ${fix}` : ""}`);
};
const warn = (m) => console.log(`  ! ${m}`);

console.log("Tools");
const [maj] = process.versions.node.split(".").map(Number);
maj >= 20 ? ok(`Node ${process.versions.node}`) : no(`Node ${process.versions.node}`, "install Node 20 or newer");
for (const bin of ["ffmpeg", "ffprobe"]) {
  try {
    execFileSync(bin, ["-version"], { stdio: "ignore" });
    ok(bin);
  } catch {
    no(`${bin} not found`, "install FFmpeg (brew install ffmpeg / apt-get install ffmpeg / winget install ffmpeg)");
  }
}
fs.existsSync("node_modules/remotion") ? ok("npm packages installed") : no("npm packages missing", "npm install");
if (process.env.REMOTION_BROWSER) fs.existsSync(process.env.REMOTION_BROWSER) ? ok("REMOTION_BROWSER found") : no("REMOTION_BROWSER path does not exist");
else warn("Remotion downloads its own headless Chrome on first render (needs internet), or set REMOTION_BROWSER");

console.log("Config");
if (!fs.existsSync(CONFIG_FILE)) {
  no(`${CONFIG_FILE} missing`, "npm run setup -- …");
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
ok(`voice: ${cfg.voice?.provider} · music: ${cfg.music?.provider} · media: ${(cfg.media?.providers ?? []).join(", ")} · transcribe: ${cfg.transcribe?.provider || "auto"}`);
if (cfg.voice?.provider === "elevenlabs" && !cfg.voice.elevenlabs?.voiceId) no("voice.elevenlabs.voiceId is empty", "npm run voices, then npm run setup -- --elevenlabs-voice <id>");
if (cfg.voice?.provider === "gemini" && !cfg.voice.gemini?.voice && !cfg.voice.gemini?.design?.prompt) warn("no Gemini voice set — the built-in voice 'Kore' will be used");

const need = new Set();
if (["gemini", "elevenlabs", "openai"].includes(cfg.voice?.provider)) need.add(cfg.voice.provider);
if (cfg.music?.provider === "lyria") need.add("gemini");
if (cfg.music?.provider === "elevenlabs") need.add("elevenlabs");
if (["gemini", "elevenlabs", "openai"].includes(cfg.transcribe?.provider)) need.add(cfg.transcribe.provider);
for (const m of cfg.media?.providers ?? []) if (m === "pexels" || m === "pixabay") need.add(m);
need.add("openverse-check");

console.log("Keys & access (one cheap authenticated request each)");
const ping = {
  gemini: (k) => fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1", { headers: { "x-goog-api-key": k } }),
  elevenlabs: (k) => fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": k } }),
  openai: (k) => fetch("https://api.openai.com/v1/models", { headers: { authorization: `Bearer ${k}` } }),
  pexels: (k) => fetch("https://api.pexels.com/v1/search?query=city&per_page=1", { headers: { authorization: k } }),
  pixabay: (k) => fetch(`https://pixabay.com/api/?key=${k}&q=city&per_page=3`),
};
for (const p of need) {
  if (p === "openverse-check") continue;
  const k = keyOrProxy(p);
  if (!k) {
    no(`${KEY_VARS[p][0]} missing`, `add ${KEY_VARS[p][0]}=… to .env (see .env.example) — never paste it into chat`);
    continue;
  }
  try {
    const r = await ping[p](k);
    r.ok ? ok(`${p}: key ${viaProxy(p) ? "injected by proxy" : "set"}, API reachable`) : no(`${p}: API answered ${r.status}`, r.status === 401 || r.status === 403 ? "check the key / its permissions" : "check plan or network");
  } catch (e) {
    no(`${p}: cannot reach the API (${e.cause?.code ?? e.message})`, "network/firewall: allow the provider's host");
  }
}
if ((cfg.media?.providers ?? []).includes("openverse")) {
  try {
    const r = await fetch("https://api.openverse.org/v1/images/?q=city&page_size=1");
    r.ok ? ok("openverse reachable (no key needed)") : no(`openverse answered ${r.status}`);
  } catch (e) {
    no(`openverse unreachable (${e.cause?.code ?? e.message})`);
  }
}
console.log(bad ? `\n${bad} problem(s) to fix.` : "\nAll good — ready to make an episode.");
process.exit(bad ? 1 : 0);
