import React from "react";
import { interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { Timeline } from "./timeline";

type Cue = { src: string; at: number; volume: number };

const cuesFor = (tl: Timeline): Cue[] => {
  const beat = (id: string) => tl.beats.find((b) => b.id === id)!;
  const cues: Cue[] = [];
  tl.beats.forEach((b, i) => {
    if (i > 0) cues.push({ src: "ep01/sfx/whoosh.wav", at: b.start - 0.45, volume: 0.16 });
  });
  cues.push({ src: "ep01/sfx/swell.wav", at: beat("hook").start + 0.2, volume: 0.28 });
  cues.push({ src: "ep01/sfx/swell.wav", at: beat("design").start - 0.3, volume: 0.28 });
  cues.push({ src: "ep01/sfx/thud.wav", at: beat("scrapped").start + 0.55, volume: 0.75 });
  cues.push({ src: "ep01/sfx/swell.wav", at: beat("kuma").start, volume: 0.24 });
  return cues;
};

export const Soundtrack: React.FC<{ tl: Timeline }> = ({ tl }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const total = durationInFrames / fps;
  const death = tl.beats.find((b) => b.id === "death");

  // music level: ducked under speech, dipped for the death beat, faded at the ends
  const musicVolume = (f: number) => {
    const t = f / fps;
    const speaking = tl.beats.some((b) => t > b.start - 0.15 && t < b.end + 0.1);
    let v = speaking ? 0.2 : 0.3;
    if (death && t > death.start - 0.5 && t < death.end + 0.3) v = 0.1;
    const fade = interpolate(t, [0, 0.8, total - 2.5, total], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return v * fade;
  };

  return (
    <>
      {tl.beats.map((b) =>
        b.audio ? (
          <Sequence key={b.id} from={Math.round(b.start * fps)} layout="none">
            <Audio src={staticFile(b.audio)} />
          </Sequence>
        ) : null,
      )}
      {tl.music ? <Audio src={staticFile(tl.music)} volume={musicVolume} /> : null}
      {tl.music
        ? cuesFor(tl).map((c, i) => (
            <Sequence key={i} from={Math.max(0, Math.round(c.at * fps))} layout="none">
              <Audio src={staticFile(c.src)} volume={c.volume} />
            </Sequence>
          ))
        : null}
    </>
  );
};
