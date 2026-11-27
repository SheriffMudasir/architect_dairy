// Episode 06 — "Bauhaus" — the school the Nazis shut down, and why it's everywhere today.
// First episode in the cinematic look: dark full-bleed, archival posters, flash words, marker
// annotations, chapter slates, AI paper-craft illustrations (labelled) for scenes nobody photographed.
import type { Beat, EpisodeScript } from "../shared/types";

const beats: Beat[] = [
  { id: "hook", act: "a", label: "", year: 1933, em: ["1933", "Nazis"], text: "In 1933, the Nazis forced this school to close." },
  { id: "why", act: "a", label: "", year: 1933, em: ["everywhere"], text: "So why is it everywhere today?" },
  { id: "stakes", act: "a", label: "", year: 1933, em: ["fourteen years", "chairs"], text: "It lasted fourteen years. But you've sat on its chairs and lived in buildings it inspired." },
  { id: "weimar", act: "a", label: "", year: 1919, em: ["1919", "Walter Gropius", "Bauhaus"], text: "Weimar, 1919. Germany has just lost a war. Walter Gropius opens a new school: the Bauhaus." },
  { id: "idea", act: "a", label: "", year: 1919, em: ["equals", "one roof"], text: "His idea: artists and craftsmen are equals, all under one roof." },
  { id: "teachers", act: "a", label: "", year: 1921, em: ["Kandinsky", "Paul Klee", "breathing exercises"], text: "His teachers were wild: Kandinsky, Paul Klee, and a mystic who began class with breathing exercises." },
  { id: "test", act: "a", label: "", year: 1923, em: ["colour", "shape", "Comment"], pause: 2.2, text: "Kandinsky even gave a test: which colour goes with each shape? Comment your answer." },
  { id: "reveal", act: "a", label: "", year: 1923, em: ["yellow triangle", "red square", "blue circle"], text: "His answer: yellow triangle, red square, blue circle. It's still the Bauhaus look." },
  { id: "pushback", act: "b", label: "", year: 1924, em: ["hated", "half"], text: "But conservatives hated it. In 1924, the government cut its budget in half, and the school had to move." },
  { id: "dessau", act: "b", label: "", year: 1926, em: ["Dessau", "glass"], text: "In Dessau, Gropius built it a new home: walls of glass, a factory for ideas." },
  { id: "chair", act: "b", label: "", year: 1925, em: ["Marcel Breuer", "bicycle", "chair"], text: "There, Marcel Breuer studied his bicycle's steel handlebars, and bent the same tubes into a chair." },
  { id: "women", act: "b", label: "", year: 1927, em: ["women", "weaving", "moneymaker"], text: "Most of its women were pushed into weaving, and turned it into the school's moneymaker." },
  { id: "nazis", act: "c", label: "", year: 1932, em: ["1932", "Nazis", "Berlin"], text: "In 1932, the Nazis took control of Dessau and closed it. The school fled to an empty factory in Berlin." },
  { id: "raid", act: "c", label: "", year: 1933, em: ["April 1933", "for good"], text: "April 1933: police raid it. In July, the teachers vote to shut it down for good." },
  { id: "twist", act: "c", label: "", year: 1933, em: ["arrest an idea", "with them"], text: "But you can't arrest an idea. Its teachers fled, and took the Bauhaus with them." },
  { id: "spread", act: "c", label: "", year: 1937, em: ["Harvard", "Chicago", "four thousand"], text: "Gropius to Harvard. Mies to Chicago. And in Tel Aviv, over four thousand buildings in its style." },
  { id: "payoff", act: "c", label: "", year: 1958, em: ["spread it everywhere"], text: "Glass towers. Steel chairs. Clean lines. The Nazis closed a school, and spread it everywhere." },
  { id: "question", act: "c", label: "", year: 2026, em: ["genius", "looks the same", "one word"], text: "So: genius, or the reason every building looks the same? Comment one word." },
];

const PAPER =
  "handmade paper-craft diorama photographed in a studio: layered cut paper and card, visible paper fibres and torn edges, miniature scale, soft warm studio light with gentle shadows, shallow depth of field, muted cream and ochre paper with accents of Bauhaus red, yellow and cobalt blue, cut-paper clouds, cinematic vertical 9:16 composition, no text, no lettering, no logos, no flags, no symbols";

export const SCRIPT: EpisodeScript = {
  id: "ep06",
  number: 6,
  title: "Bauhaus",
  look: "cinematic",
  beats,
  headlines: {
    a: { lead: "Bauhaus", accent: "1919 – 1933" },
    b: { lead: "Bauhaus", accent: "Dessau" },
    c: { lead: "Bauhaus", accent: "The end" },
  },
  hook: { lines: ["THE NAZIS SHUT IT", "WHY IS IT EVERYWHERE?"], until: 3.0, top: 980 },
  prompts: [{ beat: "test", text: "Comment your answer before the reveal", from: 0.6, untilBeat: "reveal" }],
  cta: "Genius or boring? Comment one word",
  cover: { lines: ["THE NAZIS SHUT IT", "WHY IS IT EVERYWHERE?"], beat: "hook", offset: 1.5, style: "hook" },
  endCard: false,
  generate: {
    style: PAPER,
    images: [
      { name: "ai-everywhere", aspect: "9:16", prompt: "A paper-craft modern city at dusk: white flat-roofed cube houses and glass-and-steel towers, a chrome tubular steel armchair in the foreground, warm lit windows" },
      { name: "ai-white-city", aspect: "9:16", prompt: "Rows of white flat-roofed 1930s apartment buildings with rounded balconies and long strip windows along a palm-lined street, bright Mediterranean sun" },
      { name: "ai-weimar-1919", aspect: "9:16", prompt: "A small German town in 1919 just after the First World War: steep roofs, a church spire, grey overcast sky, a few people in long coats and caps walking past an art-nouveau school building with large studio windows glowing warm" },
      { name: "ai-workshops", aspect: "9:16", prompt: "Cutaway paper-craft dollhouse of a school with four workshops stacked: a carpentry bench with wood shavings, a large weaving loom with coloured threads, an easel with an abstract geometric painting, a metal workshop with a desk lamp; tiny paper students working" },
      { name: "ai-breathing", aspect: "9:16", prompt: "A paper-craft courtyard where a row of tiny students in loose smocks stand with arms raised doing breathing exercises, led by a bald teacher in a long dark monk-like robe; soft morning light" },
      { name: "ai-angry-town", aspect: "9:16", prompt: "Conservative townspeople in hats and coats glaring and pointing at a modern art school building, newspapers fluttering in the wind, dark paper storm clouds gathering above" },
      { name: "ai-bicycle", aspect: "9:16", prompt: "A workshop table: a 1920s bicycle with shiny curved chrome steel handlebars beside a half-built tubular steel armchair frame made of the same chrome tubes, two hands bending a steel tube, warm lamp light" },
      { name: "ai-berlin-factory", aspect: "9:16", prompt: "An empty brick factory building in Berlin in 1932 at dusk, tall industrial windows, a plain facade with no signs and no writing, a few students carrying boxes and drawing boards inside, cold blue evening light" },
      { name: "ai-raid", aspect: "9:16", prompt: "Night in 1933: two boxy black 1930s vintage police lorries with round headlamps, no light bars, no stripes, parked in front of a brick factory building; silhouettes of police officers in long 1930s greatcoats and peaked caps at the doorway, students in coats being led out, harsh headlight beams and long shadows" },
      { name: "ai-exodus", aspect: "9:16", prompt: "An ocean liner crossing a cut-paper sea toward a paper Manhattan skyline at dawn, tiny figures with suitcases standing on deck looking ahead" },
      { name: "ai-glass-towers", aspect: "9:16", prompt: "A city of tall glass-and-steel office towers with strict grid facades around a stone plaza, dusk light, warm reflections in the glass" },
    ],
  },
  inserts: [
    // 1 — the hook: the real building, at night
    { kind: "photo", beat: "hook", from: 0, to: 0.62, src: "ai-raid", layout: "full", move: "in", focus: [0.4, 0.55] },
    { kind: "photo", beat: "hook", from: 0.62, to: 1, src: "dessau-night", layout: "wide", grade: "mono", move: "in" },
    // 2 — everywhere
    { kind: "photo", beat: "why", from: 0, to: 0.5, src: "ai-glass-towers", layout: "full", move: "up" },
    { kind: "photo", beat: "why", from: 0.5, to: 1, src: "ai-everywhere", layout: "full", move: "in" },
    { kind: "flash", beat: "why", text: "Everywhere", atWord: "everywhere", tone: "yellow" },
    // 3 — 14 years, chairs, buildings
    { kind: "flash", beat: "stakes", text: "14 years", atWord: "fourteen", tone: "red", dur: 0.7 },
    { kind: "photo", beat: "stakes", from: 0, to: 0.62, src: "wassily-chair", layout: "full", move: "left", focus: [0.5, 0.5] },
    { kind: "photo", beat: "stakes", from: 0.62, to: 1, src: "ai-white-city", layout: "full", move: "in" },
    // chapter 1 — Weimar
    { kind: "chapter", beat: "weimar", n: 1, title: "The idea", color: "yellow" },
    { kind: "photo", beat: "weimar", from: 0.12, to: 0.62, src: "ai-weimar-1919", layout: "full", move: "down" },
    { kind: "poster", beat: "weimar", from: 0.62, to: 1, src: "portrait-gropius", name: "Walter Gropius", role: "Founder · 1919", color: "red", shape: "square" },
    { kind: "photo", beat: "idea", from: 0, to: 0.48, src: "manifesto-woodcut", layout: "wide", move: "in" },
    { kind: "photo", beat: "idea", from: 0.48, to: 1, src: "ai-workshops", layout: "full", move: "up" },
    { kind: "poster", beat: "teachers", from: 0.25, to: 0.5, src: "portrait-kandinsky", name: "Wassily Kandinsky", role: "Painter", color: "blue", shape: "circle" },
    { kind: "poster", beat: "teachers", from: 0.5, to: 0.72, src: "portrait-klee", name: "Paul Klee", role: "Painter", color: "yellow", shape: "triangle" },
    { kind: "photo", beat: "teachers", from: 0.72, to: 1, src: "ai-breathing", layout: "full", move: "in" },
    { kind: "photo", beat: "teachers", from: 0, to: 0.25, src: "masters-roof-c", layout: "wide", grade: "mono", move: "in" },
    // the test: shapes stay blank through the pause, then fill
    { kind: "shapes", beat: "test", from: 0.3, to: 0, untilBeat: "reveal", revealAt: 9 },
    { kind: "shapes", beat: "reveal", from: 0, to: 0.62, revealAt: 0.05 },
    { kind: "photo", beat: "reveal", from: 0.62, to: 1, src: "questionnaire", layout: "wide", move: "in" },
    { kind: "mark", beat: "reveal", from: 0.68, to: 1, shape: "circle", x: 540, y: 820, w: 760, h: 520, label: "THE ORIGINAL, 1923" },
    // chapter 2 — the fight
    { kind: "chapter", beat: "pushback", n: 2, title: "The fight", color: "blue" },
    { kind: "photo", beat: "pushback", from: 0.12, to: 1, src: "ai-angry-town", layout: "full", move: "in" },
    { kind: "flash", beat: "pushback", text: "Half", atWord: "half", tone: "red", dur: 0.6 },
    // dessau beat = the 3D building assembling (no insert)
    { kind: "photo", beat: "dessau", from: 0.86, to: 1, src: "dessau-day", layout: "wide", move: "in" },
    { kind: "poster", beat: "chair", from: 0, to: 0.28, src: "portrait-breuer", name: "Marcel Breuer", role: "Student, then teacher", color: "red", shape: "circle" },
    { kind: "photo", beat: "chair", from: 0.28, to: 0.66, src: "ai-bicycle", layout: "full", move: "in" },
    { kind: "photo", beat: "chair", from: 0.66, to: 1, src: "wassily-chair", layout: "full", move: "out", focus: [0.5, 0.5] },
    { kind: "mark", beat: "chair", from: 0.72, to: 1, shape: "arrow", x: 140, y: 380, w: 200, h: 160, label: "BICYCLE TUBING" },
    { kind: "photo", beat: "women", from: 0, to: 0.58, src: "weaving", layout: "wide", move: "in" },
    { kind: "mark", beat: "women", from: 0.15, to: 0.58, shape: "circle", x: 160, y: 1110, w: 210, h: 270 },
    { kind: "poster", beat: "women", from: 0.58, to: 1, src: "portrait-stoelzl", name: "Gunta Stölzl", role: "First female master", color: "yellow", shape: "circle" },
    // chapter 3 — the end
    { kind: "chapter", beat: "nazis", n: 3, title: "The end", color: "red" },
    { kind: "photo", beat: "nazis", from: 0.55, to: 1, src: "ai-berlin-factory", layout: "full", move: "in" },
    { kind: "photo", beat: "raid", from: 0, to: 1, src: "ai-raid", layout: "full", move: "in" },
    { kind: "flash", beat: "raid", text: "Closed", atWord: "shut", tone: "red", dur: 0.7 },
    { kind: "photo", beat: "twist", from: 0.35, to: 1, src: "ai-exodus", layout: "full", move: "left" },
    { kind: "poster", beat: "spread", from: 0.28, to: 0.5, src: "portrait-mies", name: "Mies van der Rohe", role: "To Chicago · 1938", color: "blue", shape: "square" },
    { kind: "photo", beat: "spread", from: 0.5, to: 1, src: "telaviv", layout: "wide", grade: "mono", move: "in" },
    { kind: "number", beat: "spread", from: 0.62, to: 1, value: 4000, suffix: "+", label: "Buildings in Tel Aviv's White City", sub: "UNESCO World Heritage, 2003", accent: true },
    { kind: "photo", beat: "payoff", from: 0, to: 0.18, src: "seagram", layout: "wide", move: "in" },
    { kind: "photo", beat: "payoff", from: 0.18, to: 0.34, src: "wassily-chair", layout: "full", move: "in", focus: [0.5, 0.5] },
    { kind: "photo", beat: "payoff", from: 0.34, to: 0.5, src: "crownhall", layout: "wide", move: "in" },
    { kind: "photo", beat: "payoff", from: 0.5, to: 1, src: "ai-glass-towers", layout: "full", move: "out" },
    { kind: "photo", beat: "question", from: 0, to: 1.5, src: "dessau-night", layout: "wide", grade: "mono", move: "out" },
  ],
  music: {
    style:
      "Instruments: pulsing analogue synth arpeggio, marimba, deep sub bass hits, tight electronic percussion, a few piano notes. Modern cinematic explainer documentary, propulsive and curious. Key: E minor. Tempo around 110 BPM.",
    sections: [
      { from: "hook", to: "stakes", mood: "ominous opening: low drone and a ticking pulse, a bass hit on the first word" },
      { from: "weimar", to: "reveal", mood: "playful and inventive: marimba and synth arpeggios, building curiosity, holding still on the test" },
      { from: "pushback", to: "women", mood: "driving momentum: tighter percussion, rising synths" },
      { from: "nazis", to: "twist", mood: "dark and tense: sparse, heavy bass hits, a near-silence on the raid" },
      { from: "spread", to: "question", mood: "triumphant and expansive: full pulse returns, resolving on a final hit" },
    ],
    dips: ["test", "raid"],
  },
  sfx: [],
};
