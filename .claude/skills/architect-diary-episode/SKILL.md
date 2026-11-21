---
name: architect-diary-episode
description: Produce an Architect Diary episode end to end — a 75–100 s vertical (1080×1920) architecture documentary with isometric low-poly models, word-timed captions, a designed Gemini narrator voice, a Lyria score and SFX. Use when the user asks for a new episode, a video about a building/architect/unbuilt project, or to revise, re-voice, re-score or re-render an existing episode in this repo.
---

# Architect Diary — episode workflow

Everything lives in this repo. Episode 01 (`src/ep01`, Zaha Hadid's Tokyo stadium)
is the reference implementation: copy its patterns.

```
src/channel.ts           channel name + narrator voice-design prompt (shared)
src/theme.ts             palette (paper, ink, vermilion accent, timber…)
src/iso/engine.ts        orthographic 3D -> SVG engine (box, band, ellipse, lines, dots)
src/iso/models.ts        reusable models: city, park, sitePlate, people, bowl, bar, zaha, kuma…
src/shared/              Episode composition, Captions, Soundtrack, camera, timeline, types
src/epNN/script.ts       beats + headlines + music plan + sfx cues  (node-safe data)
src/epNN/world.ts        storyboard: SHOTS per beat + worldAt(tl, t) choreography
src/epNN/index.ts        EpisodeDef (compositionId)
src/episodes.ts          registry (new-episode.mjs edits it)
docs/epNN-research.md    every claim -> source
public/epNN/             audio/<beat>.wav, timeline.json, music.wav
public/sfx/              shared synthesized SFX (whoosh, thud, swell)
voice/narrator.json      the channel's designed voice id (reuse; never recreate casually)
```

## 0. Environment check (cloud sandbox)

Providers (voice, music, stock media, transcription) are chosen in `studio.config.json` —
this channel uses Gemini voice (designed voice id) + Lyria + Openverse. Change with
`npm run setup -- --voice … --music … --media …`; verify with `npm run doctor` (prints only
set/missing for keys). `.env` holds `STUDIO_KEYS_VIA_PROXY=gemini` because the Gemini key is a
network secret injected by the sandbox proxy. Provider code: `scripts/providers/*.mjs`.

Run once per session before generating anything:

```bash
curl -sS -H "x-goog-api-key: x" "https://generativelanguage.googleapis.com/v1beta/models?pageSize=300" | head -c 300
export REMOTION_BROWSER=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
```

- The Gemini key is a **network secret** on the `architect_dairy` environment
  (host `generativelanguage.googleapis.com`, header `x-goog-api-key`, no prefix). The
  proxy injects it — never ask for the key in chat, never print or commit it. If the
  call says "API key not valid", tell the user how to add the secret (that exact
  form: Allowed websites = the host; header `x-goog-api-key`; Prefix empty).
- Remotion cannot download its own Chrome here (remotion.media blocked) and Google
  Fonts are blocked: fonts are vendored in `public/fonts`, and `REMOTION_BROWSER`
  points at the preinstalled headless shell (find it with `find /opt/pw-browsers -name "chrome-headless-shell"` if the path changed).
- Allowed extra hosts on the environment: `generativelanguage.googleapis.com`,
  `ai.google.dev` (docs redirect to aistudio.google.com, which is blocked — read the
  `@google/genai` npm package's `.d.ts` files for API shapes instead).
- Stock media hosts allowed: `api.openverse.org` (search), `live.staticflickr.com`
  (downloads). Wikimedia (`upload.wikimedia.org`) rate-limits this shared IP (429) —
  pick Flickr-hosted results. Pexels stopped issuing API keys. Pixabay needs its key in
  the URL, so it can't be a network secret: it would have to be an environment
  variable `PIXABAY_API_KEY` (read on session start) plus hosts `pixabay.com`,
  `cdn.pixabay.com` — not set up yet; ask the user before relying on stock video.
- Node's `fetch` ignores the proxy unless `NODE_USE_ENV_PROXY=1` (already in every
  npm script — always run scripts via `npm run`, or you'll get ENOTFOUND).
- huggingface CDN is blocked, so there is no Whisper; `scripts/voice.mjs` has its own
  pause-anchored aligner (good enough for 2–4 word caption pages).

## 1. Scaffold

```bash
npm run new-episode -- ep03 "Short Title"
```

If an `epNN` with placeholder content (`TODO` headlines, `Untitled`) already exists for
the next number, fill it in instead of creating another one. To rename, change
`title` in script.ts and `compositionId` in index.ts.

## 2. Research (before writing a word of script)

- Use WebSearch (several searches in one turn). Collect dates, names, numbers, quotes.
- Fill `docs/epNN-research.md`: one row per claim with a source link. Mark anything
  not confirmed with ⚠ and tell the user before publishing. Where sources disagree
  on a figure, leave it out of the script.
- Avoid quoted insults or attributions you can't source; prefer "critics called it…".

## 2b. Stock photos (`npm run media`)

```bash
npm run media -- epNN search "Japan National Stadium" 20   # Openverse, CC0/BY/BY-SA only
npm run media -- epNN get <openverse-id> <short-name>       # -> public/epNN/media/<name>.jpg + credits.json
```

- Plan 6–10 photos: the real building(s), the people (portraits), the place (street,
  park, skyline), the aftermath. Our 3D model stays the hero for anything unbuilt.
- **Licence hygiene:** only CC0 / PDM / CC BY / CC BY-SA (we crop, tint, animate, so
  no ND; commercial use, so no NC). Skip uploads that look like re-posted professional
  work (e.g. "Portrait by <famous photographer>" uploaded by an aggregator account,
  news-agency photos like REUTERS/AP) — the CC label is probably invalid.
  Prefer prolific original photographers (e.g. Dick Thomas Johnson on Flickr) and
  government public-domain photos.
- **Look before you use:** build a labelled contact sheet and inspect it — titles
  lie (ep01's "Shinzo Abe" photos showed only an honour guard).
  ```bash
  S=/tmp/…/scratchpad/m; mkdir -p $S; i=0; for f in public/epNN/media/*.jpg; do ffmpeg -v error -y -i $f -vf "scale=300:300:force_original_aspect_ratio=decrease,pad=300:300:(ow-iw)/2:(oh-ih)/2:white,drawtext=text='$i':x=4:y=4:fontsize=18:fontcolor=red" $S/$(printf %02d $i).png; i=$((i+1)); done; ffmpeg -v error -y -pattern_type glob -i "$S/*.png" -vf tile=6x2 $S/sheet.jpg
  ```
- People without a usable photo get a type-only name card (initials monogram) — fine.
- Delete unused downloads and their `credits.json` entries. Credits shown in-video
  (each photo's credit line + the end card) are generated from `credits.json`, so
  CC BY attribution is automatic; also paste `npm run media -- epNN credits` into the
  video description.

## 3. Script (`src/epNN/script.ts`)

Story shape that works (ep01): **hook with the twist** → competition/commission →
the design (model rises) → the friction (site, critics) → the hard number (cost bar)
→ who's to blame → the break (scrapped/changed) → the aftermath → the replacement
→ an emotional beat → an ironic coda → outro line that mirrors the hook.

Rules:
- 12–16 beats, ~190–230 words total, 75–100 s. Each beat = 1–2 short sentences.
- `text` is spoken **verbatim**. Never put stage directions, brackets or "say this
  warmly" in it — Gemini TTS reads them aloud (ep01 lost a whole voice pass to this).
  Delivery style belongs to the voice design in `src/channel.ts`.
- Write numbers so the captions read well (`2015`, `forty-seven`) — the TTS says them fine.
- `label` = mono line under the headline: `YEAR · PLACE` style, uppercase.
- `act` switches the big headline (2–3 acts). Headlines: `lead` (ink) + `accent` (vermilion).
- `music.sections` reference beat ids; `music.dips` = beats where music nearly vanishes.
- `sfx`: `swell` when a building rises. Whooshes (beat changes), thuds (stamps) and
  ticks (cards/numbers) are added automatically from the inserts.
- `year` on every beat drives the running year bar (`years: [start, end]` on the script).
- `em: [...]` per beat = caption words to highlight (names, numbers, the twist word).
  2–4 per beat; multi-word entries are fine ("Tadao Ando").

Show the user the script (beats as a numbered list) before voicing if they want to
review; otherwise proceed — they can request changes after the animatic.

## 4. Storyboard + models (`src/epNN/world.ts`, `src/iso/models.ts`)

- One `Shot` per beat in `SHOTS` (yaw radians, scale ≈ px/m: 1.0 wide → 2.4 close,
  target = world point, drift = slow orbit). Camera eases between beats automatically.
- `worldAt(tl, t)` returns `{ items, tags }`. Time everything with
  `beatClock(tl, t)`: `fr(id, a, b)` = fraction of beat, `at(id, a, b)` = seconds
  from beat start, `since(id)`. Never use absolute seconds — the voice re-times beats.
- Model buildings as low-poly in metres (z up), around the origin, footprint ~300 m
  wide for a stadium. Build with `band(ellipse…)` rings, `box`, `line`, `dot`.
  Add reusable models to `src/iso/models.ts` with an options object
  (`rise`, `opacity`, `ghost`, …) so they can animate.
- Visual language (keep it consistent across episodes):
  - built/solid = white mass, ink contour lines, faint seams;
  - **unbuilt / lost / proposed = dashed vermilion ghost wireframe** (`ghost: 1`);
  - timber = `C.wood`/`C.woodTop`; numbers = bars (`bar()`), accent for the bad one;
  - in-world tags: `tone: "paper"` for names, `"accent"` for the twist/number,
    default ink for facts. Use `align: "left" | "right"` when two tags sit close.
- Context: `city()`, `park()`, `sitePlate()`, `people()` give scale and place.

## 4a. AI-generated media (hybrid episodes) — images cheap, video rare

Declare in `script.ts` → `generate: { style, subjects, images[], videos[] }` (see `src/ep03`).
- **Images** (`gemini-3.1-flash-image`, ~10 s, ~1.5k tokens each): use freely as `photo` inserts
  (`layout: "full"`, `move: in|out|left|right|up|down`, `sweep: true`) or cards.
- **Video** (`gemini-omni-1.2-flash` via the Interactions API, 6 s ≈ 35k tokens): **max 2–3 per
  episode** (`generate.video.maxPerEpisode`), only for the hook and the climax. Always animate a
  generated keyframe (`from: "<image name>"`) so the subject stays consistent.
- `subjects` = an exact description of the building reused in every prompt (consistency);
  `style` = the look bible. Prompts must say no text/logos (AI text is garbage).
- `npm run gen -- epNN` previews counts + rough tokens and generates nothing; get the user's OK,
  then `--yes`. Cached by prompt hash; `--only a,b` to redo; `--force` to ignore cache.
- Inspect every output (contact sheet + frame strips for clips). AI clips often contain a
  cross-dissolve/morph — cut it with `trimStart` on the video insert instead of paying for a redo.
- AI media is credited automatically as "AI visualisation"; keep a small on-screen note in the outro.
  Never generate depictions of real tragedies/violence; use the 3D engine for those beats.
- Everything else (explanations) = 3D engine + stock photos + motion graphics.

## 4b. Inserts — the motion-graphics layer (`inserts` in script.ts)

The 3D world alone gets repetitive. **Rule: something new on screen every 2–3 s.**
Alternate 3D shots with inserts; each beat should have at most two inserts. Vocabulary
(see `src/shared/Inserts.tsx`, timing = fractions of a beat, `untilBeat` to span):

| kind | use for | notes |
|---|---|---|
| `photo` `layout:"full"` | establishing the real place/building, emotional beats | blends into the paper top/bottom; `grade:"mono"` for tributes; `focus` = zoom origin |
| `photo` `layout:"card"` | details, "here's the real thing" | tilted print sliding in from `side`; caption + automatic credit |
| `person` | first mention of a person | lower-third; `photo` optional (else initials); simultaneous cards stack |
| `number` | the hard numbers | counts up, lands with a bump; `accent:true` for the shocking one; `format:"plain"` for small numbers |
| `stamp` | the break ("SCRAPPED", "CANCELLED", "DEMOLISHED") | slams in with camera shake + thud |
| `quote` | a critic's line / nickname | big type, only sourced quotes |

The world dims behind cards/numbers/quotes automatically, and in-world tags fade.
Keep the 3D build moments (a building rising, a ghost dropping) free of cards.

## 5. Preview silently (cheap; do this before spending on audio)

```bash
npm run stills -- epNN /tmp/…/scratchpad/sN beats      # 50% + 90% of every beat
ffmpeg -v error -y -pattern_type glob -i '/tmp/…/sN/*.png' -vf "scale=270:-1,tile=7x4" /tmp/…/sN/sheet.jpg
```

Read the contact sheet, then full-size frames of anything suspicious. Check:
overlapping tags, tags off-frame, subject too small, empty frames, caption wrapping,
headline collisions. Fix and re-render. Optionally `npm run render -- epNN --silent`
for an animatic and send it with SendUserFile.

## 6. Voice

```bash
npm run voice -- epNN            # creates the channel voice only if voice/narrator.json is missing
npm run check-voice -- epNN      # Gemini transcribes each clip and diffs it with the script
npm run voice -- epNN cost hook  # redo bad beats; then check again
```

- Model `gemini-3.8-flash-tts`; voice = the id in `voice/narrator.json` (designed via
  `POST /v1beta/voices` with `type: "prompted"`, `store: true`).
- Clips are normalised to **−14 LUFS** (louder than ep01 v1, which the user found too
  low); music sits at 0.15 under speech.
- To try a different narrator: `npm run voice-audition -- <name> "<description>"`
  renders the same three lines (also `voice-audition -- current`); send the wavs to
  the user, then `npm run voice-audition -- use <name>` and re-run `voice --force`,
  `check-voice`, `music`.
- Expect ~2.4 words/s. If a 10-word beat produces >8 s, something was read aloud
  that shouldn't have been — check-voice will show it.
- After any voice change, re-run music (its timestamps come from the timeline).

## 7. Music + SFX

```bash
npm run sfx                      # only if public/sfx is missing
npm run music -- epNN            # Lyria (lyria-3.5), shaped by script.music + timeline
```

You can't listen: verify by measuring. Duration should be ≈ episode length, and the
loudness curve should follow the plan:

```bash
ffmpeg -v error -i public/epNN/music.wav -af "asetnsamples=n=144000,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-" -f null - | grep RMS | awk -F= '{printf "%d:%.0f ", (NR-1)*3, $NF}'
```

Mix lives in `src/shared/Soundtrack.tsx`: voice at full level, music 0.2 under speech /
0.3 in gaps / 0.1 on `dips`, fades at both ends.

## 8. Final render + delivery

```bash
npm run render -- epNN           # out/epNN.mp4, prints integrated loudness (aim ≈ -14 LUFS)
```

- Re-check a few stills from the final timing (captions now real).
- Send the mp4 with SendUserFile (`display: "render"`).
- Commit everything except `out/` (audio, timeline, music are kept — regenerating
  costs API calls and isn't deterministic). Push to the session's branch.
- Tell the user: length, what to listen for (music level, voice, caption sync —
  you can't hear it), and every ⚠ fact.

## The 3D engine (know its limits when modelling)

`src/iso/engine.ts` projects 3D points (metres, z up) with a fixed 2:1 isometric
camera (no perspective) into SVG paths, shades each face from its normal against a
fixed light (tops light, sides darker), and draws back-to-front (painter's sort on
face centroids). Consequences:
- Keep faces small and low-poly (rings of ~44 segments). Large or intersecting faces
  can sort wrongly; nudge with `bias` (positive = drawn later/on top) or split faces.
- Flat ground things (site plates, roads, park lawns) go in the ground layer
  (`ground: true`) so they never cover buildings.
- Thin elements seen edge-on read badly (ep01's arches looked like vertical sticks at
  yaw ≈ 0.6): check orbit angles in stills and pick yaws where the signature element
  reads in profile.
- Smooth "solid" forms: give faces a faint seam stroke (near the fill colour) and draw
  a few ink contour lines (rims, ridges) — per-face ink strokes look like ribs.
- No shadows, textures or real lighting. If an episode truly needs that for a hero
  shot, use `@remotion/three` for that shot only and keep this engine elsewhere.

## Look & feel rules

- The channel look is our own (warm paper, ink, vermilion, timber; Instrument Sans +
  JetBrains Mono). It was inspired by isometric explainer videos — never copy another
  creator's palette, typography, label style or layouts.
- Frame the subject big: stadium-scale models want `scale` ≈ 1.5–2.4; the scene area
  is between the headline (~y 360) and the caption (~y 1500).
- One idea per beat: the viewer should know where to look within half a second.

## Selling this as a product

`node tools/build-product.mjs` builds the generic, sellable skill (`dist/isometric-explainer-studio/`
+ zip) from this repo's code: `product-src/` holds its SKILL.md, references, licence and listing copy;
the template is copied from `src/` and `scripts/` with personal material stripped (the build fails
if channel name, voice ids or keys leak). Rebuild after improving the pipeline.

## Pitfalls already hit

- TTS reading delivery instructions aloud → never prefix `text`.
- Aligner producing backwards word times → fixed (phrase breaks are placed relative
  to the previous one); if captions look off, inspect `public/epNN/timeline.json`
  for non-monotonic `startMs`.
- Overlapping cost tags → put tags beside bars with `align`.
- Dense city stealing focus → city fades with distance; keep it at ≤ 0.95 opacity.
- Changing beat ids after voicing → `loadTimeline` falls back to the estimate
  (silent) until `npm run voice` is re-run.
