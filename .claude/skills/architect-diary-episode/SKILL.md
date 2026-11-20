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
- `sfx`: `swell` when a building rises, `thud` on the big break; whooshes are automatic.

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
ffmpeg -v error -i public/epNN/music.wav -af "asetnsamples=n=144000,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-" -f null - | grep RMS | awk -F= '{printf "%d:%.0f ", (NR-1)*3, $2}'
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

## Pitfalls already hit

- TTS reading delivery instructions aloud → never prefix `text`.
- Aligner producing backwards word times → fixed (phrase breaks are placed relative
  to the previous one); if captions look off, inspect `public/epNN/timeline.json`
  for non-monotonic `startMs`.
- Overlapping cost tags → put tags beside bars with `align`.
- Dense city stealing focus → city fades with distance; keep it at ≤ 0.95 opacity.
- Changing beat ids after voicing → `loadTimeline` falls back to the estimate
  (silent) until `npm run voice` is re-run.
