# Episode workflow

Project layout (created by `scripts/init-project.mjs`):

```
studio.config.json      provider choices + channel name (no secrets)
.env                    API keys (never committed)
src/theme.ts            palette  ·  src/fonts.ts fonts  ·  src/channel.ts channel mark
src/iso/engine.ts       orthographic 3D → SVG engine
src/iso/models.ts       reusable models (city, Eixample grid, spires, cranes, hills, stadiums…)
src/shared/             Episode composition, Captions, Inserts, Soundtrack, camera, timeline, types
src/epNN/script.ts      beats + headlines + inserts + music plan (node-safe data)
src/epNN/world.ts       storyboard: camera shot per beat + worldAt(tl, t)
src/epNN/models.ts      (optional) episode-specific models
docs/epNN-research.md   every claim → source
public/epNN/            audio/, media/, timeline.json, music.wav
public/sfx/             synthesized sound effects (npm run sfx)
```

## 1. Scaffold
`npm run new-episode -- ep01 "Short Title"` → `src/ep01/{script,world,index}.ts`,
`docs/ep01-research.md`, registered in `src/episodes.ts`. If `public/sfx` is empty: `npm run sfx`.

## 2. Research
Search the web (several queries at once). Fill `docs/ep01-research.md`: one row per claim with
a link. ⚠ anything not confirmed by a reputable source; tell the user. Disagreeing figures → omit.

## 3. Script (`src/ep01/script.ts`)
See `storytelling.md`. Per beat: `id`, `act` (which headline), `label` (`YEAR · PLACE`),
`year` (year bar), `em` (caption words to highlight), `text` (spoken verbatim).
Episode: `headlines` per act (`lead` ink + `accent` colour), `years: [start, end]`,
`inserts` (see `inserts.md`), `music: { style, sections[{from,to?,mood}], dips[] }`,
`sfx` (extra cues; whoosh/tick/thud are automatic).

## 4. Stock media
Plan 6–10 visuals: the real building, people, place, aftermath. `npm run media -- ep01 search …`,
inspect a contact sheet of downloads (see `media-licensing.md`), delete rejects (file + credits entry).

## 5. Storyboard (`src/ep01/world.ts`)
One `Shot` per beat: `{ yaw, scale, target, drift?, zoom? }` (scale ≈ px per metre; a 300 m
stadium ≈ 1.5–2.4; a 170 m tower ≈ 3–4.5). `worldAt(tl, t)` returns `{ items, tags }`, timed with
`beatClock(tl, t)` → `fr(id, a, b)` (fraction of beat), `at(id, a, b)` (seconds), `since(id)`.
**Never use absolute seconds** — the voice re-times every beat. A useful trick: drive a building
by a `year` variable that beats animate (time-lapse, rewind, slow growth) — see `example-episode.md`.

## 6. Silent preview
```bash
npm run stills -- ep01 /tmp/s1 beats     # 50% and 90% of every beat (half resolution)
ffmpeg -v error -y -pattern_type glob -i '/tmp/s1/*.png' -vf "scale=270:-1,tile=7x4" /tmp/s1/sheet.jpg
```
Look at the sheet, then full-size frames of anything odd: subject too small, tags overlapping or
off-frame, objects hidden behind buildings (painter's order), empty frames, caption wrap.
Optionally `npm run render -- ep01 --silent` for an animatic to show the user.

## 7. Voice
`npm run voice -- ep01` then `npm run check-voice -- ep01`. Redo bad beats: `npm run voice -- ep01 hook cost`.
Expect ~2.3–2.6 words/s; a 10-word beat taking > 8 s means something extra was spoken.

## 8. Music
`npm run music -- ep01 [--dry]`. Verify by measuring (you can't listen):
```bash
ffmpeg -v error -i public/ep01/music.wav -af "asetnsamples=n=240000,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-" -f null - | grep RMS | awk -F= '{printf "%d:%.0f ", (NR-1)*5, $NF}'
```
Duration ≈ episode length; loudness should follow the plan (quiet on dips, peak at the climax).

## 9. Render & deliver
`npm run render -- ep01` → `out/ep01.mp4` (h264, mastered to −14 LUFS). Re-check a few stills on
the real timing. Give the user: the file, length, ⚠ facts, what to listen for, and
`npm run media -- ep01 credits` for the description. Commit the project (not `out/`).
