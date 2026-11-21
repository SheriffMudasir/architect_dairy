#!/usr/bin/env node
// Scaffold a new studio project from this skill's template (no network access).
//   node <skill-folder>/scripts/init-project.mjs <target-dir>
// Then: cd <target-dir> && npm install && npm run setup -- …
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const target = path.resolve(process.argv[2] ?? "explainer-studio");
const template = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "template");
if (!fs.existsSync(template)) throw new Error(`template not found at ${template}`);
if (fs.existsSync(target) && fs.readdirSync(target).filter((f) => !f.startsWith(".")).length && !process.argv.includes("--force"))
  throw new Error(`${target} is not empty (use --force to copy into it anyway)`);
fs.cpSync(template, target, { recursive: true, force: false, errorOnExist: false });
// dotfiles are stored without the dot so marketplaces don't strip them
for (const f of ["gitignore", "prettierrc"]) {
  const src = path.join(target, `_${f}`);
  if (fs.existsSync(src)) fs.renameSync(src, path.join(target, `.${f}`));
}
console.log(`Project created at ${target}
Next:
  cd ${path.relative(process.cwd(), target) || "."}
  npm install
  npm run setup -- --channel "My Channel" --voice <elevenlabs|gemini|openai|file> --music <lyria|elevenlabs|file|none> --media openverse
  (put the API keys it lists into .env)
  npm run doctor
  npm run sfx
  npm run new-episode -- ep01 "My First Episode"`);
