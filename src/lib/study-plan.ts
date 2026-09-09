import type { Blueprint } from "@content/blueprint";
import type { Topic } from "@/lib/content-types";
import type { SkillMastery } from "@/lib/mastery";

/**
 * Explainable daily study plan. Ranks skills by a transparent priority that
 * combines the mastery gap, overdue flashcards, and exam weight, then assigns
 * concrete actions (read a topic / drill due cards) with a human-readable reason.
 *
 * Pure and deterministic. SRS state is only *read* (overdue counts are passed in).
 */

export type PlanAction =
  | { kind: "read"; topicSlug: string; topicTitle: string }
  | { kind: "drill"; dueCount: number }
  | { kind: "practice"; questionCount: number; skillId: string };

export interface PlanItem {
  skillId: string;
  title: string;
  domainId: string;
  priority: number;
  mastery: SkillMastery;
  actions: PlanAction[];
  reason: string;
}

export interface StudyPlan {
  items: PlanItem[];
  allCaughtUp: boolean;
}

export const PLAN_SIZE = 6;

const PRIORITY_WEIGHTS = { gap: 0.55, overdue: 0.3, examWeight: 0.15 } as const;
const OVERDUE_CAP = 5;
/**
 * Additive priority boost when a skill was recently missed / has an active miss
 * streak from real question attempts. Deterministic; keeps the plan explainable.
 */
const RECENT_MISS_BOOST = 0.2;
/** How many targeted practice questions to recommend for a remediated skill. */
const PRACTICE_QUESTIONS_PER_SKILL = 5;

export interface StudyPlanInput {
  blueprint: Blueprint;
  mastery: SkillMastery[];
  /** Overdue (due-now) flashcard count per skillId. */
  overdueBySkill: Map<string, number>;
  topics: Topic[];
  planSize?: number;
  /**
   * Error-driven remediation signal (optional): per-skill count of recent
   * MISSED attempts (e.g. current miss streak) from the question-attempts log.
   * Skills with recent misses are boosted and get a targeted-practice action.
   */
  recentMissesBySkill?: Map<string, number>;
  /**
   * Per-skill count of available practice questions, so a remediation item can
   * recommend "complete N targeted questions". When omitted, practice actions
   * are still emitted using a default count.
   */
  practiceQuestionsBySkill?: Map<string, number>;
}

/** masteryFraction: score/100, with unknown treated as 0 (study early). */
function masteryFraction(m: SkillMastery): number {
  return m.score === null ? 0 : m.score / 100;
}

/** Build the prioritized daily plan. */
export function buildStudyPlan(input: StudyPlanInput): StudyPlan {
  const {
    blueprint,
    mastery,
    overdueBySkill,
    topics,
    planSize = PLAN_SIZE,
    recentMissesBySkill,
    practiceQuestionsBySkill,
  } = input;

  const weightByDomain = new Map(blueprint.domains.map((d) => [d.id, d.weight]));
  const maxWeight = Math.max(...blueprint.domains.map((d) => d.weight), 1);
  const topicsBySkill = new Map<string, Topic[]>();
  for (const t of topics) {
    for (const sid of t.skillIds ?? []) {
      const list = topicsBySkill.get(sid) ?? [];
      list.push(t);
      topicsBySkill.set(sid, list);
    }
  }

  const candidates: PlanItem[] = [];

  for (const m of mastery) {
    const overdue = overdueBySkill.get(m.skillId) ?? 0;
    const recentMisses = recentMissesBySkill?.get(m.skillId) ?? 0;
    const gap = 1 - masteryFraction(m);
    const overdueSignal = Math.min(1, overdue / OVERDUE_CAP);
    const examWeight = weightByDomain.get(m.domainId) ?? 0;
    const examWeightNorm = examWeight / maxWeight;

    // Skip skills that are already strong and have nothing due — nothing to do.
    // BUT a recent miss on a strong skill is exactly what remediation exists for,
    // so recently-missed skills are never skipped.
    const isStrong = m.level === "mastered" || m.level === "proficient";
    if (isStrong && overdue === 0 && m.score !== null && recentMisses === 0) continue;

    // Error-driven boost: recently missed skills rise in priority (bounded).
    const missBoost = recentMisses > 0 ? RECENT_MISS_BOOST : 0;

    const priority =
      PRIORITY_WEIGHTS.gap * gap +
      PRIORITY_WEIGHTS.overdue * overdueSignal +
      PRIORITY_WEIGHTS.examWeight * examWeightNorm +
      missBoost;

    const skillTopics = topicsBySkill.get(m.skillId) ?? [];
    const actions: PlanAction[] = [];
    if (overdue > 0) {
      actions.push({ kind: "drill", dueCount: overdue });
    }
    if ((m.level === "unknown" || m.level === "beginning" || m.level === "developing") &&
        skillTopics.length > 0) {
      actions.push({
        kind: "read",
        topicSlug: skillTopics[0].slug,
        topicTitle: skillTopics[0].title,
      });
    }
    // Targeted practice for recently-missed skills (error-driven remediation).
    if (recentMisses > 0) {
      const available = practiceQuestionsBySkill?.get(m.skillId);
      const count = Math.min(
        PRACTICE_QUESTIONS_PER_SKILL,
        available ?? PRACTICE_QUESTIONS_PER_SKILL
      );
      if (count > 0) {
        // Recommend reading the topic first if we haven't already queued it.
        if (
          skillTopics.length > 0 &&
          !actions.some((a) => a.kind === "read")
        ) {
          actions.push({
            kind: "read",
            topicSlug: skillTopics[0].slug,
            topicTitle: skillTopics[0].title,
          });
        }
        actions.push({ kind: "practice", questionCount: count, skillId: m.skillId });
      }
    }

    // If there is genuinely nothing to act on (no cards due, no topic, and not weak
    // enough to warrant reading), skip.
    if (actions.length === 0) {
      if (skillTopics.length > 0 && m.level !== "mastered") {
        actions.push({
          kind: "read",
          topicSlug: skillTopics[0].slug,
          topicTitle: skillTopics[0].title,
        });
      } else {
        continue;
      }
    }

    const reason = buildReason(m, overdue, recentMisses);

    candidates.push({
      skillId: m.skillId,
      title: m.title,
      domainId: m.domainId,
      priority,
      mastery: m,
      actions,
      reason,
    });
  }

  candidates.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    const wa = weightByDomain.get(a.domainId) ?? 0;
    const wb = weightByDomain.get(b.domainId) ?? 0;
    if (wa !== wb) return wb - wa;
    const ma = masteryFraction(a.mastery);
    const mb = masteryFraction(b.mastery);
    if (ma !== mb) return ma - mb;
    return a.skillId < b.skillId ? -1 : a.skillId > b.skillId ? 1 : 0;
  });

  const items = candidates.slice(0, Math.max(0, planSize));
  return { items, allCaughtUp: items.length === 0 };
}

function buildReason(m: SkillMastery, overdue: number, recentMisses = 0): string {
  const parts: string[] = [];
  if (recentMisses > 0) {
    parts.push(
      `Missed ${recentMisses} recent question${recentMisses === 1 ? "" : "s"} here`
    );
  }
  if (m.level === "unknown") {
    parts.push("Not practiced yet");
  } else if (m.score !== null) {
    parts.push(`Mastery ${m.score}/100 (${m.level})`);
  }
  if (overdue > 0) {
    parts.push(`${overdue} flashcard${overdue === 1 ? "" : "s"} due for review`);
  }
  return parts.join(" · ");
}
