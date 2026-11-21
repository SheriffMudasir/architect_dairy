// Generate an episode's AI images and (few, budgeted) AI video clips, declared in script.ts -> generate.
//
//   npm run gen -- ep03            # preview: what would be generated + rough cost (generates nothing)
//   npm run gen -- ep03 --yes      # generate everything new (cached items are skipped)
//   npm run gen -- ep03 --yes --only hook-key,hook-clip   # (re)generate specific items
//   npm run gen -- ep03 --yes --force                     # ignore the cache
//
// Images are cheap: use them generously (animated in Remotion with moves/sweeps).
// Video is expensive: capped by studio.config.json -> generate.video.maxPerEpisode (default 3).
// Output: public/<ep>/media/<name>.jpg|.mp4 + a credits entry labelled "AI visualisation".
import fs from "node:fs";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { loadConfig, loadScript, parseArgs } from "./lib.mjs";
import { ESTIMATE, getImageGen, getVideoGen } from "./providers/generate.mjs";

const { ep, rest } = parseArgs();
const cfg = loadConfig();
const script = await loadScript(ep);
const G = script.generate ?? { images: [], videos: [] };
const yes = rest.includes("--yes");
const force = rest.includes("--force");
const onlyArg = rest[rest.indexOf("--only") + 1];
const only = rest.includes("--only") ? onlyArg.split(",") : null;
const maxVideos = cfg.generate?.video?.maxPerEpisode ?? 3;

const DIR = `public/${ep}/media`;
const MANIFEST = `public/${ep}/gen-manifest.json`;
const CREDITS = `${DIR}/credits.json`;
fs.mkdirSync(DIR, { recursive: true });
const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};
const credits = () => (fs.existsSync(CREDITS) ? JSON.parse(fs.readFileSync(CREDITS, "utf8")) : []);
const saveCredit = (c) => fs.writeFileSync(CREDITS, JSON.stringify([...credits().filter((x) => x.name !== c.name), c], null, 2));

const imgGen = getImageGen(cfg);
const vidGen = getVideoGen(cfg);
const style = G.style ? `\n\nStyle: ${G.style}` : "";
const subject = (s) => (s && G.subjects?.[s] ? `\n\nSubject (keep exactly consistent): ${G.subjects[s]}` : "");
const fullPrompt = (it) => `${it.prompt}${subject(it.subject)}${style}\nVertical 9:16 frame. No text, no captions, no logos, no watermarks.`;
const hash = (o) => crypto.createHash("sha1").update(JSON.stringify(o)).digest("hex").slice(0, 12);

if ((G.videos ?? []).length > maxVideos)
  throw new Error(`${G.videos.length} video clips declared, budget is ${maxVideos} (generate.video.maxPerEpisode). Replace some with images, 3D or stock.`);

const plan = [];
for (const it of G.images ?? []) {
  const h = hash({ p: fullPrompt(it), m: imgGen.name, refs: it.refs ?? [] });
  const out = `${DIR}/${it.name}.jpg`;
  const cached = !force && manifest[it.name]?.hash === h && fs.existsSync(out);
  if (!only || only.includes(it.name)) plan.push({ kind: "image", it, h, out, cached: cached && !only });
}
for (const it of G.videos ?? []) {
  const h = hash({ p: fullPrompt(it), m: vidGen.name, from: it.from ?? null, d: it.duration ?? "6s" });
  const out = `${DIR}/${it.name}.mp4`;
  const cached = !force && manifest[it.name]?.hash === h && fs.existsSync(out);
  if (!only || only.includes(it.name)) plan.push({ kind: "video", it, h, out, cached: cached && !only });
}

const todo = plan.filter((p) => !p.cached);
const nImg = todo.filter((p) => p.kind === "image").length;
const vids = todo.filter((p) => p.kind === "video");
const vidSecs = vids.reduce((a, p) => a + parseFloat(p.it.duration ?? "6"), 0);
console.log(`Episode ${ep}: ${plan.length} item(s), ${plan.length - todo.length} cached.`);
console.log(`To generate: ${nImg} image(s) with ${imgGen.name}, ${vids.length} video clip(s) (${vidSecs}s) with ${vidGen.name}.`);
console.log(`Rough output tokens: images ≈ ${(nImg * ESTIMATE.imageTokens).toLocaleString()}, video ≈ ${Math.round(vidSecs * ESTIMATE.videoTokensPerSecond).toLocaleString()} (check your provider's pricing).`);
if (!yes) {
  for (const p of todo) console.log(`  • ${p.kind.padEnd(5)} ${p.it.name}${p.it.from ? ` (from ${p.it.from})` : ""}`);
  console.log("\nNothing generated. Ask the user to approve, then re-run with --yes.");
  process.exit(0);
}

// images first (video keyframes depend on them)
for (const p of todo.filter((x) => x.kind === "image")) {
  const raw = `${p.out}.src`;
  const refs = (p.it.refs ?? []).map((r) => (fs.existsSync(`${DIR}/${r}.jpg`) ? `${DIR}/${r}.jpg` : r)).filter((f) => fs.existsSync(f));
  const r = await imgGen.generate(fullPrompt(p.it), raw, { refs, aspect: p.it.aspect ?? "9:16", name: p.it.name, ep });
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", raw, "-vf", "scale='min(1440,iw)':-2", "-q:v", "2", p.out]);
  fs.rmSync(raw, { force: true });
  manifest[p.it.name] = { hash: p.h, kind: "image", model: imgGen.name, prompt: fullPrompt(p.it), tokens: r.tokens, at: new Date().toISOString() };
  saveCredit({ name: p.it.name, file: p.out.replace(/^public\//, ""), provider: "ai", title: p.it.prompt.slice(0, 80), creator: "AI visualisation", license: `Generated (${imgGen.name})`, source: "" });
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log(`  ✓ image ${p.it.name}`);
}
for (const p of todo.filter((x) => x.kind === "video")) {
  const raw = `${p.out}.src.mp4`;
  const key = p.it.from ? `${DIR}/${p.it.from}.jpg` : undefined;
  if (key && !fs.existsSync(key)) throw new Error(`keyframe ${key} missing — declare/generate image "${p.it.from}" first`);
  console.log(`  … video ${p.it.name} (this takes ~30–90 s)`);
  const r = await vidGen.generate(fullPrompt(p.it), raw, { image: key, duration: p.it.duration ?? "6s", name: p.it.name, ep });
  // silent, 30 fps, frequent keyframes for smooth seeking in Remotion
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", raw, "-an", "-vf", "fps=30", "-c:v", "libx264", "-crf", "18", "-g", "15", "-pix_fmt", "yuv420p", p.out]);
  fs.rmSync(raw, { force: true });
  manifest[p.it.name] = { hash: p.h, kind: "video", model: vidGen.name, prompt: fullPrompt(p.it), from: p.it.from, tokens: r.tokens, at: new Date().toISOString() };
  saveCredit({ name: p.it.name, file: p.out.replace(/^public\//, ""), provider: "ai", title: p.it.prompt.slice(0, 80), creator: "AI visualisation", license: `Generated (${vidGen.name})`, source: "" });
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log(`  ✓ video ${p.it.name}${r.tokens ? ` (${r.tokens.toLocaleString()} tokens)` : ""}`);
}
console.log("Done. Inspect: make a contact sheet of public/" + ep + "/media before using (AI makes mistakes — wrong geometry, garbled text).");
