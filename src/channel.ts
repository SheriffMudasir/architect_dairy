// Channel-wide settings shared by every episode (node-safe: no imports).

export const CHANNEL_NAME = "ARCHITECT DIARY";

// The Gemini voice-design prompt for the channel narrator. Created once
// (voice/narrator.json holds the resulting voice id) and reused every episode.
export const VOICE_DESIGN = {
  display_name: "Architect Diary Narrator",
  gender: "female",
  language_code: "en-GB",
  accent: "Neutral British, softly international",
  persona: "Documentary narrator",
  context: "Short-form architecture documentary",
  prompt:
    "A woman in her mid-thirties with a warm, low-mid, slightly husky voice. Intelligent and quietly confident, like an architecture critic telling a friend a story she finds fascinating. Clear, softly British, internationally neutral diction. Calm, unhurried pace with natural pauses; a hint of dry wit on ironic lines; never theatrical, never salesy, no announcer tone.",
};
