import type { Blueprint } from "@content/blueprint";
import type { Difficulty, Flashcard } from "@/lib/content-types";
import type { CardSchedule, ScheduleMap } from "@/lib/srs";
import { MAX_BOX } from "@/lib/srs";
import { allSkills } from "@/lib/blueprint";
import type { SkillScore } from "@/lib/diagnostic";

/**
 * Explainable, deterministic per-skill mastery.
 *
 * Combines assessment accuracy, SRS strength (Leitner box progress), recency,
 * and difficulty into a 0–100 score with a qualitative level, a confidence
 * signal, and a human-readable reason per contributing factor.
 *
 * Pure: `now` is injected. SRS state is READ ONLY (scheduling is untouched).
 */

export type MasteryLevel =
  | "unknown"
  | "beginning"
  | "developing"
  | "proficient"
  | "mastered";

export type Confidence = "low" | "medium" | "high";

export interface MasteryFactor {
  key: "accuracy" | "srs" | "recency" | "difficulty";
  /** Normalized 0–1 contribution value. */
  value: number;
  /** Relative weight of this factor. */
  weight: number;
  /** Human-readable explanation. */
  reason: string;
}

export interface SkillMastery {
  skillId: string;
  title: string;
  domainId: string;
  /** 0–100, or null when there's no evidence. */
  score: number | null;
  level: MasteryLevel;
  confidence: Confidence;
  /** Count of distinct evidence items (questions answered + cards seen). */
  exposure: number;
  factors: MasteryFactor[];
  reasons: string[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Base weights per factor; only *active* (evidence-bearing) factors are used. */
const WEIGHTS = {
  accuracy: 0.45,
  srs: 0.3,
  recency: 0.1,
  difficulty: 0.15,
} as const;

const DIFFICULTY_WEIGHT: Record<Difficulty, number> = {
  intro: 0.6,
  core: 1.0,
  advanced: 1.4,
};

export interface SkillCardEvidence {
  card: Flashcard;
  schedule?: CardSchedule;
  /** Whether the learner marked this card "known". */
  known?: boolean;
}

export interface SkillMasteryInput {
  skillId: string;
  title: string;
  domainId: string;
  /** Assessment score for this skill (from the diagnostic engine), if any. */
  assessment?: SkillScore;
  /** Difficulty of the answered assessment items, for the difficulty factor. */
  answeredDifficulties?: Difficulty[];
  /** Cards mapped to this skill with SRS state. */
  cards: SkillCardEvidence[];
  now: number;
}

function bandFor(score: number): MasteryLevel {
  if (score < 40) return "beginning";
  if (score < 60) return "developing";
  if (score < 80) return "proficient";
  return "mastered";
}

function confidenceFor(exposure: number): Confidence {
  if (exposure < 2) return "low";
  if (exposure < 5) return "medium";
  return "high";
}

/** Most recent evidence timestamp, derived from card due dates (due - box interval). */
function mostRecentReview(cards: SkillCardEvidence[]): number | null {
  let latest: number | null = null;
  for (const c of cards) {
    if (!c.schedule || c.schedule.reps === 0) continue;
    // A card's last review is roughly its due date minus its current interval;
    // we only need a monotonic "seen-ness", so use `due` as a recency proxy:
    // a card reviewed recently has a due date further in the future.
    const seen = c.schedule.due;
    if (latest === null || seen > latest) latest = seen;
  }
  return latest;
}

/** Compute explainable mastery for a single skill. */
export function computeSkillMastery(input: SkillMasteryInput): SkillMastery {
  const { skillId, title, domainId, assessment, answeredDifficulties, cards, now } =
    input;

  const factors: MasteryFactor[] = [];
  const reasons: string[] = [];

  const answered = assessment?.total ?? 0;
  const seenCards = cards.filter((c) => c.schedule && c.schedule.reps > 0);
  const exposure = answered + seenCards.length;

  if (exposure === 0) {
    return {
      skillId,
      title,
      domainId,
      score: null,
      level: "unknown",
      confidence: "low",
      exposure: 0,
      factors: [],
      reasons: ["No practice yet — take the diagnostic or drill this skill's cards."],
    };
  }

  // Accuracy factor.
  if (assessment && assessment.total > 0) {
    const acc = assessment.correct / assessment.total;
    factors.push({
      key: "accuracy",
      value: acc,
      weight: WEIGHTS.accuracy,
      reason: `Answered ${assessment.correct}/${assessment.total} correctly on assessments.`,
    });
  }

  // SRS strength factor (mean box progress of seen cards).
  if (seenCards.length > 0) {
    const avgBoxFrac =
      seenCards.reduce((n, c) => n + (c.schedule as CardSchedule).box / MAX_BOX, 0) /
      seenCards.length;
    const avgBox = (
      seenCards.reduce((n, c) => n + (c.schedule as CardSchedule).box, 0) /
      seenCards.length
    ).toFixed(1);
    factors.push({
      key: "srs",
      value: avgBoxFrac,
      weight: WEIGHTS.srs,
      reason:
        avgBoxFrac >= 0.6
          ? `Flashcards are well retained (avg Leitner box ${avgBox}/${MAX_BOX}).`
          : `Flashcards are still in early Leitner boxes (avg ${avgBox}/${MAX_BOX}).`,
    });
  }

  // Recency factor (decay from most recent review; fresh = 1, floor 0.2).
  const recent = mostRecentReview(cards);
  if (recent !== null) {
    const daysSince = Math.max(0, (now - recent) / DAY_MS);
    // Cards due in the future (recently reviewed) => daysSince clamps to 0 => 1.0.
    const recencyVal = Math.max(0.2, 1 - daysSince / 30);
    factors.push({
      key: "recency",
      value: recencyVal,
      weight: WEIGHTS.recency,
      reason:
        recencyVal >= 0.8
          ? "Reviewed recently."
          : "Not reviewed in a while — retention may be fading.",
    });
  }

  // Difficulty factor: reward handling harder items; only when we know accuracy
  // and which difficulties were answered.
  if (assessment && assessment.total > 0 && answeredDifficulties && answeredDifficulties.length > 0) {
    const acc = assessment.correct / assessment.total;
    const avgDiffWeight =
      answeredDifficulties.reduce((n, d) => n + DIFFICULTY_WEIGHT[d], 0) /
      answeredDifficulties.length;
    // Scale accuracy by relative difficulty (core = 1.0 baseline), clamp 0–1.
    const diffVal = Math.max(0, Math.min(1, acc * avgDiffWeight));
    const hardest = answeredDifficulties.includes("advanced")
      ? "advanced"
      : answeredDifficulties.includes("core")
        ? "core"
        : "intro";
    factors.push({
      key: "difficulty",
      value: diffVal,
      weight: WEIGHTS.difficulty,
      reason:
        hardest === "advanced"
          ? "Handled advanced items — counts for more."
          : hardest === "intro"
            ? "Only introductory items seen so far."
            : "Handled core-level items.",
    });
  }

  // Weighted, renormalized over active factors.
  const activeWeight = factors.reduce((n, f) => n + f.weight, 0);
  const weighted = factors.reduce((n, f) => n + f.weight * f.value, 0);
  const score = activeWeight > 0 ? Math.round((weighted / activeWeight) * 100) : 0;
  const bounded = Math.max(0, Math.min(100, score));

  const confidence = confidenceFor(exposure);
  for (const f of factors) reasons.push(f.reason);
  if (confidence === "low") {
    reasons.push("Limited evidence so far — this estimate is low-confidence.");
  }

  return {
    skillId,
    title,
    domainId,
    score: bounded,
    level: bandFor(bounded),
    confidence,
    exposure,
    factors,
    reasons,
  };
}

export interface AllMasteryInput {
  blueprint: Blueprint;
  /** Per-skill assessment scores (e.g. from the latest diagnostic). */
  assessments: SkillScore[];
  flashcards: Flashcard[];
  schedule: ScheduleMap;
  known: Record<string, boolean>;
  /** Difficulty per answered question id (optional, for the difficulty factor). */
  questionDifficultyBySkill?: Map<string, Difficulty[]>;
  now: number;
}

/** Compute mastery for every blueprint skill. */
export function computeAllMastery(input: AllMasteryInput): SkillMastery[] {
  const { blueprint, assessments, flashcards, schedule, known, questionDifficultyBySkill, now } =
    input;
  const assessmentBySkill = new Map(assessments.map((a) => [a.skillId, a]));

  return allSkills(blueprint).map((sk) => {
    const cards: SkillCardEvidence[] = flashcards
      .filter((c) => (c.skillIds ?? []).includes(sk.id))
      .map((card) => ({
        card,
        schedule: schedule[card.id],
        known: known[card.id],
      }));

    return computeSkillMastery({
      skillId: sk.id,
      title: sk.title,
      domainId: sk.domainId,
      assessment: assessmentBySkill.get(sk.id),
      answeredDifficulties: questionDifficultyBySkill?.get(sk.id),
      cards,
      now,
    });
  });
}
