// Scaffold a new episode from templates/episode and register it.
//   npm run new-episode -- ep02 "The Title" [CompositionName]
import fs from "node:fs";

const [ep, title, compArg] = process.argv.slice(2);
if (!/^ep\d{2,}$/.test(ep ?? "") || !title) throw new Error('usage: npm run new-episode -- ep02 "The Title" [CompositionName]');
if (fs.existsSync(`src/${ep}`)) throw new Error(`src/${ep} already exists`);
const n = Number(ep.slice(2));
const pascal = title.replace(/[^A-Za-z0-9 ]/g, "").split(/\s+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join("");
const comp = compArg ?? `Ep${String(n).padStart(2, "0")}${pascal}`.slice(0, 40);
const CONST = ep.toUpperCase();
const fill = (s) => s.replaceAll("__EP__", ep).replaceAll("__N__", String(n)).replaceAll("__TITLE__", title).replaceAll("__COMP__", comp).replaceAll("__CONST__", CONST);

fs.mkdirSync(`src/${ep}`, { recursive: true });
for (const f of ["script.ts", "world.ts", "index.ts"]) fs.writeFileSync(`src/${ep}/${f}`, fill(fs.readFileSync(`templates/episode/${f}`, "utf8")));
fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync(`docs/${ep}-research.md`, fill(fs.readFileSync("templates/episode/research.md", "utf8")));
fs.mkdirSync(`public/${ep}`, { recursive: true });

let reg = fs.readFileSync("src/episodes.ts", "utf8");
reg = reg.replace("// @new-episode-import", `import { ${CONST} } from "./${ep}";\n// @new-episode-import`);
reg = reg.replace("  // @new-episode-entry", `  ${CONST},\n  // @new-episode-entry`);
fs.writeFileSync("src/episodes.ts", reg);
console.log(`Created src/${ep} (composition ${comp}), docs/${ep}-research.md, public/${ep}/`);
