# Installing Isometric Explainer Studio

You received a folder named `isometric-explainer-studio` (inside the zip). Put it where your AI
agent loads skills, then just ask the agent for a video.

## Claude Code
- For all your projects: move the folder to `~/.claude/skills/isometric-explainer-studio/`
  (Windows: `%USERPROFILE%\.claude\skills\isometric-explainer-studio\`)
- Or for one project only: `<your-project>/.claude/skills/isometric-explainer-studio/`
- Restart Claude Code (or start a new session), then say:
  *"Make an explainer video about the Sydney Opera House."*

## Other agents with skill support (Codex CLI, Gemini CLI, Cursor, …)
Put the folder in that agent's skills directory (see its docs for "skills" or "SKILL.md"), or keep it
anywhere and tell the agent: *"Read `<path>/isometric-explainer-studio/SKILL.md` and follow it."*

## What happens next
1. The agent asks which tools you have (ElevenLabs / Gemini / OpenAI / your own audio; Lyria /
   ElevenLabs Music / your track; Openverse / Pexels / Pixabay / Wikimedia).
2. It creates a project folder for your videos and runs `npm install`.
3. It tells you which API keys to put in the project's `.env` file — paste them there yourself,
   never into the chat.
4. `npm run doctor` checks everything; then it makes your first episode.

## Requirements
- Node.js 20 or newer (nodejs.org) and FFmpeg (ffmpeg.org/download) installed on your computer
- Internet access for npm, your chosen AI services, and the first render (Remotion downloads a
  headless Chrome once)

## Updates
Download the new version from your purchase page and replace the skill folder. Your video projects
are separate folders and are not affected.
