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
  /** DiagnosticAttempt[] — most-recent-first, capped history of diagnostic runs. */
  diagnosticHistory: "ccdvf:diagnostic-history",
  /** ExamSession | null — the in-progress exam simulation (autosaved). */
  examSession: "ccdvf:exam-session",
} as const;
