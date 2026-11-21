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
  // master to -14 LUFS (social platforms' reference) without re-encoding video
  const tmp = out.replace(/\.mp4$/, ".master.mp4");
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", out, "-c:v", "copy", "-af", "loudnorm=I=-14:TP=-1.5:LRA=9", "-c:a", "aac", "-b:a", "192k", tmp]);
  fs.renameSync(tmp, out);
  console.log(`\n${out}  loudness before mastering: ${I} LUFS -> mastered to -14 LUFS`);
}
