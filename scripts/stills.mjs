// Render preview stills (half resolution) for an episode.
//   node scripts/stills.mjs <ep> <outDir> beats        -> 50% and 90% of every beat
//   node scripts/stills.mjs <ep> <outDir> 12.5 40 61   -> specific seconds
// Then tile them: ffmpeg -pattern_type glob -i '<outDir>/*.png' -vf "scale=270:-1,tile=7x4" sheet.jpg
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";

const [ep, outDir, ...rest] = process.argv.slice(2);
if (!ep || !outDir) throw new Error("usage: node scripts/stills.mjs <ep> <outDir> beats|<seconds…>");
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const id = await compositionIdFor(ep);
const comp = await selectComposition({ serveUrl, id, browserExecutable, inputProps: { episodeId: ep, timeline: null } });
const tl = comp.props.timeline;
let times = rest.map(Number);
let names = rest;
if (rest[0] === "beats") {
  times = [];
  names = [];
  for (const b of tl.beats) {
    for (const f of [0.5, 0.9]) {
      times.push(b.start + (b.end - b.start) * f);
      names.push(`${b.id}-${f}`);
    }
  }
}
for (let i = 0; i < times.length; i++) {
  const frame = Math.min(comp.durationInFrames - 1, Math.round(times[i] * comp.fps));
  const output = path.join(outDir, `${String(i).padStart(2, "0")}-${names[i]}.png`);
  await renderStill({ serveUrl, composition: comp, frame, output, scale: 0.5, inputProps: comp.props, browserExecutable });
  console.log(output);
}

async function compositionIdFor(ep) {
  // compositionId lives in src/<ep>/index.ts: `compositionId: "Ep02Something"`
  const src = fs.readFileSync(`src/${ep}/index.ts`, "utf8");
  const m = /compositionId:\s*"([^"]+)"/.exec(src);
  if (!m) throw new Error(`No compositionId in src/${ep}/index.ts`);
  return m[1];
}
