// Render an episode to out/<ep>.mp4 (or --silent for an animatic) and report loudness.
//   npm run render -- ep02
//   npm run render -- ep02 --silent      (animatic: estimated timing, no audio needed)
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { parseArgs } from "./lib.mjs";

const { ep, rest } = parseArgs();
const id = /compositionId:\s*"([^"]+)"/.exec(fs.readFileSync(`src/${ep}/index.ts`, "utf8"))[1];
const out = `out/${ep}${rest.includes("--silent") ? "-animatic" : ""}.mp4`;
fs.mkdirSync("out", { recursive: true });
execFileSync(
  "npx",
  ["remotion", "render", id, out, "--codec=h264", "--crf=18", "--audio-bitrate=192k", "--concurrency=4", ...(rest.includes("--silent") ? ["--muted"] : [])],
  { stdio: "inherit" },
);
if (!rest.includes("--silent")) {
  let log = "";
  try {
    execFileSync("sh", ["-c", `ffmpeg -hide_banner -i "${out}" -af ebur128 -f null - 2> "${out}.log"`]);
    log = fs.readFileSync(`${out}.log`, "utf8");
  } finally {
    fs.rmSync(`${out}.log`, { force: true });
  }
  const I = /I:\s+(-?[\d.]+) LUFS/.exec(log.slice(log.lastIndexOf("Summary")))?.[1];
  console.log(`\n${out}  integrated loudness: ${I} LUFS (target ≈ -14 for social)`);
}
