# The isometric engine and models

`src/iso/engine.ts` projects 3D points (metres, z up) with a fixed 2:1 isometric camera (no
perspective) into SVG paths, shades faces from their normals (tops light, sides darker), and draws
back-to-front (painter's sort on face centroids). That gives constant hairline strokes and a clean
architectural-diagram look, renders anywhere (no GPU/WebGL), and still allows real camera orbits.

## Primitives (`src/iso/engine.ts`)
`box(x,y,z,w,d,h,style)`, `band(ringA, ringB, style)` (walls between two rings),
`ellipse(rx,ry,z,n,cx,cy)`, `close(ring)`, items `{kind:"poly"|"line"|"dot"}` with
`fill, stroke, sw, opacity, fillOpacity, dash, bias, ground, progress` (lines draw on with `progress`).
Helpers: `ease`, `easeOut`, `lerp`, `clamp01`, `mix(colorA, colorB, t)`, `rng(seed)`.

## Model library (`src/iso/models.ts`)
`city()`, `park()`, `sitePlate()`, `people()`, `bar()` (cost bars), `entries()` (competition
boards), `bowl()`/`zaha()`/`kuma()` (stadium examples with `rise`, `ghost`, `arches`…),
`spire()` (polygonal towers with finials), `eixampleBlock()` / `eixample()` (chamfered
Barcelona-style city grid), `crane()` (lattice tower crane), `hill()`.
Write new models as functions with an options object (`rise`, `opacity`, `ghost`, `year`, …) so
beats can animate them. Episode-specific models go in `src/epNN/models.ts`.

## Visual language
- built/solid: light mass, ink contour lines, faint seams (per-face ink strokes look like ribs);
- **unbuilt / lost / planned: dashed accent-colour ghost wireframe** (`ghost: 1`);
- timber `C.wood`, stone `C.stone`, cranes `C.crane`, fire `C.fire` (see `src/theme.ts`);
- frame the subject big; the scene area sits between the headline (~y 360) and captions (~y 1500).

## Limits & fixes
- Keep faces small/low-poly (~44 segments per ring); wrong overlaps → split faces or nudge `bias`
  (positive = drawn later). Flat ground things use `ground: true`.
- Things hidden behind tall neighbours (e.g. a street behind a block row): skip those blocks for
  that beat or change the camera yaw.
- Thin elements seen edge-on read badly — choose yaws where the signature element is in profile.
- No shadows/textures. For a photoreal hero shot, `@remotion/three` can be added for that shot only.

## Theming
Change `src/theme.ts` (palette) and `src/fonts.ts` (fonts in `public/fonts`) to make the look
the user's own. Never copy another creator's palette, typography or layouts.
