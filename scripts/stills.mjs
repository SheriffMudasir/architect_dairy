// Render preview stills: node scripts/stills.mjs <outDir> <sec> <sec> ...
// or: node scripts/stills.mjs <outDir> beats   (middle + 85% of every beat)
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";

const [outDir, ...rest] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const comp = await selectComposition({ serveUrl, id: "Ep01TokyoStadium", browserExecutable });
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
