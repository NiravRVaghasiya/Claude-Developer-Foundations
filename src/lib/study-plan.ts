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
  | { kind: "drill"; dueCount: number };

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

export interface StudyPlanInput {
  blueprint: Blueprint;
  mastery: SkillMastery[];
  /** Overdue (due-now) flashcard count per skillId. */
  overdueBySkill: Map<string, number>;
  topics: Topic[];
  planSize?: number;
}

/** masteryFraction: score/100, with unknown treated as 0 (study early). */
function masteryFraction(m: SkillMastery): number {
  return m.score === null ? 0 : m.score / 100;
}

/** Build the prioritized daily plan. */
export function buildStudyPlan(input: StudyPlanInput): StudyPlan {
  const { blueprint, mastery, overdueBySkill, topics, planSize = PLAN_SIZE } = input;

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
    const gap = 1 - masteryFraction(m);
    const overdueSignal = Math.min(1, overdue / OVERDUE_CAP);
    const examWeight = weightByDomain.get(m.domainId) ?? 0;
    const examWeightNorm = examWeight / maxWeight;

    // Skip skills that are already strong and have nothing due — nothing to do.
    const isStrong = m.level === "mastered" || m.level === "proficient";
    if (isStrong && overdue === 0 && m.score !== null) continue;
    // Skip skills with no data AND no content to act on is handled below.

    const priority =
      PRIORITY_WEIGHTS.gap * gap +
      PRIORITY_WEIGHTS.overdue * overdueSignal +
      PRIORITY_WEIGHTS.examWeight * examWeightNorm;

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

    const reason = buildReason(m, overdue);

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

function buildReason(m: SkillMastery, overdue: number): string {
  const parts: string[] = [];
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
