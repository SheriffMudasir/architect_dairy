# Architect Diary

Short vertical architecture documentaries, made with code.

- **Remotion** (React) renders the video at 1080×1920 / 30 fps.
- A tiny orthographic **3D → SVG engine** (`src/iso/engine.ts`) draws low-poly
  models as crisp isometric line drawings, with real camera orbits.
- **Gemini TTS** with a designed (prompted) narrator voice reads the script;
  `scripts/voice.mjs` builds a word-timed timeline from the audio, so every
  animation and caption re-times itself to the voice.

## Episode 01 — The Stadium Tokyo Threw Away

Zaha Hadid's New National Stadium (2012–2015) and Kengo Kuma's replacement.

- Script, labels, voice prompt: `src/ep01/script.ts`
- Storyboard / animation per beat: `src/ep01/world.ts`
- Models (Zaha, Kuma, seating bowl, city, park): `src/iso/models.ts`
- Research notes and sources: `docs/ep01-research.md`

## Workflow

```bash
npm i
npm run dev                 # Remotion Studio preview
npm run voice               # design voice (once) + synthesize all beats + timeline
npm run voice -- cost hook  # re-generate specific beats
npm run render              # out/ep01.mp4
```

Without `public/ep01/timeline.json` the episode uses an estimated timeline
(silent), so the animation can be previewed before the voice exists.

### Keys

`scripts/voice.mjs` never reads the API key itself. In the Claude cloud
environment, a network secret injects `x-goog-api-key` for
`generativelanguage.googleapis.com`. Locally, export `GEMINI_API_KEY`.

### Sandbox notes

If Remotion can't download its headless Chrome, point it at a local one:
`REMOTION_BROWSER=/path/to/chrome-headless-shell npm run render`.
