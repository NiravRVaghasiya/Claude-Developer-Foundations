import type { Blueprint } from "@content/blueprint";
import type { QuizQuestion, Topic } from "@/lib/content-types";
import { allSkills } from "@/lib/blueprint";
import { isQuestionCorrect } from "@/lib/quiz";

/**
 * Pure diagnostic engine. Given answered questions + the blueprint, it computes
 * per-skill and per-domain scores, a timing summary, a blueprint-weighted
 * study-readiness index, ranked weaknesses, and topic recommendations.
 *
 * IMPORTANT: the readiness index is a study-readiness *estimate*, NOT a
 * prediction of passing the real exam (see `Readiness.disclaimer`).
 *
 * All functions are pure and deterministic. Timing is passed in as data so the
 * engine never reads the clock.
 */

export interface AnsweredQuestion {
  questionId: string;
  selected: string[];
  /** Elapsed time on this question in ms; optional (degrades gracefully). */
  elapsedMs?: number;
}

export interface SkillScore {
  skillId: string;
  title: string;
  domainId: string;
  correct: number;
  total: number;
  /** Percentage 0–100, or null when the skill was not assessed (total === 0). */
  pct: number | null;
}

export interface DomainScore {
  domainId: string;
  code: string;
  title: string;
  weight: number;
  correct: number;
  total: number;
  pct: number | null;
}

export interface TimingSummary {
  totalMs: number;
  answered: number;
  avgMs: number | null;
}

export type ReadinessBand =
  | "unavailable"
  | "low"
  | "developing"
  | "solid"
  | "strong";

export interface Readiness {
  /** 0–100 study-readiness index, or null when nothing was assessed. */
  index: number | null;
  band: ReadinessBand;
  label: string;
  /** Explicit statement that this is not a pass prediction. */
  disclaimer: string;
}

export interface Recommendation {
  skillId: string;
  title: string;
  domainId: string;
  pct: number | null;
  /** Topic slugs that teach this skill (may be empty). */
  topicSlugs: string[];
  note?: string;
}

export interface DiagnosticResult {
  correct: number;
  total: number;
  skills: SkillScore[];
  domains: DomainScore[];
  timing: TimingSummary;
  readiness: Readiness;
  weaknesses: SkillScore[];
  recommendations: Recommendation[];
}

const READINESS_DISCLAIMER =
  "This is a study-readiness estimate based on your answers so far — not a prediction of whether you will pass the real exam.";

function pctOf(correct: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.round((correct / total) * 100);
}

/**
 * Per-skill scores. A question contributes to EACH skill in its `skillIds`.
 * Questions without skillIds are ignored for skill scoring (they still count in
 * the overall total).
 */
export function scoreBySkill(
  questions: QuizQuestion[],
  answers: Map<string, string[]>,
  blueprint: Blueprint
): SkillScore[] {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const acc = new Map<string, { correct: number; total: number }>();

  for (const q of questions) {
    for (const skillId of q.skillIds ?? []) {
      if (!acc.has(skillId)) acc.set(skillId, { correct: 0, total: 0 });
    }
  }

  for (const [qid, selected] of answers) {
    const q = byId.get(qid);
    if (!q) continue;
    const correct = isQuestionCorrect(q, selected);
    for (const skillId of q.skillIds ?? []) {
      const a = acc.get(skillId) ?? { correct: 0, total: 0 };
      a.total += 1;
      if (correct) a.correct += 1;
      acc.set(skillId, a);
    }
  }

  return allSkills(blueprint).map((sk) => {
    const a = acc.get(sk.id) ?? { correct: 0, total: 0 };
    return {
      skillId: sk.id,
      title: sk.title,
      domainId: sk.domainId,
      correct: a.correct,
      total: a.total,
      pct: pctOf(a.correct, a.total),
    };
  });
}

/** Aggregate skill scores into per-domain scores. */
export function scoreByDomain(
  skillScores: SkillScore[],
  blueprint: Blueprint
): DomainScore[] {
  const bySkill = new Map(skillScores.map((s) => [s.skillId, s]));
  return blueprint.domains.map((d) => {
    let correct = 0;
    let total = 0;
    for (const sk of d.skills) {
      const s = bySkill.get(sk.id);
      if (s) {
        correct += s.correct;
        total += s.total;
      }
    }
    return {
      domainId: d.id,
      code: d.code,
      title: d.title,
      weight: d.weight,
      correct,
      total,
      pct: pctOf(correct, total),
    };
  });
}

/** Summarize timing across answered questions; missing timings are treated as 0. */
export function summarizeTiming(answers: AnsweredQuestion[]): TimingSummary {
  let totalMs = 0;
  for (const a of answers) totalMs += a.elapsedMs ?? 0;
  const answered = answers.length;
  return {
    totalMs,
    answered,
    avgMs: answered > 0 ? Math.round(totalMs / answered) : null,
  };
}

/**
 * Blueprint-weighted readiness over ASSESSED domains (renormalized), so a
 * partial diagnostic isn't dragged down by domains that weren't tested.
 * Band cut points are study heuristics, NOT the real exam cut score.
 */
export function computeReadiness(domainScores: DomainScore[]): Readiness {
  const assessed = domainScores.filter((d) => d.total > 0 && d.pct !== null);
  const weightSum = assessed.reduce((n, d) => n + d.weight, 0);

  if (assessed.length === 0 || weightSum === 0) {
    return {
      index: null,
      band: "unavailable",
      label: "Not enough answered to estimate readiness",
      disclaimer: READINESS_DISCLAIMER,
    };
  }

  const weighted = assessed.reduce((n, d) => n + d.weight * (d.pct as number), 0);
  const index = Math.round(weighted / weightSum);

  let band: ReadinessBand;
  let label: string;
  if (index < 50) {
    band = "low";
    label = "Keep building the fundamentals";
  } else if (index < 70) {
    band = "developing";
    label = "Developing — focus on your weak domains";
  } else if (index < 85) {
    band = "solid";
    label = "Solid — tighten up the gaps";
  } else {
    band = "strong";
    label = "Strong across assessed domains";
  }

  return { index, band, label, disclaimer: READINESS_DISCLAIMER };
}

/**
 * Rank assessed skills weakest-first. Deterministic tie-breaking: lower pct
 * first, then higher domain weight, then skillId ascending.
 */
export function rankWeaknesses(
  skillScores: SkillScore[],
  blueprint: Blueprint
): SkillScore[] {
  const weightByDomain = new Map(blueprint.domains.map((d) => [d.id, d.weight]));
  return skillScores
    .filter((s) => s.total > 0 && s.pct !== null)
    .sort((a, b) => {
      if (a.pct !== b.pct) return (a.pct as number) - (b.pct as number);
      const wa = weightByDomain.get(a.domainId) ?? 0;
      const wb = weightByDomain.get(b.domainId) ?? 0;
      if (wa !== wb) return wb - wa;
      return a.skillId < b.skillId ? -1 : a.skillId > b.skillId ? 1 : 0;
    });
}

/** Map weak skills to the topics that teach them, with a note when none exist. */
export function recommendTopics(
  weaknesses: SkillScore[],
  topics: Topic[]
): Recommendation[] {
  return weaknesses.map((w) => {
    const topicSlugs = topics
      .filter((t) => (t.skillIds ?? []).includes(w.skillId))
      .map((t) => t.slug);
    return {
      skillId: w.skillId,
      title: w.title,
      domainId: w.domainId,
      pct: w.pct,
      topicSlugs,
      note: topicSlugs.length === 0 ? "No study topic yet for this skill." : undefined,
    };
  });
}

export interface RunDiagnosticInput {
  questions: QuizQuestion[];
  answers: AnsweredQuestion[];
  blueprint: Blueprint;
  topics: Topic[];
  /** How many weaknesses to recommend (default 5). */
  recommendCount?: number;
}

/** Full diagnostic result from answered questions. Pure and deterministic. */
export function runDiagnostic(input: RunDiagnosticInput): DiagnosticResult {
  const { questions, answers, blueprint, topics, recommendCount = 5 } = input;

  const selectedMap = new Map(answers.map((a) => [a.questionId, a.selected]));
  const byId = new Map(questions.map((q) => [q.id, q]));

  // Overall correct/total across answered questions.
  let correct = 0;
  for (const [qid, selected] of selectedMap) {
    const q = byId.get(qid);
    if (q && isQuestionCorrect(q, selected)) correct += 1;
  }
  const total = selectedMap.size;

  const skills = scoreBySkill(questions, selectedMap, blueprint);
  const domains = scoreByDomain(skills, blueprint);
  const timing = summarizeTiming(answers);
  const readiness = computeReadiness(domains);
  const weaknesses = rankWeaknesses(skills, blueprint);
  const recommendations = recommendTopics(
    weaknesses.slice(0, recommendCount),
    topics
  );

  return {
    correct,
    total,
    skills,
    domains,
    timing,
    readiness,
    weaknesses,
    recommendations,
  };
}
