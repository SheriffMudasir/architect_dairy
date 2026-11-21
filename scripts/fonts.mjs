// Copy the open-licence fonts (SIL OFL) from npm packages into public/fonts.
// The skill ships text files only, so fonts arrive via `npm install` (@fontsource/*).
//   npm run fonts      (also run automatically by `npm run setup`)
import fs from "node:fs";

const FONTS = [
  ["@fontsource/instrument-sans", "instrument-sans-latin-500-normal.woff2"],
  ["@fontsource/instrument-sans", "instrument-sans-latin-600-normal.woff2"],
  ["@fontsource/instrument-sans", "instrument-sans-latin-700-normal.woff2"],
  ["@fontsource/jetbrains-mono", "jetbrains-mono-latin-500-normal.woff2"],
];

export const ensureFonts = () => {
  fs.mkdirSync("public/fonts", { recursive: true });
  const missing = [];
  for (const [pkg, file] of FONTS) {
    const dest = `public/fonts/${file}`;
    if (fs.existsSync(dest)) continue;
    const src = `node_modules/${pkg}/files/${file}`;
    if (fs.existsSync(src)) fs.copyFileSync(src, dest);
    else missing.push(`${pkg} (${file})`);
  }
  return missing;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const missing = ensureFonts();
  console.log(missing.length ? `Missing font packages — run npm install first: ${missing.join(", ")}` : "Fonts ready in public/fonts");
  process.exit(missing.length ? 1 : 0);
}
