# Onboarding interview

Run this on first use, or whenever the user wants to change tools. Keep it short: ask in
2–3 rounds, offer the recommended option first, and explain trade-offs in one line each.

## Round 1 — channel and voice

1. **Channel name** (shown as a small mark on every video) and **niche**
   (architecture · history · engineering · travel · other). The niche shapes music prompts.
2. **Narrator voice — which tool do you have?**
   - **ElevenLabs** (recommended if they have it): most natural voices, and it returns exact
     word timestamps, so captions are perfectly synced. Needs `ELEVENLABS_API_KEY`.
     → Ask which voice: offer `npm run voices` (after the key is set) to list theirs, or let them
     paste a voice ID from their ElevenLabs Voice Library (an ID is not a secret).
   - **Google Gemini TTS**: very good, cheap; can *design a brand-new voice from a description*
     (e.g. "warm, slightly husky British woman in her thirties, calm documentary pace").
     Needs `GEMINI_API_KEY`. → Ask: built-in voice (list with `npm run voices`) or describe one.
   - **OpenAI TTS**: solid, simple; voices alloy, ash, ballad, coral, echo, fable, nova, onyx, sage,
     shimmer, verse, plus a style instruction. Needs `OPENAI_API_KEY`.
   - **Own recordings / another tool** (`file`): they record or generate one audio file per line;
     you tell them the exact file names. No key needed.

## Round 2 — music, stock media, voice check

3. **Music:** Google **Lyria** (uses the Gemini key; scored to the narration's timing) ·
   **ElevenLabs Music** (uses the ElevenLabs key) · **their own licensed track** (`file`) · **none**.
4. **Stock photos / video** (multi-select):
   - **Openverse** — free, no key; Creative Commons photos (recommended baseline, always on).
   - **Pexels** — free key; photos *and* vertical video clips. (Pexels has at times paused new
     API keys — if they can't get one, use Pixabay.)
   - **Pixabay** — free key; photos and video.
   - **Wikimedia Commons** — free, no key, great for historic/landmark photos; ask for a contact
     (URL or email) to identify the client, as Wikimedia requests (it is sent only to Wikimedia).
5. **Voice check:** after generating narration, a transcription pass catches misreads. Default:
   reuse the voice provider's key (ElevenLabs Scribe / OpenAI Whisper / Gemini). Or skip.

## Round 3 — write config, set keys, verify

Map answers to one command (only include what applies):

```bash
npm run setup -- \
  --channel "My Channel" --niche architecture \
  --voice elevenlabs --elevenlabs-voice <voiceId> [--elevenlabs-model eleven_multilingual_v2] \
  # or: --voice gemini [--gemini-voice Kore | --voice-prompt "description…" --voice-gender female --voice-language en-GB]
  # or: --voice openai --openai-voice sage [--openai-instructions "…"]
  # or: --voice file
  --music lyria|elevenlabs|file|none \
  --media openverse,pexels,pixabay,wikimedia [--wikimedia-contact "https://…"] \
  --transcribe elevenlabs|gemini|openai|none
```

`setup` prints the exact environment variables required and writes `.env.example`. Then tell the
user (do not do it for them, and never ask them to paste keys into chat):

> Create a file named `.env` in the project folder (copy `.env.example`) and fill in:
> `ELEVENLABS_API_KEY=…` (ElevenLabs → Profile → API keys) …

Where users get keys:

| Variable | Where |
|---|---|
| `ELEVENLABS_API_KEY` | elevenlabs.io → Developers / Profile → API Keys (enable Text to Speech; Music and Speech to Text if used) |
| `GEMINI_API_KEY` | aistudio.google.com → Get API key |
| `OPENAI_API_KEY` | platform.openai.com → API keys |
| `PEXELS_API_KEY` | pexels.com/api → request key |
| `PIXABAY_API_KEY` | pixabay.com/api/docs (shown when logged in) |

If the user's agent runs in a sandbox that stores secrets itself (e.g. a cloud "network secret"
that injects a header), they can use that instead of `.env`; set
`STUDIO_KEYS_VIA_PROXY=gemini,elevenlabs` (provider names) in `.env` so the scripts don't demand
a local key. Header names: Gemini `x-goog-api-key`, ElevenLabs `xi-api-key`, OpenAI
`Authorization: Bearer`, Pexels `Authorization` (no prefix). Pixabay needs its key in the URL, so
it must be an environment variable.

Finally run `npm run doctor` and fix every ✗. When it says "All good", offer a voice audition:

```bash
npm run voice-audition -- current
npm run voice-audition -- warm --gemini-prompt "…"     # or --elevenlabs <id> / --openai sage
npm run voice-audition -- use warm                      # lock in the chosen voice
```

Send the user the `voice/auditions/*.wav` files to listen to, then start the first episode.

## Changing tools later

Re-run `npm run setup -- --voice … ` with only the flags that change; then `npm run doctor`.
After a voice change, re-run `npm run voice -- <ep> --force`, `check-voice` and `music` for
episodes you want to re-render.
