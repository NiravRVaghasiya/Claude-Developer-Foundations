import type { ExamConfig } from "@/lib/exam";

/**
 * Autosaved in-progress exam session. Stores just enough to fully rehydrate the
 * exam (the ordered question ids + per-question option order) plus the learner's
 * answers, flags, current index, and the running deadline — so a reload resumes
 * exactly where they left off, with the clock still ticking.
 */
export interface ExamSession {
  seed: number;
  startedAt: number;
  deadline: number;
  /** Ordered question ids of the assembled exam. */
  itemIds: string[];
  /** Per-question display option order (correctness is by id, so this is cosmetic). */
  optionOrder: Record<string, string[]>;
  answers: Record<string, string[]>;
  flags: Record<string, boolean>;
  index: number;
  config: ExamConfig;
}

/** True when a session exists and its deadline has not yet passed at `now`. */
export function isSessionActive(
  session: ExamSession | null,
  now: number
): boolean {
  if (!session) return false;
  return session.deadline > now;
}

/** Count of answered questions in a session. */
export function answeredCount(session: ExamSession): number {
  return Object.values(session.answers).filter((a) => a.length > 0).length;
}

/** Count of flagged questions in a session. */
export function flaggedCount(session: ExamSession): number {
  return Object.values(session.flags).filter(Boolean).length;
}
