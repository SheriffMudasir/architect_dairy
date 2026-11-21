// Build the sellable skill package from this repo's tested code.
//   node tools/build-product.mjs            -> dist/isometric-explainer-studio/ + dist/isometric-explainer-studio-v<ver>.zip
// Personal material (channel name, voice ids, episodes, audio, media) is never copied, and the build
// fails if any known personal trace is found in the output.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "isometric-explainer-studio";
const VERSION = "1.0.0";
const OUT = path.join("dist", NAME);
const T = path.join(OUT, "template");

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(T, { recursive: true });
const cp = (from, to) => fs.cpSync(from, to, { recursive: true });
const write = (to, s) => {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.writeFileSync(to, s);
};

// ---------------- skill files
for (const f of ["SKILL.md", "README.md", "LICENSE.md", "THIRD_PARTY.md"]) cp(`product-src/${f}`, path.join(OUT, f));
cp("product-src/scripts", path.join(OUT, "scripts"));
fs.mkdirSync(path.join(OUT, "reference"), { recursive: true });
for (const f of fs.readdirSync("product-src/reference")) if (!f.endsWith(".head.md")) cp(`product-src/reference/${f}`, path.join(OUT, "reference", f));
const fence = (title, file) => `\n## ${title}\n\n\`\`\`ts\n${fs.readFileSync(file, "utf8").trim()}\n\`\`\`\n`;
write(
  path.join(OUT, "reference", "example-episode.md"),
  fs.readFileSync("product-src/reference/example-episode.head.md", "utf8") +
    fence("src/ep02/script.ts", "src/ep02/script.ts") +
    fence("src/ep02/world.ts", "src/ep02/world.ts") +
    fence("src/ep02/models.ts", "src/ep02/models.ts"),
);

// ---------------- template project
for (const p of ["src/iso", "src/shared", "src/theme.ts", "src/fonts.ts", "src/channel.ts", "src/Root.tsx", "src/index.ts", "scripts", "templates", "public/fonts", "tsconfig.json", "remotion.config.ts", "eslint.config.mjs"])
  cp(p, path.join(T, p));
cp(".prettierrc", path.join(T, "_prettierrc"));
write(
  path.join(T, "_gitignore"),
  ["node_modules", "dist", "out", ".env", ".DS_Store", "*.raw", "*.src.*", "voice/auditions/*.wav", ""].join("\n"),
);
write(
  path.join(T, "src/episodes.ts"),
  `// Registry of episodes. scripts/new-episode.mjs adds new ones above the marker.
import type { EpisodeDef } from "./shared/types";
// @new-episode-import

export const EPISODES: EpisodeDef[] = [
  // @new-episode-entry
];
`,
);
write(
  path.join(T, "studio.config.json"),
  JSON.stringify(
    {
      $schema_note: "Studio configuration. No secrets here — API keys live in environment variables (.env). Edit with: npm run setup -- …",
      channel: { name: "MY CHANNEL", niche: "architecture" },
      voice: {
        provider: "gemini",
        gemini: { model: "gemini-3.8-flash-tts", voice: "", design: { display_name: "Narrator", gender: "female", language_code: "en-GB", prompt: "" } },
        elevenlabs: { voiceId: "", model: "eleven_multilingual_v2", stability: 0.45, similarity: 0.8, style: 0.2, speed: 1.0 },
        openai: { model: "gpt-4o-mini-tts", voice: "sage", instructions: "Warm, intelligent documentary narrator. Measured pace, clear diction, a hint of dry wit." },
      },
      music: { provider: "none", lyria: { model: "lyria-3.5" }, elevenlabs: { maxSeconds: 300 } },
      transcribe: { provider: "" },
      media: { providers: ["openverse"], wikimediaContact: "" },
    },
    null,
    2,
  ),
);
write(path.join(T, ".env.example"), "# Run `npm run setup -- …` to generate the exact list for your providers.\n");
write(path.join(T, "docs", ".keep"), "");
write(path.join(T, "public", "sfx", ".keep"), "");

// package.json: only what the code imports
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const keep = (o, names) => Object.fromEntries(Object.entries(o).filter(([k]) => names.includes(k)));
const remotionVer = pkg.dependencies.remotion;
write(
  path.join(T, "package.json"),
  JSON.stringify(
    {
      name: "explainer-studio-project",
      version: "1.0.0",
      private: true,
      type: "module",
      description: "Isometric explainer videos (Remotion) — scaffolded by Isometric Explainer Studio",
      engines: pkg.engines,
      scripts: Object.fromEntries(Object.entries(pkg.scripts).filter(([k]) => !["upgrade"].includes(k))),
      dependencies: {
        ...keep(pkg.dependencies, ["remotion", "@remotion/cli", "@remotion/media", "@remotion/fonts", "react", "react-dom"]),
        "@remotion/bundler": remotionVer,
        "@remotion/renderer": remotionVer,
      },
      devDependencies: keep(pkg.devDependencies, ["@remotion/eslint-config-flat", "@types/react", "@types/web", "eslint", "prettier", "typescript"]),
    },
    null,
    2,
  ) + "\n",
);
write(
  path.join(T, "README.md"),
  `# Explainer studio project

Made with Isometric Explainer Studio. Your agent drives it; the commands are:

\`\`\`bash
npm run setup -- …            # choose providers (see the skill's reference/onboarding.md)
npm run doctor                # check tools, keys, network
npm run sfx                   # synthesize sound effects (once)
npm run new-episode -- ep01 "Title"
npm run media -- ep01 search "query"   ·   npm run media -- ep01 get <provider:id> <name>
npm run stills -- ep01 /tmp/s beats    # preview frames
npm run voice -- ep01  ·  npm run check-voice -- ep01  ·  npm run music -- ep01
npm run render -- ep01        # out/ep01.mp4
npm run dev                   # Remotion Studio
\`\`\`
API keys go in \`.env\` only.
`,
);

// ---------------- safety checks: no personal traces, no secrets
const BANNED = [/voice_[a-z0-9]{12}/, /ARCHITECT DIARY/i, /architect_dairy/i, /SheriffMudasir/i, /@gmail\.com/i, /AIza[0-9A-Za-z_-]{20,}/, /sk-[A-Za-z0-9]{20,}/, /xi-api-key"\s*:\s*"[a-z0-9]{20,}/i];
const ALLOW_IN = []; // none
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const problems = [];
for (const f of walk(OUT)) {
  if (/\.(woff2|png|jpg|mp4|wav|mp3)$/.test(f) || ALLOW_IN.includes(f)) continue;
  const s = fs.readFileSync(f, "utf8");
  for (const re of BANNED) if (re.test(s)) problems.push(`${f}: ${re}`);
}
if (problems.length) {
  console.error("Personal/secret traces found — fix before shipping:\n" + problems.join("\n"));
  process.exit(1);
}

// ---------------- zip
const zip = path.resolve("dist", `${NAME}-v${VERSION}.zip`);
fs.rmSync(zip, { force: true });
execFileSync("python3", ["-c", `
import os, zipfile, sys
root = sys.argv[1]; out = sys.argv[2]
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for d, _, files in os.walk(root):
        for f in files:
            p = os.path.join(d, f)
            z.write(p, os.path.relpath(p, os.path.dirname(root)))
`, OUT, zip]);
const files = walk(OUT).length;
console.log(`Built ${OUT} (${files} files) -> ${zip} (${(fs.statSync(zip).size / 1024).toFixed(0)} KB)`);
