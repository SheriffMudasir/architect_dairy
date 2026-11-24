import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { MONO, SANS } from "../fonts";
import { compile, ease, project } from "../iso/engine";
import { C } from "../theme";
import { CHANNEL_NAME } from "../channel";
import { EPISODES } from "../episodes";
import { beatIndexAt, Timeline } from "./timeline";
import { Captions } from "./Captions";
import { activeInserts, Credit, CreditsCard, FullBleed, Overlays, shakeAt, veilAt, YearBar } from "./Inserts";
import { Soundtrack } from "./Soundtrack";
import { CoverTitle, CtaPill, HookTitle } from "./Hook";

export type EpisodeProps = { episodeId: string; timeline: Timeline | null; credits?: Credit[]; cover?: boolean };

const SCENE_CX = 540;
const SCENE_CY = 1010;

export const Episode: React.FC<EpisodeProps> = ({ episodeId, timeline, credits = [], cover = false }) => {
  const ep = EPISODES.find((e) => e.id === episodeId)!;
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const tl = timeline!;
  const t = frame / fps;

  const baseCam = ep.camAt(tl, t, SCENE_CX, SCENE_CY);
  // punch-in: a small zoom kick at every beat change keeps the cut energetic
  const sinceBeat = Math.min(...tl.beats.map((b) => (t >= b.start - 0.35 ? t - b.start + 0.35 : Infinity)));
  const cam = { ...baseCam, scale: baseCam.scale * (1 + 0.05 * Math.exp(-Math.max(0, sinceBeat) * 5)) };
  const actives = activeInserts(ep.inserts, tl, t);
  const shake = shakeAt(actives);
  const veil = veilAt(actives, t);
  const { items, tags } = useMemo(() => ep.worldAt(tl, t), [ep, tl, t]);
  const drawables = compile(items, cam);

  const bi = beatIndexAt(tl, t);
  const beat = ep.beats[bi];
  const head = ep.headlines[beat.act];
  // headline cross-fade when the act changes
  const actStart = tl.beats.find((b, i) => ep.beats[i].act === beat.act)!.start;
  const headIn = ease((t - actStart + 0.2) / 0.6);
  const prevYear = ep.beats[Math.max(0, bi - 1)].year ?? beat.year ?? 0;
  const lastEnd = tl.beats[tl.beats.length - 1].end;
  const hookUntil = ep.hook ? (ep.hook.until ?? 2.6) : 0;
  // the top headline waits until the big hook title is gone (and is hidden on covers)
  const chrome = cover ? 0 : ep.hook ? interpolate(t, [hookUntil, hookUntil + 0.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: C.paper, fontFamily: SANS }}>
      <AbsoluteFill style={{ translate: `${shake.x}px ${shake.y}px` }}>
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

      <FullBleed actives={actives} t={t} ep={ep.id} />

      {/* paper fade at top and bottom so text sits on calm ground */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(${C.paper} 0%, ${C.paper}F2 14%, ${C.paper}00 27%, ${C.paper}00 70%, ${C.paper}E6 82%, ${C.paper} 100%)`,
        }}
      />

      {/* veil under cards and numbers */}
      <AbsoluteFill style={{ background: C.paper, opacity: veil }} />

      {/* in-world tags */}
      {tags.map((tag) => {
        const op = Math.max(0, Math.min(1, tag.opacity)) * (1 - veil);
        if (op <= 0.01) return null;
        const [px, y] = project(tag.at, cam);
        // keep tags inside the frame
        const w = tag.text.length * 15.6 + 40;
        const half = w / 2;
        // anchor: centred above the point, or beside it (left/right aligned)
        const cx = tag.align === "left" ? px + 14 + half : tag.align === "right" ? px - 14 - half : px;
        const x = Math.max(48 + half, Math.min(width - 48 - half, cx));
        const bg = tag.tone === "paper" ? C.massTop : C.ink;
        const fg = tag.tone === "accent" ? "#FF8A6E" : tag.tone === "paper" ? C.ink : C.massTop;
        return (
          <div
            key={tag.key}
            style={{
              position: "absolute",
              left: x,
              top: y + (tag.dy ?? 0),
              translate: `-50% ${(tag.align ? -50 : -100) + (1 - op) * 30}%`,
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

      <Overlays actives={actives} t={t} ep={ep.id} credits={credits} />
      </AbsoluteFill>

      {/* headline + label */}
      <div style={{ position: "absolute", left: 84, right: 84, top: 150, opacity: chrome }}>
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

      {ep.years && beat.year && chrome > 0.01 ? <YearBar years={ep.years} year={beat.year} prevYear={prevYear} t={t} beatStart={tl.beats[bi].start} /> : null}

      {cover ? null : <Captions words={tl.words} t={t} font={SANS} tl={tl} beats={ep.beats} />}
      {ep.hook && !cover ? <HookTitle lines={ep.hook.lines} t={t} until={hookUntil} top={ep.hook.top} /> : null}
      {!cover
        ? (ep.prompts ?? []).map((p, i) => {
            const bi2 = tl.beats.findIndex((b) => b.id === p.beat);
            if (bi2 < 0) return null;
            const b = tl.beats[bi2];
            const until = p.untilBeat ? tl.beats.find((x) => x.id === p.untilBeat) : tl.beats[bi2 + 1];
            return <CtaPill key={i} text={p.text} t={t} start={b.start + (p.from ?? 0) * (b.end - b.start)} end={until ? until.start + 0.2 : b.end + 1} />;
          })
        : null}
      {ep.cta && !cover ? <CtaPill text={ep.cta} t={t} start={tl.beats[tl.beats.length - 1].start + 0.3} /> : null}
      {cover && ep.cover?.style === "hook" && ep.hook ? <HookTitle lines={ep.hook.lines} t={1.5} until={hookUntil} top={ep.hook.top} /> : null}
      {cover && ep.cover && ep.cover.style !== "hook" ? <CoverTitle lines={ep.cover.lines} sub={ep.cover.sub} top={ep.cover.top} channel={`${CHANNEL_NAME} · EP ${String(ep.number).padStart(2, "0")}`} /> : null}

      {/* channel mark */}
      <div
        hidden={cover}
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
        {CHANNEL_NAME} · EP {String(ep.number).padStart(2, "0")}
      </div>

      {ep.endCard === false || cover ? null : <CreditsCard credits={credits} t={t} start={lastEnd + 1.2} />}

      <Soundtrack tl={tl} ep={ep} />
    </AbsoluteFill>
  );
};
