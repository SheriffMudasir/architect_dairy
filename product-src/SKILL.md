---
name: isometric-explainer-studio
description: Produce polished 60–120 s vertical (1080×1920) explainer videos — architecture, landmarks, history, engineering — with crisp isometric low-poly 3D models, word-timed captions, a narrator voice, music, licensed stock photos/video and motion graphics (name cards, counters, stamps, quotes, timelines). Works with the tools the user already has — ElevenLabs, Gemini, OpenAI, marketplace tools or their own recordings for voice; Lyria, ElevenLabs Music or their own track for music; Openverse, Pexels, Pixabay or Wikimedia for stock media. Use when the user wants a short-form documentary/explainer video, a Reel/Short/TikTok about a building, place or story, or to set up, revise, re-voice, re-score or re-render one.
summary: Your agent researches, scripts, animates and voices 60–120 s vertical explainer videos with isometric 3D, word-timed captions, music and licensed stock media — using ElevenLabs, Gemini, OpenAI, Agensi tools or your own voice.
version: 1.1.0
tags: [video, remotion, shorts, reels, tiktok, explainer, documentary, architecture, history, motion-graphics]
keywords: [isometric 3d video, explainer video generator, architecture shorts, elevenlabs voiceover, gemini tts, lyria music, word timed captions, stock footage credits, remotion template, faceless youtube channel]
use_cases:
  - Make a 90-second Reel/Short about a famous building, landmark or unbuilt design
  - Run a faceless architecture or history channel with a consistent look and narrator
  - Turn research notes into a captioned, voiced explainer with licensed photos and credits
  - Re-voice or re-score an existing episode with a different provider
---
# Isometric Explainer Studio

You turn a topic into a finished vertical video: research → script → isometric 3D storyboard
→ voice → music → render. Everything is code (Remotion + a small 3D→SVG engine), so every
episode is reproducible and editable. This file is the playbook; details live in `reference/`.

Read only what the current step needs:

| Step | Read |
|---|---|
| First run / changing tools | `reference/onboarding.md`, `reference/providers.md` |
| Writing an episode | `reference/workflow.md`, `reference/storytelling.md` |
| Building visuals | `reference/inserts.md`, `reference/engine.md` |
| Stock photos & video | `reference/media-licensing.md` |
| Something fails | `reference/troubleshooting.md` |
| A complete worked example | `reference/example-episode.md` (+ `example-script/world/models.md`) |
| Template file list (text delivery) | `reference/template-manifest.md` |

## 0. First run — onboarding (always do this before the first episode)

Check for `studio.config.json` in the project. If it's missing, or the user wants to change
tools, run the onboarding interview in `reference/onboarding.md`:

1. **Ask** (use your question/choice tool if you have one, otherwise ask in chat, a few at a time):
   - Channel name, and niche (architecture, history, engineering, travel…)
   - **Voice:** ElevenLabs · Gemini · OpenAI · their own recordings / another tool
     (if ElevenLabs: which voice — offer to list them; if Gemini: a built-in voice, or design a
     new one from a description)
   - **Music:** Google Lyria · ElevenLabs Music · their own licensed track · none
   - **Stock media:** Openverse (free, no key) · Pexels · Pixabay · Wikimedia Commons (pick any)
   - **Voice check (transcription):** reuse the voice provider's key, Gemini, or skip
2. **Scaffold** the project if there isn't one — always into the user's working directory, never
   into the skill's own folder, and never run project commands from inside the skill:
   - **Skill folder is on disk** (downloaded/installed skill, e.g. Gumroad, `~/.claude/skills/…`):
     `node <this skill's folder>/scripts/init-project.mjs <target-dir>`
   - **Skill delivered as text** (marketplace/MCP delivery, no skill folder on disk): create
     `<target-dir>` and write every file listed in `reference/template-manifest.md` from the skill's
     `template/` files to its destination path, with the exact content (rename `_gitignore` →
     `.gitignore`, `_prettierrc` → `.prettierrc`). Do not save the skill itself anywhere.
   Then, inside `<target-dir>`: `npm install` (local only — never install packages globally, never edit files
   outside the project folder). Fonts are installed from npm by `npm run setup` (or `npm run fonts`).
3. **Write the config** from the answers: `npm run setup -- --channel "…" --voice … --music … --media …`
   (all flags in `reference/onboarding.md`). It prints exactly which API keys are needed and writes `.env.example`.
4. **Keys:** tell the user which variables to put in `.env` (or their agent/platform's secret store).
   **Never ask the user to paste a key into the chat, never print, log or commit keys.**
5. **Verify:** `npm run doctor` — checks Node, FFmpeg, packages, and makes one cheap authenticated
   request per provider (prints only "set"/"missing"). Fix anything red before continuing.
6. Optional: `npm run voice-audition -- <name> …` renders the same three lines with candidate voices
   so the user can choose by ear; `npm run voice-audition -- use <name>` locks one in.

**No API keys at all? Use your agent's tools (e.g. Agensi MCP tools).** If the agent has text-to-speech
or music tools — such as Agensi's ElevenLabs Text to Speech, MiniMax Speech or Google Lyria tools — run
`npm run setup -- --voice file --music file` (or `--music none`), generate each beat's `text` exactly
as written with the voice tool and save it as `public/<ep>/audio-src/<beat-id>.mp3`, generate one
instrumental track and save it as `public/<ep>/music-src.mp3`, then continue with `npm run voice` /
`npm run music` as usual. Tell the user each tool run's price before running it, if the tool reports one.
Stock photos via Openverse need no key either. (Details: `reference/providers.md`.)

## 1. Make an episode (summary — full steps in `reference/workflow.md`)

```bash
npm run new-episode -- ep01 "The Church That Took 144 Years"   # scaffold src/ep01 + docs/ep01-research.md
# research → docs/ep01-research.md (every claim gets a source; ⚠ for unconfirmed)
# script   → src/ep01/script.ts   (12–16 beats, 190–270 words, years, highlighted words, inserts, music plan)
npm run media -- ep01 search "<subject>" 20          # licensed photos (add --video for footage)
npm run media -- ep01 get <provider:id> <name>        # downloads + records credits
# storyboard → src/ep01/world.ts  (one camera shot per beat; models from src/iso/models.ts)
npm run stills -- ep01 <tmpdir> beats                 # silent preview frames — inspect them
npm run voice -- ep01 && npm run check-voice -- ep01  # narration + transcription check
npm run music -- ep01                                 # score shaped to the narration timing
npm run render -- ep01                                # out/ep01.mp4, mastered to -14 LUFS
```

Deliver the mp4 to the user and tell them: length, what to listen for (you cannot hear audio —
voice, music level, caption sync), every ⚠ fact, and the credits text (`npm run media -- ep01 credits`)
for the video description.

## 2. Non-negotiable rules

- **Facts:** research before writing; one row per claim with a source in `docs/<ep>-research.md`.
  Where sources disagree, leave the figure out. Unsourced quotes are labelled "attributed" or cut.
  Flag every ⚠ item to the user.
- **Narration text is spoken verbatim** — never put stage directions, brackets or "say warmly" in
  a beat's `text` (TTS engines read them aloud). Style belongs in the voice settings.
- **Licences:** only media that allows commercial use *and* modification (CC0, PDM, CC BY, CC BY-SA,
  Pexels License, Pixabay Content License). Skip re-uploads of professional/agency photos. Look at
  every image before using it (titles lie). Credits are shown in-video and listed for the description.
- **Visual honesty:** 3D models are labelled as simplified reconstructions in the research doc;
  label schematic distances ("not to scale"); unbuilt designs are drawn as dashed ghosts.
- **Pace:** something new on screen every 2–3 s (camera move, insert, photo, counter, stamp).
- **Secrets:** keys only in environment variables / `.env`; never in chat, code, config or git.
- **You can't hear audio:** verify by measurement (durations, loudness curves, transcription) and
  ask the user to listen.

## 3. Network access (disclosure)

The project only contacts the providers the user selects in `studio.config.json`:
Google Gemini/Lyria (`generativelanguage.googleapis.com`), ElevenLabs (`api.elevenlabs.io`),
OpenAI (`api.openai.com`), Openverse (`api.openverse.org`, images from `live.staticflickr.com`
and similar CC hosts), Pexels (`api.pexels.com`, `images.pexels.com`, `videos.pexels.com`),
Pixabay (`pixabay.com`, `cdn.pixabay.com`), Wikimedia (`commons.wikimedia.org`, `upload.wikimedia.org`),
plus npm for `npm install` and Remotion's headless-Chrome download on first render. Nothing else.
No telemetry; no data leaves the machine except the text/audio sent to the chosen providers.

## 4. Licensing notes for the user

- **Remotion** is free for individuals and companies of up to 3 people; larger companies need a
  Remotion company licence (remotion.dev/license). Mention this during onboarding if the user is a company.
- Fonts (Instrument Sans, JetBrains Mono) are SIL Open Font License — see `THIRD_PARTY.md`.
- Generated voice/music are subject to each provider's terms (commercial use depends on their plan).
