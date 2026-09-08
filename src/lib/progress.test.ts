import { describe, it, expect } from "vitest";
import { countKnown, percent, summarize } from "./progress";
import type { FlashcardMarks } from "@/lib/flashcards";

describe("countKnown", () => {
  it("counts only 'known' marks", () => {
    const marks: FlashcardMarks = { a: "known", b: "unknown", c: "known" };
    expect(countKnown(marks)).toBe(2);
  });
  it("returns 0 for empty marks", () => {
    expect(countKnown({})).toBe(0);
  });
});

describe("percent", () => {
  it("rounds a ratio to a whole percent", () => {
    expect(percent(1, 3)).toBe(33);
    expect(percent(2, 4)).toBe(50);
  });
  it("guards divide-by-zero", () => {
    expect(percent(5, 0)).toBe(0);
  });
});

describe("summarize", () => {
  it("computes per-dimension and overall percentages", () => {
    const s = summarize({
      topicsViewed: 13,
      topicsTotal: 13,
      cardsKnown: 12,
      cardsTotal: 24,
      quizBest: 10,
      quizBestTotal: 10,
    });
    expect(s.readingPct).toBe(100);
    expect(s.cardsPct).toBe(50);
    expect(s.quizPct).toBe(100);
    expect(s.overall).toBe(83); // (100 + 50 + 100) / 3
  });

  it("is all zero for a fresh user", () => {
    const s = summarize({
      topicsViewed: 0,
      topicsTotal: 13,
      cardsKnown: 0,
      cardsTotal: 24,
      quizBest: 0,
      quizBestTotal: 0,
    });
    expect(s).toEqual({
      readingPct: 0,
      cardsPct: 0,
      quizPct: 0,
      overall: 0,
    });
  });
});
