import React, { useMemo } from "react";
import { C } from "../theme";
import { Word } from "./timeline";

type Page = { words: Word[]; start: number; end: number };

const MAX_WORDS = 4;

const paginate = (words: Word[]): Page[] => {
  const pages: Page[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (!cur.length) return;
    pages.push({ words: cur, start: cur[0].startMs / 1000, end: cur[cur.length - 1].endMs / 1000 });
    cur = [];
  };
  words.forEach((w, i) => {
    const prev = words[i - 1];
    // a long pause also starts a new page
    if (prev && w.startMs - prev.endMs > 350) flush();
    cur.push(w);
    if (/[.,:;?!]$/.test(w.text.trim()) || cur.length >= MAX_WORDS) flush();
  });
  flush();
  return pages;
};

export const Captions: React.FC<{ words: Word[]; t: number; font: string }> = ({ words, t, font }) => {
  const pages = useMemo(() => paginate(words), [words]);
  const idx = pages.findIndex((p, i) => t >= p.start - 0.08 && t < (pages[i + 1]?.start ?? p.end + 0.6) - 0.08 && t < p.end + 0.6);
  if (idx < 0) return null;
  const page = pages[idx];
  const pop = Math.min(1, (t - page.start + 0.08) / 0.12);
  return (
    <div
      style={{
        position: "absolute",
        top: 1500,
        left: 70,
        right: 70,
        textAlign: "center",
        fontFamily: font,
        fontSize: 62,
        fontWeight: 600,
        letterSpacing: -0.8,
        lineHeight: 1.15,
        whiteSpace: "pre-wrap",
        scale: String(0.96 + 0.04 * pop),
        opacity: pop,
      }}
    >
      {page.words.map((w, i) => {
        const active = t >= w.startMs / 1000 - 0.03 && t < (page.words[i + 1]?.startMs ?? w.endMs + 300) / 1000;
        const spoken = t >= w.startMs / 1000;
        return (
          <span
            key={i}
            style={{
              color: active ? C.ink : spoken ? "#4A4740" : "#B3ADA2",
              fontWeight: active ? 700 : 600,
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};
