import React, { useMemo } from "react";
import { Easing, interpolate } from "remotion";
import { C } from "../theme";
import { Timeline, Word } from "./timeline";
import type { Beat } from "./types";

type Page = { words: (Word & { em: boolean })[]; start: number; end: number };

const MAX_WORDS = 3;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9']/g, "");

const paginate = (words: Word[], isEm: (w: Word) => boolean): Page[] => {
  const pages: Page[] = [];
  let cur: Page["words"] = [];
  const flush = () => {
    if (!cur.length) return;
    pages.push({ words: cur, start: cur[0].startMs / 1000, end: cur[cur.length - 1].endMs / 1000 });
    cur = [];
  };
  words.forEach((w, i) => {
    const prev = words[i - 1];
    if (prev && w.startMs - prev.endMs > 300) flush(); // a pause starts a new page
    const em = isEm(w);
    // an emphasised word gets its own page if the page already has 2 words
    if (em && cur.length >= 2) flush();
    cur.push({ ...w, em });
    const len = cur.reduce((a, x) => a + x.text.trim().length, 0);
    if (/[.,:;?!—]$/.test(w.text.trim()) || cur.length >= MAX_WORDS || len > 16) flush();
  });
  flush();
  return pages;
};

export const Captions: React.FC<{ words: Word[]; t: number; font: string; tl: Timeline; beats: Beat[] }> = ({ words, t, font, tl, beats }) => {
  const pages = useMemo(() => {
    const beatAt = (ms: number) => {
      let idx = 0;
      tl.beats.forEach((b, i) => {
        if (ms / 1000 >= b.start - 0.05) idx = i;
      });
      return beats[idx];
    };
    return paginate(words, (w) => {
      const em = beatAt(w.startMs)?.em ?? [];
      const n = norm(w.text);
      return em.some((e) => e.split(/\s+/).map(norm).includes(n));
    });
  }, [words, tl, beats]);

  const idx = pages.findIndex((p, i) => t >= p.start - 0.06 && t < Math.min(pages[i + 1]?.start ?? Infinity, p.end + 0.5) - 0.06);
  if (idx < 0) return null;
  const page = pages[idx];
  const local = t - page.start + 0.06;
  const pop = interpolate(local, [0, 0.16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.2, 1.4, 0.4, 1) });

  return (
    <div
      style={{
        position: "absolute",
        top: 1470,
        left: 60,
        right: 60,
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "0 20px",
        fontFamily: font,
        fontSize: 84,
        fontWeight: 700,
        letterSpacing: -2,
        lineHeight: 1.08,
        translate: `0 ${(1 - pop) * 22}px`,
        opacity: Math.min(1, pop * 1.5),
      }}
    >
      {page.words.map((w, i) => {
        const start = w.startMs / 1000;
        const next = page.words[i + 1]?.startMs ?? w.endMs + 250;
        const active = t >= start - 0.03 && t < next / 1000;
        const spoken = t >= start - 0.03;
        const wp = interpolate(t, [start - 0.03, start + 0.12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const word = w.text.trim();
        return (
          <span
            key={i}
            style={{
              position: "relative",
              display: "inline-block",
              color: w.em ? (spoken ? "#FFFFFF" : C.accent) : spoken ? C.ink : "#B9B2A6",
              scale: String(active ? 1 + 0.07 * (1 - Math.abs(wp - 0.6)) : 1),
              padding: w.em ? "0 14px" : 0,
              textShadow: w.em ? "none" : `0 0 18px ${C.paper}, 0 0 6px ${C.paper}`,
              zIndex: 1,
            }}
          >
            {w.em ? (
              <span
                style={{
                  position: "absolute",
                  inset: "6px 0 2px",
                  background: C.accent,
                  borderRadius: 10,
                  zIndex: -1,
                  scale: `${spoken ? wp : 0} 1`,
                  transformOrigin: "left center",
                  rotate: "-1.5deg",
                }}
              />
            ) : null}
            {word}
          </span>
        );
      })}
    </div>
  );
};
