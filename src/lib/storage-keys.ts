/** Centralized localStorage keys so every feature agrees on names. */
export const STORAGE_KEYS = {
  /** string[] of viewed topic ids. */
  viewedTopics: "ccdvf:viewed-topics",
  /** Record<flashcardId, "known" | "unknown">. */
  flashcardMarks: "ccdvf:flashcard-marks",
  /** Record<flashcardId, SR scheduling state>. */
  flashcardSchedule: "ccdvf:flashcard-schedule",
  /** number — best quiz score (correct count). */
  quizBestScore: "ccdvf:quiz-best-score",
  /** number — total questions in the best-scored attempt. */
  quizBestTotal: "ccdvf:quiz-best-total",
} as const;
