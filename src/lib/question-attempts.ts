import type { Blueprint } from "@content/blueprint";
import type { QuizQuestion } from "@/lib/content-types";
import { isQuestionCorrect } from "@/lib/quiz";

/**
 * Local, privacy-preserving per-question performance analytics.
 *
 * A `QuestionAttempt` records ONLY the graded outcome of answering a question —
 * no free text, no answer content, no identity — so there is no PII to leak.
 * These attempts power error-driven remediation (repeated errors, recently
 * missed skills) and learner feedback (accuracy, response time), entirely on
 * the client via the existing `useLocalStorage` abstraction.
 *
 * All functions here are PURE and deterministic; the clock is passed in.
 */

/** The source assessment that produced an attempt. */
export type AttemptSource = "quiz" | "diagnostic" | "exam";

/** One graded answer to one question. Compact and PII-free. */
export interface QuestionAttempt {
  /** Question id (FK -> QuizQuestion.id). */
  questionId: string;
  /** Epoch ms when the attempt was graded. */
  at: number;
  /** Whether the selected set exactly matched the correct set. */
  correct: boolean;
  /** Response time in ms, when the surface measured it. */
  responseMs?: number;
  /** Owning domain id (resolved from the question's first mapped skill). */
  domainId?: string;
  /** Blueprint skill ids the question assessed. */
  skillIds: string[];
  /** Which assessment produced this attempt. */
  source: AttemptSource;
}

/** Maximum attempts retained (newest-first). Bounds localStorage growth. */
export const ATTEMPTS_CAP = 500;

/** Map a question to a single domain id via its first skill's domain. */
function domainOfQuestion(
  q: QuizQuestion,
  skillToDomain: Map<string, string>
): string | undefined {
  for (const sid of q.skillIds ?? []) {
    const d = skillToDomain.get(sid);
    if (d) return d;
  }
  return undefined;
}

export interface RecordAttemptsInput {
  /** The questions that were answered (only answered ones should be passed). */
  questions: QuizQuestion[];
  /** Selected option ids per question id. */
  answers: Record<string, string[]>;
  /** Optional response time per question id, in ms. */
  responseMsById?: Record<string, number>;
  blueprint: Blueprint;
  source: AttemptSource;
  /** Grading clock (epoch ms). */
  now: number;
}

/**
 * Build `QuestionAttempt`s for a set of graded answers. Only questions that
 * appear in `answers` with a non-empty selection are recorded (unanswered
 * questions produce no attempt, so accuracy isn't polluted by skips).
 */
export function buildAttempts(input: RecordAttemptsInput): QuestionAttempt[] {
  const { questions, answers, responseMsById, blueprint, source, now } = input;
  const skillToDomain = new Map<string, string>();
  for (const d of blueprint.domains)
    for (const sk of d.skills) skillToDomain.set(sk.id, d.id);

  const attempts: QuestionAttempt[] = [];
  for (const q of questions) {
    const selected = answers[q.id];
    if (!selected || selected.length === 0) continue;
    attempts.push({
      questionId: q.id,
      at: now,
      correct: isQuestionCorrect(q, selected),
      responseMs: responseMsById?.[q.id],
      domainId: domainOfQuestion(q, skillToDomain),
      skillIds: q.skillIds ?? [],
      source,
    });
  }
  return attempts;
}

/** Prepend new attempts, newest-first, capped. Pure — returns a new array. */
export function appendAttempts(
  history: QuestionAttempt[],
  next: QuestionAttempt[],
  cap: number = ATTEMPTS_CAP
): QuestionAttempt[] {
  // Newest-first: latest of `next` should be at the front.
  const merged = [...[...next].reverse(), ...history];
  return merged.slice(0, Math.max(0, cap));
}

// ---- Derived metrics ----------------------------------------------------------

export interface AccuracyStat {
  correct: number;
  total: number;
  /** 0–100, or null when total === 0. */
  pct: number | null;
}

function acc(correct: number, total: number): AccuracyStat {
  return { correct, total, pct: total > 0 ? Math.round((correct / total) * 100) : null };
}

export interface SkillPerformance {
  skillId: string;
  attempts: number;
  correct: number;
  /** 0–100 accuracy, or null when never attempted. */
  pct: number | null;
  /** Attempts that were wrong. */
  misses: number;
  /** Most recent attempt timestamp for this skill, or null. */
  lastAt: number | null;
  /** Whether the MOST RECENT attempt on this skill was wrong. */
  recentlyMissed: boolean;
  /** Consecutive wrong attempts counting back from the most recent. */
  currentMissStreak: number;
}

export interface PerformanceSummary {
  overall: AccuracyStat;
  byDomain: Map<string, AccuracyStat>;
  bySkill: Map<string, SkillPerformance>;
  /** Mean response time in ms over attempts that recorded one, or null. */
  avgResponseMs: number | null;
  /** Fraction 0–1 of DISTINCT attempted questions missed more than once. */
  repeatedErrorRate: number;
}

/**
 * Summarize a (newest-first) attempt log into overall/domain/skill accuracy,
 * repeated-error rate, recently-missed skills, and average response time.
 * Deterministic; no clock needed (recency is relative to the log itself).
 */
export function summarizePerformance(
  history: QuestionAttempt[]
): PerformanceSummary {
  let overallCorrect = 0;
  const byDomainAgg = new Map<string, { c: number; t: number }>();
  const bySkillAgg = new Map<
    string,
    {
      c: number;
      t: number;
      misses: number;
      lastAt: number;
      // ordered attempts (newest-first) for streak/recency
      order: Array<{ at: number; correct: boolean }>;
    }
  >();
  const perQuestionMisses = new Map<string, number>();
  const attemptedQuestions = new Set<string>();

  let respSum = 0;
  let respCount = 0;

  for (const a of history) {
    if (a.correct) overallCorrect += 1;
    attemptedQuestions.add(a.questionId);
    if (!a.correct)
      perQuestionMisses.set(a.questionId, (perQuestionMisses.get(a.questionId) ?? 0) + 1);

    if (a.domainId) {
      const d = byDomainAgg.get(a.domainId) ?? { c: 0, t: 0 };
      d.t += 1;
      if (a.correct) d.c += 1;
      byDomainAgg.set(a.domainId, d);
    }

    for (const sid of a.skillIds) {
      const s =
        bySkillAgg.get(sid) ?? { c: 0, t: 0, misses: 0, lastAt: 0, order: [] };
      s.t += 1;
      if (a.correct) s.c += 1;
      else s.misses += 1;
      if (a.at > s.lastAt) s.lastAt = a.at;
      s.order.push({ at: a.at, correct: a.correct });
      bySkillAgg.set(sid, s);
    }

    if (typeof a.responseMs === "number" && a.responseMs >= 0) {
      respSum += a.responseMs;
      respCount += 1;
    }
  }

  const byDomain = new Map<string, AccuracyStat>();
  for (const [k, v] of byDomainAgg) byDomain.set(k, acc(v.c, v.t));

  const bySkill = new Map<string, SkillPerformance>();
  for (const [k, v] of bySkillAgg) {
    // history is newest-first, but we pushed in iteration order; sort by `at`
    // descending so the streak/recency reflect true chronology.
    const chrono = [...v.order].sort((x, y) => y.at - x.at);
    let streak = 0;
    for (const o of chrono) {
      if (!o.correct) streak += 1;
      else break;
    }
    bySkill.set(k, {
      skillId: k,
      attempts: v.t,
      correct: v.c,
      pct: v.t > 0 ? Math.round((v.c / v.t) * 100) : null,
      misses: v.misses,
      lastAt: v.lastAt || null,
      recentlyMissed: chrono.length > 0 ? !chrono[0].correct : false,
      currentMissStreak: streak,
    });
  }

  let repeated = 0;
  for (const [, m] of perQuestionMisses) if (m > 1) repeated += 1;
  const distinctAttempted = attemptedQuestions.size;

  return {
    overall: acc(overallCorrect, history.length),
    byDomain,
    bySkill,
    avgResponseMs: respCount > 0 ? Math.round(respSum / respCount) : null,
    repeatedErrorRate: distinctAttempted > 0 ? repeated / distinctAttempted : 0,
  };
}
