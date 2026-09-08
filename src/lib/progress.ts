import type { FlashcardMarks } from "@/lib/flashcards";

/** Count how many flashcards are marked "known". */
export function countKnown(marks: FlashcardMarks): number {
  return Object.values(marks).filter((m) => m === "known").length;
}

/** A percentage 0–100 (rounded), guarding divide-by-zero. */
export function percent(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export interface ProgressSummary {
  topicsViewed: number;
  topicsTotal: number;
  cardsKnown: number;
  cardsTotal: number;
  quizBest: number;
  quizBestTotal: number;
}

/** Derived percentages + an overall completion figure for the dashboard. */
export function summarize(s: ProgressSummary) {
  const readingPct = percent(s.topicsViewed, s.topicsTotal);
  const cardsPct = percent(s.cardsKnown, s.cardsTotal);
  const quizPct = percent(s.quizBest, s.quizBestTotal);
  // Overall = simple average of the three tracked dimensions.
  const overall = Math.round((readingPct + cardsPct + quizPct) / 3);
  return { readingPct, cardsPct, quizPct, overall };
}
