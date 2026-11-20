// Episode 01 — "The Stadium Tokyo Threw Away"
// Zaha Hadid's New National Stadium (2012–2015) and Kengo Kuma's replacement.
// Every beat is one TTS clip. Beat lengths come from the generated audio
// (public/ep01/timeline.json); before audio exists they are estimated.

export type Act = "zaha" | "kuma" | "end";

export type Beat = {
  id: string;
  act: Act;
  /** Mono label under the headline: YEAR · PLACE */
  label: string;
  /** Exactly what the narrator says. */
  text: string;
};

export const HEADLINES: Record<Act, { lead: string; accent: string }> = {
  zaha: { lead: "Japan chose Zaha Hadid's stadium.", accent: "It was never built." },
  kuma: { lead: "Then the job went to", accent: "Kengo Kuma." },
  end: { lead: "One was never built.", accent: "One was never watched." },
};

export const BEATS: Beat[] = [
  {
    id: "hook",
    act: "zaha",
    label: "2012 · TOKYO",
    text: "In 2012, Japan picked Zaha Hadid to build its new National Stadium. It was never built.",
  },
  {
    id: "competition",
    act: "zaha",
    label: "2012 · DESIGN COMPETITION",
    text: "Forty-six designs entered. A jury led by Tadao Ando chose hers.",
  },
  {
    id: "design",
    act: "zaha",
    label: "2012 · ZAHA HADID ARCHITECTS",
    text: "Two giant arches, like a spine, carrying a roof over eighty thousand seats.",
  },
  {
    id: "site",
    act: "zaha",
    label: "2013 · MEIJI JINGU GAIEN",
    text: "But it would sit beside one of Tokyo's most loved parks. Fumihiko Maki and Toyo Ito, both Pritzker winners, said it was far too big. Critics called it a bike helmet.",
  },
  {
    id: "cost",
    act: "zaha",
    label: "2014 – 2015 · THE BILL",
    text: "Then came the bill. In 2014, the estimate was a hundred and sixty-three billion yen. A year later: two hundred and fifty-two billion. About two billion dollars.",
  },
  {
    id: "blame",
    act: "zaha",
    label: "2015 · WHO PAYS?",
    text: "Officials blamed the arches. Her office blamed soaring construction prices.",
  },
  {
    id: "scrapped",
    act: "zaha",
    label: "17 JULY 2015 · SCRAPPED",
    text: "On July seventeenth, 2015, Prime Minister Shinzo Abe scrapped it. Just days after it had been approved.",
  },
  {
    id: "withdraw",
    act: "zaha",
    label: "SEPTEMBER 2015 · SECOND COMPETITION",
    text: "Her team tried to enter the new competition. But no construction company would join them.",
  },
  {
    id: "kuma",
    act: "kuma",
    label: "DECEMBER 2015 · KENGO KUMA",
    text: "In December, the job went to Kengo Kuma. A low bowl of timber eaves, with wood from all forty-seven prefectures of Japan.",
  },
  {
    id: "familiar",
    act: "kuma",
    label: "2015 · SEATING BOWL",
    text: "Her office pointed out that the seating bowl looked remarkably familiar.",
  },
  {
    id: "death",
    act: "kuma",
    label: "MARCH 2016 · ZAHA HADID, 1950 – 2016",
    text: "Three months later, Zaha Hadid died. She was sixty-five.",
  },
  {
    id: "rugby",
    act: "end",
    label: "2019 · RUGBY WORLD CUP",
    text: "The new stadium missed the Rugby World Cup it was meant to host.",
  },
  {
    id: "empty",
    act: "end",
    label: "2021 · TOKYO OLYMPICS",
    text: "And when the Olympics finally came, in 2021, the pandemic kept every seat empty.",
  },
  {
    id: "outro",
    act: "end",
    label: "ZAHA HADID · KENGO KUMA",
    text: "One stadium was never built. The other was built, and almost no one got to watch.",
  },
];

// The Gemini voice-design prompt for the channel narrator.
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

// Per-request delivery direction prepended to every TTS call.
export const DELIVERY =
  "Narrate as a short documentary for architecture lovers. Intimate and close to the microphone, measured pace, crisp consonants. Let the last sentence of each line land with a small pause before it. Read the following:";
