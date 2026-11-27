import React from "react";
import { interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { Timeline } from "./timeline";
import type { EpisodeScript } from "./types";
import { insertWindow } from "./Inserts";

// Shared, synthesised effects live in public/sfx (scripts/sfx.sh).
export const Soundtrack: React.FC<{ tl: Timeline; ep: EpisodeScript }> = ({ tl, ep }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const total = durationInFrames / fps;
  const beat = (id: string) => tl.beats.find((b) => b.id === id);
  const dips = (ep.music.dips ?? []).map(beat).filter(Boolean) as Timeline["beats"];

  // music level: ducked under speech, dipped on chosen beats, faded at the ends
  const musicVolume = (f: number) => {
    const t = f / fps;
    const speaking = tl.beats.some((b) => t > b.start - 0.15 && t < b.end + 0.1);
    let v = speaking ? 0.15 : 0.28;
    if (dips.some((d) => t > d.start - 0.5 && t < d.end + 0.3)) v = 0.1;
    const fade = interpolate(t, [0, 0.8, total - 2.5, total], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return v * fade;
  };

  const cues = [
    // an audible hit on frame 0 so the first second is never silent
    ...(ep.hook ? [{ src: "sfx/whoosh.wav", at: 0, volume: 0.4 }, { src: "sfx/thud.wav", at: 0.05, volume: 0.35 }] : []),
    // a soft whoosh into every new beat (camera move)
    ...tl.beats.slice(1).map((b) => ({ src: "sfx/whoosh.wav", at: b.start - 0.45, volume: 0.16 })),
    // inserts bring their own sounds: thud on stamps, a soft tick on cards and numbers
    ...(ep.inserts ?? []).flatMap((ins) => {
      const b = beat(ins.beat);
      const w = insertWindow(ins, tl);
      if (!b || !w) return [];
      const at = w.start;
      if (ins.kind === "flash") return [{ src: "sfx/thud.wav", at, volume: 0.55 }];
      if (ins.kind === "chapter") return [{ src: "sfx/whoosh.wav", at: at - 0.08, volume: 0.45 }, { src: "sfx/thud.wav", at: at + 0.12, volume: 0.5 }];
      if (ins.kind === "poster") return [{ src: "sfx/whoosh.wav", at: at - 0.05, volume: 0.3 }];
      if (ins.kind === "mark") return [{ src: "sfx/tick.wav", at: at + 0.05, volume: 0.3 }];
      if (ins.kind === "shapes") return [{ src: "sfx/tick.wav", at: at + 0.1, volume: 0.35 }];
      if (ins.kind === "stamp") return [{ src: "sfx/thud.wav", at: at + 0.12, volume: 0.8 }];
      if (ins.kind === "letters") return [{ src: "sfx/thud.wav", at: at + (ins.fallAt ?? 0.35) * (b.end - b.start) + 0.8, volume: 0.5 }];
      if (ins.kind === "number" || ins.kind === "person" || ins.kind === "quote" || (ins.kind === "photo" && ins.layout === "card"))
        return [{ src: "sfx/tick.wav", at, volume: 0.35 }];
      if (ins.kind === "photo" || ins.kind === "video") return [{ src: "sfx/whoosh.wav", at: at - 0.1, volume: ep.look === "cinematic" ? 0.22 : 0.12 }];
      return [];
    }),
    // a tick when each mid-video comment prompt appears
    ...(ep.prompts ?? []).flatMap((p) => {
      const b = beat(p.beat);
      return b ? [{ src: "sfx/tick.wav", at: b.start + (p.from ?? 0) * (b.end - b.start), volume: 0.5 }] : [];
    }),
    ...ep.sfx
      .filter((c) => beat(c.beat))
      .map((c) => ({ src: `sfx/${c.sfx}.wav`, at: beat(c.beat)!.start + (c.offset ?? 0), volume: c.volume ?? 0.3 })),
  ];

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
        ? cues.map((c, i) => (
            <Sequence key={i} from={Math.max(0, Math.round(c.at * fps))} layout="none">
              <Audio src={staticFile(c.src)} volume={c.volume} />
            </Sequence>
          ))
        : null}
    </>
  );
};
