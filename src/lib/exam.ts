import type { Blueprint } from "@content/blueprint";
import type { QuizQuestion, Topic } from "@/lib/content-types";
import { isQuestionCorrect } from "@/lib/quiz";
import {
  scoreBySkill,
  scoreByDomain,
  type DomainScore,
  type SkillScore,
} from "@/lib/diagnostic";

/**
 * Pure, deterministic exam-simulation engine: config from structured exam
 * parameters, seeded blueprint-weighted assembly, timing math, and post-exam
 * analysis (reusing the diagnostic scoring engine). No I/O; `now`/seed injected.
 *
 * The simulator runs a SCALED practice exam when the authored pool is smaller
 * than the official item count; callers must label results as practice-only and
 * never as a real-exam pass prediction.
 */

// ---- Seeded RNG (mulberry32) --------------------------------------------------

/** Hash an arbitrary string/number seed to a 32-bit int. */
export function hashSeed(seed: string | number): number {
  const s = String(seed);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic PRNG factory returning a function that yields [0,1). */
export function makeRng(seed: string | number): () => number {
  let a = hashSeed(seed);
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic Fisher–Yates shuffle (returns a new array). */
export function seededShuffle<T>(items: T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---- Config -------------------------------------------------------------------

export interface ExamConfig {
  itemCount: number;
  timeLimitMs: number;
  /** Practice pass threshold as a percentage of items correct (NOT the official scaled cut). */
  cutScorePct: number;
  /** True when the exam is shorter than the official item count. */
  scaled: boolean;
  officialItems: number;
  officialMinutes: number;
}

/** Default practice pass threshold (percent correct). Labeled practice-only in UI. */
export const DEFAULT_CUT_PCT = 72;

/**
 * Build exam config from blueprint format, capping item count to the pool and
 * scaling the time limit to preserve per-item time.
 */
export function buildExamConfig(
  blueprint: Blueprint,
  poolSize: number,
  cutScorePct: number = DEFAULT_CUT_PCT
): ExamConfig {
  const officialItems = blueprint.format.items;
  const officialMinutes = blueprint.format.minutes;
  const itemCount = Math.max(1, Math.min(officialItems, poolSize));
  const perItemMs = (officialMinutes * 60 * 1000) / officialItems;
  return {
    itemCount,
    timeLimitMs: Math.round(perItemMs * itemCount),
    cutScorePct,
    scaled: itemCount < officialItems,
    officialItems,
    officialMinutes,
  };
}

// ---- Assembly -----------------------------------------------------------------

export interface ExamItem {
  question: QuizQuestion;
  /** Display order of option ids (correctness is by id, so order is cosmetic). */
  displayOptionIds: string[];
}

/** Map a question to a single domain id via its first skill's domain. */
function domainOfQuestion(q: QuizQuestion, skillToDomain: Map<string, string>): string {
  for (const sid of q.skillIds ?? []) {
    const d = skillToDomain.get(sid);
    if (d) return d;
  }
  return "__unmapped__";
}

/** Largest-remainder allocation of `total` slots across weights. */
function allocateSlots(
  weights: Array<{ key: string; weight: number; cap: number }>,
  total: number
): Map<string, number> {
  const result = new Map<string, number>();
  const weightSum = weights.reduce((n, w) => n + w.weight, 0) || 1;
  const raw = weights.map((w) => ({
    key: w.key,
    ideal: (w.weight / weightSum) * total,
    cap: w.cap,
  }));
  // Floor first (clamped by cap).
  let assigned = 0;
  const withFloor = raw.map((r) => {
    const base = Math.min(r.cap, Math.floor(r.ideal));
    assigned += base;
    return { ...r, base, remainder: r.ideal - Math.floor(r.ideal) };
  });
  for (const r of withFloor) result.set(r.key, r.base);
  // Distribute remaining by largest remainder, respecting caps.
  let remaining = total - assigned;
  const order = [...withFloor].sort((a, b) => b.remainder - a.remainder);
  let guard = 0;
  while (remaining > 0 && guard < 10000) {
    let progressed = false;
    for (const r of order) {
      if (remaining <= 0) break;
      const cur = result.get(r.key) ?? 0;
      if (cur < r.cap) {
        result.set(r.key, cur + 1);
        remaining -= 1;
        progressed = true;
      }
    }
    if (!progressed) break; // all caps hit
    guard += 1;
  }
  return result;
}

/**
 * Assemble a seeded, blueprint-weighted exam. Deterministic for a given seed.
 * Never duplicates a question; caps at pool size.
 */
export function assembleExam(
  questions: QuizQuestion[],
  blueprint: Blueprint,
  seed: string | number,
  itemCount: number,
  opts: { shuffleOptions?: boolean } = {}
): ExamItem[] {
  const rng = makeRng(seed);
  const skillToDomain = new Map<string, string>();
  for (const d of blueprint.domains) for (const sk of d.skills) skillToDomain.set(sk.id, d.id);

  // Group pool by domain.
  const byDomain = new Map<string, QuizQuestion[]>();
  for (const q of questions) {
    const dom = domainOfQuestion(q, skillToDomain);
    const list = byDomain.get(dom) ?? [];
    list.push(q);
    byDomain.set(dom, list);
  }

  const target = Math.min(itemCount, questions.length);

  // Weighted slot allocation across domains that actually have questions.
  const weightByDomain = new Map(blueprint.domains.map((d) => [d.id, d.weight]));
  const weights = [...byDomain.entries()].map(([domId, list]) => ({
    key: domId,
    weight: weightByDomain.get(domId) ?? 1,
    cap: list.length,
  }));
  const slots = allocateSlots(weights, target);

  // Pick from each domain (seeded shuffle), then fill any shortfall from leftovers.
  const chosen: QuizQuestion[] = [];
  const usedIds = new Set<string>();
  for (const [domId, list] of byDomain) {
    const n = slots.get(domId) ?? 0;
    const shuffled = seededShuffle(list, rng);
    for (let i = 0; i < n && i < shuffled.length; i++) {
      chosen.push(shuffled[i]);
      usedIds.add(shuffled[i].id);
    }
  }
  if (chosen.length < target) {
    const leftovers = seededShuffle(
      questions.filter((q) => !usedIds.has(q.id)),
      rng
    );
    for (const q of leftovers) {
      if (chosen.length >= target) break;
      chosen.push(q);
      usedIds.add(q.id);
    }
  }

  // Final ordering of the exam (seeded).
  const ordered = seededShuffle(chosen, rng);

  return ordered.map((question) => {
    const ids = question.options.map((o) => o.id);
    const displayOptionIds = opts.shuffleOptions ? seededShuffle(ids, rng) : ids;
    return { question, displayOptionIds };
  });
}

// ---- Timing -------------------------------------------------------------------

export function makeDeadline(startedAt: number, timeLimitMs: number): number {
  return startedAt + timeLimitMs;
}

export function remainingMs(deadline: number, now: number): number {
  return Math.max(0, deadline - now);
}

export function isExpired(deadline: number, now: number): boolean {
  return remainingMs(deadline, now) === 0;
}

// ---- Analysis -----------------------------------------------------------------

export interface QuestionReview {
  questionId: string;
  question: string;
  correctIds: string[];
  selected: string[];
  correct: boolean;
  explanations: Record<string, string>;
  flagged: boolean;
}

export interface ExamAnalysis {
  correct: number;
  total: number;
  pct: number;
  passedPractice: boolean;
  cutScorePct: number;
  skills: SkillScore[];
  domains: DomainScore[];
  review: QuestionReview[];
}

export interface AnalyzeExamInput {
  items: ExamItem[];
  answers: Record<string, string[]>;
  flags: Record<string, boolean>;
  blueprint: Blueprint;
  cutScorePct: number;
}

/** Post-exam analysis. Correctness is computed here (never during the exam). */
export function analyzeExam(input: AnalyzeExamInput): ExamAnalysis {
  const { items, answers, flags, blueprint, cutScorePct } = input;
  const questions = items.map((it) => it.question);
  const answerMap = new Map<string, string[]>();
  for (const q of questions) answerMap.set(q.id, answers[q.id] ?? []);

  let correct = 0;
  const review: QuestionReview[] = items.map((it) => {
    const selected = answers[it.question.id] ?? [];
    const isCorrect = isQuestionCorrect(it.question, selected);
    if (isCorrect) correct += 1;
    return {
      questionId: it.question.id,
      question: it.question.question,
      correctIds: it.question.correctIds,
      selected,
      correct: isCorrect,
      explanations: it.question.explanations,
      flagged: flags[it.question.id] === true,
    };
  });

  const total = items.length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const skills = scoreBySkill(questions, answerMap, blueprint);
  const domains = scoreByDomain(skills, blueprint);

  return {
    correct,
    total,
    pct,
    passedPractice: pct >= cutScorePct,
    cutScorePct,
    skills,
    domains,
    review,
  };
}
