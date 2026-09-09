import type { ReadinessBand } from "@/lib/diagnostic";

/**
 * A persisted summary of one diagnostic attempt. Kept compact (summary, not the
 * full result) so a capped history fits comfortably in localStorage.
 */
export interface DiagnosticAttempt {
  /** Epoch ms when the attempt completed (captured by the component). */
  at: number;
  correct: number;
  total: number;
  readinessIndex: number | null;
  readinessBand: ReadinessBand;
  domains: Array<{ domainId: string; pct: number | null }>;
  /**
   * Compact per-skill breakdown for assessed skills, so the adaptive engine can
   * reconstruct assessment signal without re-storing the raw answers.
   */
  skills?: Array<{ skillId: string; correct: number; total: number }>;
  weakestSkillIds: string[];
  totalMs: number;
}

/** Maximum number of attempts retained in history. */
export const HISTORY_CAP = 20;

/**
 * Append an attempt, newest-first, capped to `cap`. Pure — returns a new array.
 */
export function appendAttempt(
  history: DiagnosticAttempt[],
  attempt: DiagnosticAttempt,
  cap: number = HISTORY_CAP
): DiagnosticAttempt[] {
  return [attempt, ...history].slice(0, Math.max(0, cap));
}

/** The most recent attempt, or undefined when history is empty. */
export function latestAttempt(
  history: DiagnosticAttempt[]
): DiagnosticAttempt | undefined {
  return history[0];
}
