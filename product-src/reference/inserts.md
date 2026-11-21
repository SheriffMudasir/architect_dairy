# Inserts — the motion-graphics layer

Declared in `script.ts` → `inserts: [...]`; rendered by `src/shared/Inserts.tsx`. Timing is in
fractions of a beat: `{ beat, from, to }`, plus `untilBeat` to span into a later beat.
**Rule: something new every 2–3 s; at most two inserts per beat; keep 3D "build" moments clear.**

| kind | fields | use for |
|---|---|---|
| `photo` `layout:"full"` | `src`, `focus?`, `grade?: "warm"\|"mono"` | establishing the real place/building; tributes (`mono`). Blends into the paper at top/bottom, slow zoom, credit line |
| `photo` `layout:"card"` | `src`, `caption`, `side`, `tilt?`, `focus?` | "here's the real thing" details — a tilted print sliding in |
| `video` | `src`, `focus?`, `grade?` | full-screen stock footage (muted), same treatment as full photos |
| `person` | `name`, `role`, `photo?` | first mention of a person; initials monogram if no photo; simultaneous cards stack |
| `number` | `value`, `prefix?`, `suffix?`, `label`, `sub?`, `accent?`, `format?: "plain"` | the hard numbers — counts up, lands with a bump |
| `stamp` | `text`, `sub?` | the break ("SCRAPPED", "BURNED", "PERMIT GRANTED") — slams in, camera shake, thud |
| `quote` | `text`, `by` | a critic's line or nickname — sourced only |

Automatic: the 3D world dims behind cards/numbers/quotes; in-world tags fade; sound effects —
whoosh on beat changes and full photos, tick on cards/numbers, thud on stamps.

Example:
```ts
inserts: [
  { kind: "photo", beat: "hook", from: 0, to: 0.34, src: "cranes", layout: "full", focus: [0.45, 0.4] },
  { kind: "person", beat: "gaudi", from: 0.45, to: 1, name: "Antoni Gaudí", role: "Architect · 1852–1926", photo: "gaudi" },
  { kind: "number", beat: "money", from: 0.45, to: 1, value: 4877567, label: "Visitors in 2025", sub: "Public funding: €0", accent: true },
  { kind: "stamp", beat: "fire", from: 0.45, to: 1, text: "BURNED", sub: "JULY 1936" },
]
```

## In-world tags (from `worldAt`)
`{ key, text, at: [x,y,z], opacity, tone?: "ink"|"accent"|"paper", align?: "left"|"right" }` —
`paper` for names, `accent` for the twist/number, ink for facts. Use `align` when two tags sit
close (e.g. tags beside bars). Tags are clamped inside the frame automatically.

## Captions, headline, year bar
Captions page 1–3 words, pop on each word, highlight `em` words in accent boxes. The headline
changes with `act`. The year bar shows `years` with the current beat's `year`.
