# Marketplace listing — Isometric Explainer Studio
(Not shipped in the zip. Copy into Agensi / other marketplaces.)

## Title
Isometric Explainer Studio — Architecture & History Shorts

## One-liner (card)
Your agent researches, scripts, animates and voices 60–120 s vertical explainers with isometric 3D,
word-timed captions, music and licensed stock media — using ElevenLabs, Gemini, OpenAI or your own voice.

## Description
Turn any building, landmark or story into a polished Reel/Short/TikTok — directed end-to-end by your AI agent.

**What it makes**
- Researched scripts with a source for every claim (flags anything unconfirmed)
- Crisp isometric low-poly 3D models with camera orbits, time-lapses, ghosted "unbuilt" designs
- Word-by-word captions with highlighted names and numbers
- Motion graphics: name cards, counters, stamps ("SCRAPPED"), quote cards, running year bar
- Licensed stock photos and video with automatic on-screen credits
- Narrator voice, music scored to the narration, synthesized sound effects, mastered to −14 LUFS

**Bring your own tools** — the agent asks on first run and configures everything:
- Voice: ElevenLabs (exact caption sync), Google Gemini (can design a brand-new voice from a
  description), OpenAI, or your own recordings / any TTS tool
- Music: Google Lyria, ElevenLabs Music, your own licensed track, or none
- Stock media: Openverse (free, no key), Pexels, Pixabay, Wikimedia Commons
- `npm run doctor` verifies tools, keys and network — keys stay in `.env`, never in chat

**Under the hood:** a complete Remotion project (React) with a custom 3D→SVG engine, reusable
models (city grids, towers, cranes, stadiums, hills), a mixer, and readable provider scripts.
Every video is code — reproducible and editable.

**Requirements:** an agent that can run shell commands (Claude Code, Codex CLI, Cursor, Gemini CLI…),
Node 20+, FFmpeg. API keys only for the providers you choose. Remotion requires a company licence
for companies of more than 3 people.

## Price suggestion
- One-time **$39** (launch $29), or **$12/month** including new models/episode templates and updates.
- Bundle idea later: "Episode packs" (pre-researched scripts + models for 5 famous buildings).

## Tags
video, remotion, shorts, reels, tiktok, explainer, documentary, architecture, history, elevenlabs,
gemini, tts, captions, motion graphics, 3d, isometric, content creation, youtube

## Demo assets (use your own episodes)
- `out/ep01.mp4` — "Japan chose Zaha Hadid's stadium. It was never built."
- `out/ep02.mp4` — "The Church That Took 144 Years" (Sagrada Família)
- 30–60 s screen recording: "make a video about X" → agent onboarding → doctor → render
- Credits for stock photos in those demos are in each episode's `public/<ep>/media/credits.json`

## Notes before submitting (for the seller)
- The skill writes a project template into the buyer's folder (`scripts/init-project.mjs` copies
  `template/`). Agensi says skills are "loaded on use and never downloaded" — confirm in their creator
  guide that skills may scaffold files into the buyer's project. If not, publish the template as a
  public repo or npm package and point `init-project` at it, keeping the playbook paid.
- Agensi tools: buyers can run voice/music through marketplace tools with no keys — the skill
  supports this via `voice.provider: file` / `music.provider: file` ("agent-tool mode").
- Tested end-to-end here with Gemini voice, Openverse photos, local video, Lyria and file music.
  ElevenLabs, OpenAI, Pexels and Pixabay paths follow their public APIs but were not run with real
  keys in this environment — run `npm run doctor` + one episode with each before listing claims.
