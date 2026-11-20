import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { MONO, SANS } from "../fonts";
import { compile, ease, project } from "../iso/engine";
import { C } from "../theme";
import { BEATS, HEADLINES } from "./script";
import { beatIndexAt, Timeline } from "./timeline";
import { camAt, worldAt } from "./world";
import { Captions } from "./Captions";


export type EpisodeProps = { timeline: Timeline | null };

const SCENE_CX = 540;
const SCENE_CY = 1010;

export const Episode: React.FC<EpisodeProps> = ({ timeline }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const tl = timeline!;
  const t = frame / fps;

  const cam = camAt(tl, t, SCENE_CX, SCENE_CY);
  const { items, tags } = useMemo(() => worldAt(tl, t), [tl, t]);
  const drawables = compile(items, cam);

  const bi = beatIndexAt(tl, t);
  const beat = BEATS[bi];
  const head = HEADLINES[beat.act];
  // headline cross-fade when the act changes
  const actStart = tl.beats.find((b, i) => BEATS[i].act === beat.act)!.start;
  const headIn = ease((t - actStart + 0.2) / 0.6);

  return (
    <AbsoluteFill style={{ backgroundColor: C.paper, fontFamily: SANS }}>
      {/* soft vignette */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 75% 55% at 50% 52%, ${C.paper} 55%, ${C.paperDeep} 100%)`,
        }}
      />
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        {drawables.map((d) =>
          d.el.t === "path" ? (
            <path
              key={d.key}
              d={d.el.d}
              fill={d.el.fill}
              fillOpacity={d.el.fillOpacity}
              stroke={d.el.stroke}
              strokeWidth={d.el.sw}
              strokeDasharray={d.el.dash}
              strokeLinejoin="round"
              strokeLinecap={d.el.cap as "round"}
              opacity={d.el.opacity}
            />
          ) : (
            <circle
              key={d.key}
              cx={d.el.cx}
              cy={d.el.cy}
              r={d.el.r}
              fill={d.el.fill}
              stroke={d.el.stroke}
              strokeWidth={d.el.sw}
              opacity={d.el.opacity}
            />
          ),
        )}
      </svg>

      {/* paper fade at top and bottom so text sits on calm ground */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(${C.paper} 0%, ${C.paper}F2 14%, ${C.paper}00 27%, ${C.paper}00 70%, ${C.paper}E6 82%, ${C.paper} 100%)`,
        }}
      />

      {/* in-world tags */}
      {tags.map((tag) => {
        const op = Math.max(0, Math.min(1, tag.opacity));
        if (op <= 0.01) return null;
        const [px, y] = project(tag.at, cam);
        // keep tags inside the frame
        const half = (tag.text.length * 15.6 + 40) / 2;
        const x = Math.max(48 + half, Math.min(width - 48 - half, px));
        const bg = tag.tone === "paper" ? C.massTop : C.ink;
        const fg = tag.tone === "accent" ? "#FF8A6E" : tag.tone === "paper" ? C.ink : C.massTop;
        return (
          <div
            key={tag.key}
            style={{
              position: "absolute",
              left: x,
              top: y + (tag.dy ?? 0),
              translate: `-50% ${-100 + (1 - op) * 30}%`,
              opacity: op,
              fontFamily: MONO,
              fontSize: 25,
              letterSpacing: 2,
              color: fg,
              background: bg,
              border: tag.tone === "paper" ? `1.5px solid ${C.ink}` : "none",
              padding: "8px 14px",
              borderRadius: 4,
              whiteSpace: "nowrap",
              boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
            }}
          >
            {tag.tone === "accent" ? <span style={{ color: C.accent }}>■ </span> : null}
            {tag.text}
          </div>
        );
      })}

      {/* headline + label */}
      <div style={{ position: "absolute", left: 84, right: 84, top: 150 }}>
        <div
          style={{
            fontSize: 70,
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: -1.5,
            color: C.ink,
            opacity: headIn,
            translate: `0 ${(1 - headIn) * 18}px`,
          }}
        >
          {head.lead} <span style={{ color: C.accent }}>{head.accent}</span>
        </div>
        <div
          style={{
            marginTop: 26,
            fontFamily: MONO,
            fontSize: 27,
            letterSpacing: 3,
            color: C.inkSoft,
          }}
        >
          {beat.label}
        </div>
      </div>

      <Captions words={tl.words} t={t} font={SANS} />

      {/* channel mark */}
      <div
        style={{
          position: "absolute",
          bottom: 92,
          width: "100%",
          textAlign: "center",
          fontFamily: MONO,
          fontSize: 22,
          letterSpacing: 6,
          color: C.inkSoft,
        }}
      >
        ARCHITECT DIARY · EP 01
      </div>

      {tl.beats.map((b) =>
        b.audio ? (
          <Sequence key={b.id} from={Math.round(b.start * fps)} layout="none">
            <Audio src={staticFile(b.audio)} />
          </Sequence>
        ) : null,
      )}
    </AbsoluteFill>
  );
};
