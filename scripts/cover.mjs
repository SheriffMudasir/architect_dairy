// Render a 1080×1920 cover image: big title (script.cover) over the frame at cover.beat (+offset).
//   npm run cover -- ep03      -> out/ep03-cover.png   (upload as the Reel/Short cover)
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";
import { loadScript, parseArgs } from "./lib.mjs";

const { ep } = parseArgs();
const script = await loadScript(ep);
if (!script.cover) throw new Error(`Add cover: { lines: ["…", "…"], beat: "<beat id>" } to src/${ep}/script.ts`);
const id = /compositionId:\s*"([^"]+)"/.exec(fs.readFileSync(`src/${ep}/index.ts`, "utf8"))[1];
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const inputProps = { episodeId: ep, timeline: null, credits: [], cover: true };
const comp = await selectComposition({ serveUrl, id, browserExecutable, inputProps });
const b = comp.props.timeline.beats.find((x) => x.id === script.cover.beat);
if (!b) throw new Error(`cover.beat "${script.cover.beat}" not in timeline`);
const frame = Math.min(comp.durationInFrames - 1, Math.round((b.start + (script.cover.offset ?? (b.end - b.start) * 0.5)) * comp.fps));
fs.mkdirSync("out", { recursive: true });
const output = `out/${ep}-cover.png`;
await renderStill({ serveUrl, composition: comp, frame, output, inputProps: { ...comp.props, cover: true }, browserExecutable });
console.log(`cover: ${output} (frame ${frame})`);
