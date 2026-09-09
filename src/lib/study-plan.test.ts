import { describe, it, expect } from "vitest";
import type { Blueprint } from "@content/blueprint";
import type { Topic } from "@/lib/content-types";
import type { SkillMastery, MasteryLevel } from "@/lib/mastery";
import { buildStudyPlan, PLAN_SIZE } from "@/lib/study-plan";

function bp(): Blueprint {
  return {
    examCode: "CCDV-F",
    version: "1.0",
    effective: "2026-07",
    format: { items: 10, minutes: 30, scaleMin: 100, scaleMax: 1000, cutScore: 720 },
    source: { source: "t", url: "https://x", verifiedOn: "2026-09-09" },
    domains: [
      {
        id: "d-a",
        code: "DA",
        title: "A",
        weight: 80,
        skills: [
          { id: "a1", title: "A1", domainId: "d-a" },
          { id: "a2", title: "A2", domainId: "d-a" },
        ],
      },
      {
        id: "d-b",
        code: "DB",
        title: "B",
        weight: 20,
        skills: [{ id: "b1", title: "B1", domainId: "d-b" }],
      },
    ],
  };
}

function mastery(
  skillId: string,
  domainId: string,
  score: number | null,
  level: MasteryLevel
): SkillMastery {
  return {
    skillId,
    title: skillId.toUpperCase(),
    domainId,
    score,
    level,
    confidence: "medium",
    exposure: 3,
    factors: [],
    reasons: [],
  };
}

const topic = (slug: string, skillIds: string[]): Topic => ({
  id: slug,
  slug,
  title: `Topic ${slug}`,
  summary: "",
  domain: "Applications & Integration",
  file: `${slug}.mdx`,
  source: "CCDV-F Study Notes.md",
  order: 1,
  skillIds,
});

describe("buildStudyPlan — prioritization", () => {
  it("prioritizes lower mastery first", () => {
    const plan = buildStudyPlan({
      blueprint: bp(),
      mastery: [
        mastery("a1", "d-a", 70, "proficient"),
        mastery("a2", "d-a", 20, "beginning"),
      ],
      overdueBySkill: new Map(),
      topics: [topic("t-a1", ["a1"]), topic("t-a2", ["a2"])],
    });
    // a2 (weaker) should rank before a1.
    expect(plan.items[0].skillId).toBe("a2");
  });

  it("weights overdue cards into priority and adds a drill action", () => {
    const plan = buildStudyPlan({
      blueprint: bp(),
      mastery: [
        mastery("a1", "d-a", 65, "developing"),
        mastery("a2", "d-a", 65, "developing"),
      ],
      overdueBySkill: new Map([["a2", 4]]),
      topics: [topic("t-a1", ["a1"]), topic("t-a2", ["a2"])],
    });
    expect(plan.items[0].skillId).toBe("a2");
    expect(plan.items[0].actions.some((x) => x.kind === "drill")).toBe(true);
    expect(plan.items[0].reason).toMatch(/due for review/i);
  });

  it("breaks equal priority ties toward higher exam weight", () => {
    // Same mastery + no overdue; d-a weight 80 > d-b weight 20 => a-skill first.
    const plan = buildStudyPlan({
      blueprint: bp(),
      mastery: [
        mastery("b1", "d-b", 30, "beginning"),
        mastery("a1", "d-a", 30, "beginning"),
      ],
      overdueBySkill: new Map(),
      topics: [topic("t-a1", ["a1"]), topic("t-b1", ["b1"])],
    });
    expect(plan.items[0].skillId).toBe("a1");
  });
});

describe("buildStudyPlan — action selection", () => {
  it("recommends reading a topic for a weak skill", () => {
    const plan = buildStudyPlan({
      blueprint: bp(),
      mastery: [mastery("a1", "d-a", null, "unknown")],
      overdueBySkill: new Map(),
      topics: [topic("t-a1", ["a1"])],
    });
    const read = plan.items[0].actions.find((a) => a.kind === "read");
    expect(read).toBeDefined();
    if (read?.kind === "read") expect(read.topicSlug).toBe("t-a1");
    expect(plan.items[0].reason).toMatch(/not practiced yet/i);
  });

  it("still lists a skill with due cards even if no topic exists", () => {
    const plan = buildStudyPlan({
      blueprint: bp(),
      mastery: [mastery("a1", "d-a", 50, "developing")],
      overdueBySkill: new Map([["a1", 2]]),
      topics: [], // no topic
    });
    expect(plan.items[0].actions.some((a) => a.kind === "drill")).toBe(true);
  });
});

describe("buildStudyPlan — exclusions, cap, empty state", () => {
  it("excludes strong skills with nothing due", () => {
    const plan = buildStudyPlan({
      blueprint: bp(),
      mastery: [
        mastery("a1", "d-a", 95, "mastered"),
        mastery("b1", "d-b", 85, "mastered"),
      ],
      overdueBySkill: new Map(),
      topics: [topic("t-a1", ["a1"]), topic("t-b1", ["b1"])],
    });
    expect(plan.allCaughtUp).toBe(true);
    expect(plan.items).toHaveLength(0);
  });

  it("keeps a strong skill if it has overdue cards", () => {
    const plan = buildStudyPlan({
      blueprint: bp(),
      mastery: [mastery("a1", "d-a", 95, "mastered")],
      overdueBySkill: new Map([["a1", 3]]),
      topics: [topic("t-a1", ["a1"])],
    });
    expect(plan.items).toHaveLength(1);
    expect(plan.items[0].actions.some((a) => a.kind === "drill")).toBe(true);
  });

  it("caps the plan size", () => {
    const many: SkillMastery[] = [];
    for (let i = 0; i < PLAN_SIZE + 4; i++) {
      many.push(mastery(`s${i}`, "d-a", 10, "beginning"));
    }
    const topics = many.map((m) => topic(`t-${m.skillId}`, [m.skillId]));
    const plan = buildStudyPlan({
      blueprint: bp(),
      mastery: many,
      overdueBySkill: new Map(),
      topics,
    });
    expect(plan.items.length).toBe(PLAN_SIZE);
  });

  it("is deterministic for identical inputs", () => {
    const args = () => ({
      blueprint: bp(),
      mastery: [mastery("a1", "d-a", 30, "beginning"), mastery("a2", "d-a", 30, "beginning")],
      overdueBySkill: new Map<string, number>(),
      topics: [topic("t-a1", ["a1"]), topic("t-a2", ["a2"])],
    });
    expect(buildStudyPlan(args())).toEqual(buildStudyPlan(args()));
  });
});

describe("buildStudyPlan — error-driven remediation", () => {
  it("boosts and adds a targeted-practice action for a recently-missed skill", () => {
    const plan = buildStudyPlan({
      blueprint: bp(),
      mastery: [
        mastery("a1", "d-a", 55, "developing"),
        mastery("a2", "d-a", 55, "developing"),
      ],
      overdueBySkill: new Map(),
      topics: [topic("t-a1", ["a1"]), topic("t-a2", ["a2"])],
      recentMissesBySkill: new Map([["a2", 2]]),
      practiceQuestionsBySkill: new Map([["a2", 8]]),
    });
    // a2 was recently missed => it should rank first despite equal mastery.
    expect(plan.items[0].skillId).toBe("a2");
    const a2 = plan.items.find((i) => i.skillId === "a2")!;
    const practice = a2.actions.find((x) => x.kind === "practice");
    expect(practice).toBeDefined();
    // Capped at 5 targeted questions even though 8 are available.
    expect(practice && practice.kind === "practice" && practice.questionCount).toBe(5);
    expect(a2.reason).toMatch(/Missed 2 recent questions/i);
  });

  it("never skips a recently-missed skill even when mastery is strong", () => {
    const plan = buildStudyPlan({
      blueprint: bp(),
      mastery: [mastery("a1", "d-a", 95, "mastered")],
      overdueBySkill: new Map(),
      topics: [topic("t-a1", ["a1"])],
      recentMissesBySkill: new Map([["a1", 1]]),
      practiceQuestionsBySkill: new Map([["a1", 3]]),
    });
    expect(plan.allCaughtUp).toBe(false);
    expect(plan.items[0].skillId).toBe("a1");
    const practice = plan.items[0].actions.find((x) => x.kind === "practice");
    expect(practice && practice.kind === "practice" && practice.questionCount).toBe(3);
  });

  it("is unchanged when no remediation signal is supplied (back-compat)", () => {
    const base = {
      blueprint: bp(),
      mastery: [mastery("a1", "d-a", 30, "beginning")],
      overdueBySkill: new Map<string, number>(),
      topics: [topic("t-a1", ["a1"])],
    };
    const withEmpty = buildStudyPlan({ ...base, recentMissesBySkill: new Map() });
    const without = buildStudyPlan(base);
    expect(withEmpty).toEqual(without);
    // No practice action without a miss signal.
    expect(without.items[0].actions.some((a) => a.kind === "practice")).toBe(false);
  });
});
