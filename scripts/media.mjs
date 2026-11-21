// Find and download licensed stock media for an episode, recording credits.
//
//   npm run media -- ep01 search "Japan National Stadium" [20] [--provider pexels] [--video]
//   npm run media -- ep01 get <provider:id> <name>       # -> public/ep01/media/<name>.jpg|.mp4
//   npm run media -- ep01 credits                         # credits text for the video description
//
// Providers: studio.config.json -> media.providers (openverse | pexels | pixabay | wikimedia).
// Only licences that allow commercial use AND modification are accepted (we crop, tint, animate).
// Every download is appended to public/<ep>/media/credits.json, which drives the in-video credits.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { http, loadConfig, parseArgs } from "./lib.mjs";
import { getMedia, UA_HEADERS } from "./providers/media.mjs";

const { ep, rest } = parseArgs();
const cfg = loadConfig();
const flag = (n) => {
  const i = rest.indexOf(n);
  return i >= 0 ? rest[i + 1] : undefined;
};
const positional = rest.filter((a, i) => !a.startsWith("--") && !(i > 0 && rest[i - 1] === "--provider"));
const [cmd, a, b] = positional;
const DIR = `public/${ep}/media`;
const CREDITS = `${DIR}/credits.json`;
fs.mkdirSync(DIR, { recursive: true });

const credits = () => (fs.existsSync(CREDITS) ? JSON.parse(fs.readFileSync(CREDITS, "utf8")) : []);
const saveCredit = (c) => fs.writeFileSync(CREDITS, JSON.stringify([...credits().filter((x) => x.name !== c.name), c], null, 2));

if (cmd === "search") {
  const providers = flag("--provider") ? [flag("--provider")] : cfg.media?.providers ?? ["openverse"];
  const type = rest.includes("--video") ? "video" : "photo";
  for (const name of providers) {
    try {
      const results = await getMedia(cfg, name).search(a, Number(b ?? 15), type);
      if (!results.length) continue;
      console.log(`── ${name} (${type}s)`);
      for (const r of results)
        console.log(`${r.id.padEnd(48)} ${String(r.w ?? "?").padStart(5)}x${String(r.h ?? "?").padEnd(5)}${r.dur ? ` ${r.dur}s` : ""} ${String(r.license).padEnd(22)} ${String(r.title ?? "").slice(0, 50)} — ${String(r.creator ?? "").slice(0, 28)}`);
    } catch (e) {
      console.log(`── ${name}: ${e.message.split("\n")[0]}`);
    }
  }
} else if (cmd === "get") {
  const [prov, ...idParts] = a.split(":");
  const id = idParts.join(":");
  const r = await getMedia(cfg, prov).resolve(id);
  const isVideo = r.type === "video";
  const out = `${DIR}/${b}.${isVideo ? "mp4" : "jpg"}`;
  const tmp = `${out}.src`;
  let buf;
  try {
    buf = Buffer.from(await (await http(r.url, { raw: true, headers: UA_HEADERS(cfg) })).arrayBuffer());
  } catch (e) {
    if (!r.fallback) throw e;
    console.warn("  full-size download failed, using the provider's thumbnail");
    buf = Buffer.from(await (await http(r.fallback, { raw: true, headers: UA_HEADERS(cfg) })).arrayBuffer());
  }
  fs.writeFileSync(tmp, buf);
  if (isVideo)
    // 1080 wide, 30 fps, silent, ≤ 12 s, frequent keyframes for smooth seeking
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", tmp, "-t", "12", "-an", "-vf", "scale=1080:-2,fps=30", "-c:v", "libx264", "-crf", "20", "-g", "15", "-pix_fmt", "yuv420p", out]);
  else execFileSync("ffmpeg", ["-v", "error", "-y", "-i", tmp, "-vf", "scale='if(gt(iw,ih),min(2000,iw),-2)':'if(gt(iw,ih),-2,min(2000,ih))'", "-q:v", "3", out]);
  fs.rmSync(tmp, { force: true });
  saveCredit({ name: b, file: out.replace(/^public\//, ""), provider: prov, ...r.credit });
  console.log(`saved ${out}`);
} else if (cmd === "credits") {
  for (const c of credits()) console.log(`${c.title} — ${c.creator ?? "unknown"} (${c.license}) ${c.source}`);
} else {
  console.log('usage: npm run media -- <ep> search "<query>" [n] [--provider name] [--video] | get <provider:id> <name> | credits');
}
