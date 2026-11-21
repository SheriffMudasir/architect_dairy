# Isometric Explainer Studio

Turn any building, landmark or story into a polished 60–120 s vertical video — researched script,
crisp isometric low-poly 3D, word-timed captions, narrator voice, music, licensed stock photos and
footage, and motion graphics — directed by your AI coding agent.

**Bring your own tools:** ElevenLabs · Google Gemini · OpenAI · your own recordings for voice;
Google Lyria · ElevenLabs Music · your own track for music; Openverse · Pexels · Pixabay ·
Wikimedia Commons for stock media. On first use your agent asks which ones you have, writes the
config, tells you exactly which API keys to put in `.env`, and verifies everything.

## Requirements
- An agent that can run shell commands (Claude Code, Codex CLI, Cursor, Gemini CLI, …)
- Node.js 20+, FFmpeg, ~1 GB disk; internet for `npm install`, your chosen APIs and the first render
- API keys only for the providers you choose (Openverse + your own audio need none)

## Getting started
Ask your agent: *"Set up Isometric Explainer Studio and make a video about the Sydney Opera House."*
It will run the onboarding interview (`reference/onboarding.md`), scaffold a project with
`scripts/init-project.mjs`, configure providers, check keys with `npm run doctor`, and produce the episode.

## What you get
- `SKILL.md` — the playbook your agent follows (onboarding, workflow, rules)
- `reference/` — onboarding, providers, storytelling, inserts, engine, licensing, troubleshooting, worked example
- `template/` — the full Remotion project: engine, models, motion graphics, captions, mixer,
  provider scripts (`setup`, `doctor`, `voices`, `voice`, `check-voice`, `music`, `media`, `stills`, `render`)

## Licences
See `LICENSE.md` (your use) and `THIRD_PARTY.md` (Remotion, fonts, providers). Remotion requires a
company licence for companies of more than 3 people.
