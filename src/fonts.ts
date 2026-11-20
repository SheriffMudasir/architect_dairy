import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const SANS = "Instrument Sans";
export const MONO = "JetBrains Mono";

for (const w of ["500", "600", "700"]) {
  loadFont({ family: SANS, url: staticFile(`fonts/instrument-sans-latin-${w}-normal.woff2`), weight: w });
}
loadFont({ family: MONO, url: staticFile("fonts/jetbrains-mono-latin-500-normal.woff2"), weight: "500" });
