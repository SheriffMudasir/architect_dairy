// Episode 05 — "First African Pritzker Winner" — Francis Kéré and the Gando school.
// Story + a guess-the-answer comment prompt before the reveal. Photos + 3D, no AI.
import type { Beat, EpisodeScript } from "../shared/types";

const beats: Beat[] = [
  { id: "hook", act: "prize", label: "DIÉBÉDO FRANCIS KÉRÉ · PRITZKER 2022", year: 2022, em: ["highest honour", "mud"], text: "In 2022, architecture's highest honour went to a man whose first building was made of mud." },
  { id: "stakes", act: "prize", label: "CONCRETE VS CLAY", year: 1999, em: ["concrete", "clay"], text: "His village wanted concrete. He gave them clay. And the clay won." },
  { id: "gando", act: "village", label: "GANDO · BURKINA FASO", year: 1972, em: ["no school", "seven"], text: "Gando, Burkina Faso. There was no school. So at seven, the chief's son, Francis Kéré, was sent away to learn to read." },
  { id: "classroom", act: "village", label: "TENKODOGO · HIS CLASSROOM", year: 1972, em: ["no air", "hundred"], text: "His classroom was cement blocks, with no air, barely any light, and more than a hundred children packed inside." },
  { id: "germany", act: "village", label: "1985 · GERMANY", year: 1985, em: ["Germany", "Berlin"], text: "A carpentry scholarship took him to Germany, and he went on to study architecture in Berlin." },
  { id: "money", act: "plan", label: "1998 · BUILDING BLOCKS FOR GANDO", year: 1998, em: ["one thing"], text: "While still a student, he raised money for one thing: a school back home." },
  { id: "pushback", act: "plan", label: "THE VILLAGE SAYS NO", year: 1999, em: ["pushed back", "concrete and glass"], text: "But the village pushed back. They wanted concrete and glass, like Europe." },
  { id: "heat", act: "plan", label: "THE PROBLEM", year: 1999, em: ["traps heat", "no electricity"], text: "Concrete traps heat. Cooling it needs air conditioning. And Gando had no electricity." },
  { id: "guess", act: "plan", label: "YOUR TURN", year: 1999, em: ["no power", "guess"], pause: 2.2, text: "So how do you cool a classroom with no power? Comment your guess, then keep watching." },
  { id: "walls", act: "build", label: "STEP 1 · THE WALLS", year: 2000, em: ["clay bricks", "villagers"], text: "First, the walls: clay bricks, pressed by hand by the villagers themselves." },
  { id: "roof", act: "build", label: "STEP 2 · THE ROOF", year: 2000, em: ["second roof"], text: "Then the trick: a second roof, floating above the first." },
  { id: "air", act: "build", label: "HOW IT BREATHES", year: 2001, em: ["hot air", "breeze", "never"], text: "Hot air rises through the clay ceiling, and the breeze carries it away. The sun never touches the classroom." },
  { id: "cooler", act: "build", label: "THE RESULT", year: 2001, em: ["six degrees", "zero electricity"], text: "Up to six degrees cooler, with zero electricity." },
  { id: "opened", act: "after", label: "2001 · GANDO PRIMARY SCHOOL", year: 2001, em: ["village"], text: "Built by the village, for the village, Gando Primary School opened in 2001." },
  { id: "growth", act: "after", label: "2001 – 2017", year: 2017, em: ["library", "London"], text: "Then came more classrooms, a library, a secondary school, and a pavilion in London." },
  { id: "prize", act: "after", label: "MARCH 2022 · PRITZKER PRIZE", year: 2022, em: ["first African"], text: "In 2022, he became the first African to win the Pritzker Prize." },
  { id: "mud", act: "after", label: "GANDO", year: 2022, em: ["didn't want mud"], text: "And it all started with a village that didn't want mud." },
  { id: "question", act: "after", label: "YOUR CALL", year: 2022, em: ["mud", "concrete", "one word"], text: "So, mud or concrete? Comment one word." },
];

export const SCRIPT: EpisodeScript = {
  id: "ep05",
  number: 5,
  title: "First African Pritzker Winner",
  beats,
  headlines: {
    prize: { lead: "The first African", accent: "to win the Pritzker." },
    village: { lead: "A village", accent: "with no school." },
    plan: { lead: "They wanted concrete.", accent: "He wanted clay." },
    build: { lead: "A classroom that cools", accent: "without electricity." },
    after: { lead: "Built by the village,", accent: "for the village." },
  },
  years: [1965, 2022],
  hook: { lines: ["FIRST AFRICAN", "PRITZKER WINNER"], until: 3.2, top: 1000 },
  prompts: [{ beat: "guess", text: "Comment your guess before the reveal", from: 0.55, untilBeat: "walls" }],
  cta: "Mud or concrete? Comment one word",
  cover: { lines: ["THE MUD SCHOOL", "THAT WON"], sub: "FIRST AFRICAN PRITZKER WINNER", beat: "hook", offset: 1.5, top: 1000 },
  endCard: false,
  inserts: [
    { kind: "photo", beat: "hook", from: 0, to: 1, src: "portrait-kere", layout: "full", move: "in", focus: [0.5, 0.3] },
    { kind: "number", beat: "classroom", from: 0.68, to: 1, value: 100, suffix: "+", label: "Children in one classroom", format: "plain", accent: true },
    { kind: "stamp", beat: "germany", from: 0.15, to: 1, text: "SCHOLARSHIP", sub: "CARPENTRY · 1985 · GERMANY" },
    { kind: "photo", beat: "money", from: 0, to: 1, src: "kere-young", layout: "card", caption: "Kéré with an architectural model", tilt: -3, side: "right" },
    { kind: "photo", beat: "opened", from: 0, to: 0.55, src: "gando-school", layout: "card", caption: "Gando Primary School, 2001", tilt: 2, side: "left" },
    { kind: "photo", beat: "opened", from: 0.5, to: 1, src: "gando-donkeys", layout: "card", caption: "The school grounds, Gando", tilt: -2, side: "right" },
    { kind: "stamp", beat: "opened", from: 0.6, to: 1, text: "AGA KHAN AWARD", sub: "2004" },
    { kind: "photo", beat: "growth", from: 0.55, to: 1, src: "serpentine2", layout: "card", caption: "Serpentine Pavilion, London, 2017", tilt: 2, side: "right" },
    { kind: "number", beat: "cooler", from: 0.05, to: 1, value: 6, prefix: "−", suffix: "°C", label: "Up to, vs a tin roof alone", sub: "Source: Aga Khan Trust for Culture", format: "plain", accent: true },
    { kind: "stamp", beat: "prize", from: 0.1, to: 0.55, text: "PRITZKER PRIZE", sub: "2022 · FIRST AFRICAN LAUREATE" },
    { kind: "person", beat: "prize", from: 0.5, to: 1, name: "Diébédo Francis Kéré", role: "51st Pritzker laureate", photo: "portrait-kere" },
    { kind: "photo", beat: "question", from: 0, to: 1.5, src: "portrait-kere", layout: "full", move: "out", focus: [0.5, 0.3] },
  ],
  music: {
    style:
      "Instruments: balafon, kora, soft hand percussion, warm acoustic bass, light strings. Hopeful West African documentary score, gentle and warm, never busy. Key: G major. Tempo around 100 BPM.",
    sections: [
      { from: "hook", to: "stakes", mood: "bright, curious opening: a balafon motif over soft percussion" },
      { from: "gando", to: "germany", mood: "tender and nostalgic, sparse kora" },
      { from: "money", to: "guess", mood: "tension builds: lower register, a ticking pulse, holding on the question" },
      { from: "walls", to: "cooler", mood: "the reveal: rhythmic, inventive, building with each step" },
      { from: "opened", to: "question", mood: "uplifting and proud, full warm ensemble, resolving softly at the end" },
    ],
    dips: ["guess"],
  },
  sfx: [],
};
