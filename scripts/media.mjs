// Find and download licensed stock media for an episode, recording credits.
//
//   npm run media -- ep01 search "Japan National Stadium"     # Openverse photos (CC0 / BY / BY-SA only)
//   npm run media -- ep01 get <openverse-id> <name>           # -> public/ep01/media/<name>.jpg
//   npm run media -- ep01 pexels-video "tokyo night" [n]      # Pexels videos (needs Pexels network secret)
//   npm run media -- ep01 pexels-get-video <id> <name>        # -> public/ep01/media/<name>.mp4
//   npm run media -- ep01 credits                             # print credits text for the description
//
// Licences: only commercial-use + modification-allowed (we crop, tint and animate).
// Every download is appended to public/<ep>/media/credits.json.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { parseArgs } from "./lib.mjs";

const { ep, rest } = parseArgs();
const [cmd, a, b] = rest;
const DIR = `public/${ep}/media`;
const CREDITS = `${DIR}/credits.json`;
const UA = { "user-agent": "ArchitectDiaryVideoTool/1.0 (documentary renderer)" };
fs.mkdirSync(DIR, { recursive: true });

const credits = () => (fs.existsSync(CREDITS) ? JSON.parse(fs.readFileSync(CREDITS, "utf8")) : []);
const saveCredit = (c) => {
  const all = credits().filter((x) => x.name !== c.name);
  all.push(c);
  fs.writeFileSync(CREDITS, JSON.stringify(all, null, 2));
};
const get = async (url, opts = {}) => {
  for (let i = 1; i <= 4; i++) {
    const r = await fetch(url, { ...opts, headers: { ...UA, ...(opts.headers ?? {}) } });
    if (r.ok) return r;
    if (i < 4 && (r.status === 429 || r.status >= 500)) {
      await new Promise((res) => setTimeout(res, 3000 * i));
      continue;
    }
    throw new Error(`${url} -> ${r.status} ${(await r.text()).slice(0, 200)}`);
  }
};

const LICENSE_URL = (lic, v) =>
  lic === "cc0" ? "https://creativecommons.org/publicdomain/zero/1.0/" : lic === "pdm" ? "https://creativecommons.org/publicdomain/mark/1.0/" : `https://creativecommons.org/licenses/${lic}/${v}/`;

if (cmd === "search") {
  const u = new URL("https://api.openverse.org/v1/images/");
  u.searchParams.set("q", a);
  u.searchParams.set("page_size", b ?? "20");
  u.searchParams.set("license_type", "commercial,modification");
  const d = await (await get(u)).json();
  for (const r of d.results) {
    if (!["by", "by-sa", "cc0", "pdm"].includes(r.license)) continue;
    console.log(
      `${r.id}  ${String(r.width ?? "?").padStart(5)}x${String(r.height ?? "?").padEnd(5)} ${(r.license + r.license_version).padEnd(9)} ${r.source.padEnd(10)} ${r.title.slice(0, 60)}  — ${(r.creator ?? "").slice(0, 30)}`,
    );
  }
} else if (cmd === "get") {
  const r = await (await get(`https://api.openverse.org/v1/images/${a}/`)).json();
  if (!["by", "by-sa", "cc0", "pdm"].includes(r.license)) throw new Error(`licence ${r.license} not allowed`);
  const out = `${DIR}/${b}.jpg`;
  let buf;
  try {
    buf = Buffer.from(await (await get(r.url)).arrayBuffer());
  } catch (e) {
    console.warn("  full image failed (" + e.message.slice(0, 80) + "), using Openverse thumbnail");
    buf = Buffer.from(await (await get(r.thumbnail)).arrayBuffer());
  }
  const tmp = `${out}.src`;
  fs.writeFileSync(tmp, buf);
  // normalise: max 2000px long side, strip metadata, sRGB jpeg
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", tmp, "-vf", "scale='if(gt(iw,ih),min(2000,iw),-2)':'if(gt(iw,ih),-2,min(2000,ih))'", "-q:v", "3", out]);
  fs.unlinkSync(tmp);
  const dims = execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", out]).toString().trim();
  saveCredit({
    name: b,
    file: `${ep}/media/${b}.jpg`,
    title: r.title,
    creator: r.creator,
    license: `CC ${r.license.toUpperCase()} ${r.license_version ?? ""}`.trim(),
    license_url: r.license_url ?? LICENSE_URL(r.license, r.license_version),
    source: r.foreign_landing_url,
    attribution: r.attribution,
  });
  console.log(`saved ${out} (${dims})`);
} else if (cmd === "pexels-video") {
  const u = new URL("https://api.pexels.com/videos/search");
  u.searchParams.set("query", a);
  u.searchParams.set("per_page", b ?? "15");
  u.searchParams.set("orientation", "portrait");
  const d = await (await get(u, { headers: { authorization: process.env.PEXELS_API_KEY ?? "injected-by-proxy" } })).json();
  for (const v of d.videos) {
    const best = v.video_files.filter((f) => f.height >= 1280).sort((x, y) => x.height - y.height)[0];
    console.log(`${v.id}  ${v.width}x${v.height}  ${v.duration}s  ${best ? best.quality + " " + best.height + "p" : "low-res"}  ${v.url.replace("https://www.pexels.com/video/", "").slice(0, 60)}  — ${v.user.name}`);
  }
} else if (cmd === "pexels-get-video") {
  const v = await (await get(`https://api.pexels.com/videos/videos/${a}`, { headers: { authorization: process.env.PEXELS_API_KEY ?? "injected-by-proxy" } })).json();
  const file = v.video_files.filter((f) => f.height >= 1280 && f.file_type === "video/mp4").sort((x, y) => x.height - y.height)[0] ?? v.video_files[0];
  const tmp = `${DIR}/${b}.src.mp4`;
  fs.writeFileSync(tmp, Buffer.from(await (await get(file.link)).arrayBuffer()));
  // 1080-wide, 30 fps, no audio, max 12 s, constant keyframes for smooth seeking
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", tmp, "-t", "12", "-an", "-vf", "scale=1080:-2,fps=30", "-c:v", "libx264", "-crf", "20", "-g", "15", "-pix_fmt", "yuv420p", `${DIR}/${b}.mp4`]);
  fs.unlinkSync(tmp);
  saveCredit({ name: b, file: `${ep}/media/${b}.mp4`, title: v.url, creator: v.user.name, license: "Pexels License", license_url: "https://www.pexels.com/license/", source: v.url });
  console.log(`saved ${DIR}/${b}.mp4`);
} else if (cmd === "credits") {
  for (const c of credits()) console.log(`${c.title} — ${c.creator ?? "unknown"} (${c.license}) ${c.source}`);
} else {
  console.log("commands: search | get | pexels-video | pexels-get-video | credits");
}
