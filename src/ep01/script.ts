// Episode 01 — "The Stadium Tokyo Threw Away"
// Zaha Hadid's New National Stadium (2012–2015) and Kengo Kuma's replacement.
// Node-safe data file: read by Remotion AND by scripts/voice.mjs + scripts/music.mjs.
import type { Beat, EpisodeScript } from "../shared/types";

const beats: Beat[] = [
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

export const SCRIPT: EpisodeScript = {
  id: "ep01",
  number: 1,
  title: "The Stadium Tokyo Threw Away",
  beats,
  headlines: {
    zaha: { lead: "Japan chose Zaha Hadid's stadium.", accent: "It was never built." },
    kuma: { lead: "Then the job went to", accent: "Kengo Kuma." },
    end: { lead: "One was never built.", accent: "One was never watched." },
  },
  music: {
    style:
      "Instruments: felt piano, warm analog synth pads, soft sub pulse, a little koto or shakuhachi colour used sparingly, light ticking percussion. Key: D minor. Tempo around 84 BPM.",
    sections: [
      { from: "hook", to: "design", mood: "curious and elegant; sparse piano motif over a soft pad, a gentle lift as the stadium rises" },
      { from: "site", to: "blame", mood: "tension grows; a steady ticking pulse enters and builds, low strings swell as costs climb" },
      { from: "scrapped", mood: "an abrupt stop: one deep, soft low hit, then near silence with a lingering pad" },
      { from: "withdraw", mood: "hollow and uncertain, single piano notes" },
      { from: "kuma", to: "familiar", mood: "warmer, wooden: koto plucks and a calm pulse, a quiet new beginning" },
      { from: "death", mood: "almost nothing: a single sustained pad and one soft piano chord. Reverent." },
      { from: "rugby", to: "empty", mood: "a slow, bittersweet build with ticking percussion, echoing and empty" },
      { from: "outro", mood: "resolve on the opening piano motif, fading out cleanly by the end" },
    ],
    dips: ["death"],
  },
  sfx: [
    { sfx: "swell", beat: "hook", offset: 0.2, volume: 0.28 },
    { sfx: "swell", beat: "design", offset: -0.3, volume: 0.28 },
    { sfx: "thud", beat: "scrapped", offset: 0.55, volume: 0.75 },
    { sfx: "swell", beat: "kuma", offset: 0, volume: 0.24 },
  ],
};
