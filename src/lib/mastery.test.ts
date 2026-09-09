import { describe, it, expect } from "vitest";
import { computeSkillMastery, type SkillCardEvidence } from "@/lib/mastery";
import { MAX_BOX } from "@/lib/srs";
import type { Flashcard } from "@/lib/content-types";
import type { SkillScore } from "@/lib/diagnostic";

const NOW = 1_000_000_000_000;

function card(id: string): Flashcard {
  return { id, topicId: "t", question: "q", answer: "a", skillIds: ["s1"] };
}

function score(correct: number, total: number): SkillScore {
  return {
    skillId: "s1",
    title: "S1",
    domainId: "d1",
    correct,
    total,
    pct: total > 0 ? Math.round((correct / total) * 100) : null,
  };
}

function base(overrides: Partial<Parameters<typeof computeSkillMastery>[0]> = {}) {
  return computeSkillMastery({
    skillId: "s1",
    title: "S1",
    domainId: "d1",
    cards: [],
    now: NOW,
    ...overrides,
  });
}

describe("computeSkillMastery — no data", () => {
  it("returns unknown with null score and a reason", () => {
    const m = base();
    expect(m.level).toBe("unknown");
    expect(m.score).toBeNull();
    expect(m.confidence).toBe("low");
    expect(m.exposure).toBe(0);
    expect(m.reasons[0]).toMatch(/no practice/i);
  });
});

describe("computeSkillMastery — accuracy factor", () => {
  it("high accuracy yields a high score with an accuracy reason", () => {
    const m = base({ assessment: score(5, 5) });
    expect(m.score).toBe(100);
    expect(m.level).toBe("mastered");
    expect(m.factors.some((f) => f.key === "accuracy")).toBe(true);
    expect(m.reasons.some((r) => /5\/5/.test(r))).toBe(true);
  });

  it("low accuracy yields a low score", () => {
    const m = base({ assessment: score(1, 5) });
    expect(m.score).toBeLessThan(40);
    expect(m.level).toBe("beginning");
  });
});

describe("computeSkillMastery — SRS strength factor", () => {
  it("cards in high Leitner boxes raise mastery and are explained", () => {
    const cards: SkillCardEvidence[] = [
      { card: card("c1"), schedule: { box: MAX_BOX, due: NOW + 1000, reps: 3 } },
      { card: card("c2"), schedule: { box: MAX_BOX, due: NOW + 1000, reps: 3 } },
    ];
    const m = base({ cards });
    expect(m.score).toBeGreaterThanOrEqual(80);
    expect(m.factors.some((f) => f.key === "srs")).toBe(true);
    expect(m.reasons.some((r) => /well retained/i.test(r))).toBe(true);
  });

  it("cards in early boxes keep mastery low and say so", () => {
    const cards: SkillCardEvidence[] = [
      { card: card("c1"), schedule: { box: 0, due: NOW, reps: 1 } },
    ];
    const m = base({ cards });
    expect(m.score).toBeLessThan(40);
    expect(m.reasons.some((r) => /early leitner/i.test(r))).toBe(true);
  });
});

describe("computeSkillMastery — recency factor", () => {
  it("stale cards produce a fading-retention reason", () => {
    const cards: SkillCardEvidence[] = [
      { card: card("c1"), schedule: { box: 2, due: NOW - 40 * 24 * 3600 * 1000, reps: 2 } },
    ];
    const m = base({ cards });
    expect(m.reasons.some((r) => /fading|not reviewed/i.test(r))).toBe(true);
  });
});

describe("computeSkillMastery — difficulty factor", () => {
  it("advanced items are noted as counting for more", () => {
    const m = base({
      assessment: score(2, 2),
      answeredDifficulties: ["advanced", "advanced"],
    });
    expect(m.factors.some((f) => f.key === "difficulty")).toBe(true);
    expect(m.reasons.some((r) => /advanced/i.test(r))).toBe(true);
  });

  it("only-intro items are flagged", () => {
    const m = base({
      assessment: score(2, 2),
      answeredDifficulties: ["intro", "intro"],
    });
    expect(m.reasons.some((r) => /introductory/i.test(r))).toBe(true);
  });
});

describe("computeSkillMastery — confidence, bounds, determinism", () => {
  it("scales confidence with exposure", () => {
    expect(base({ assessment: score(1, 1) }).confidence).toBe("low");
    const cards3: SkillCardEvidence[] = [
      { card: card("c1"), schedule: { box: 1, due: NOW, reps: 1 } },
      { card: card("c2"), schedule: { box: 1, due: NOW, reps: 1 } },
      { card: card("c3"), schedule: { box: 1, due: NOW, reps: 1 } },
    ];
    expect(base({ assessment: score(2, 2), cards: cards3 }).confidence).toBe("high");
  });

  it("keeps score within 0–100 at extremes", () => {
    const hi = base({
      assessment: score(10, 10),
      answeredDifficulties: ["advanced"],
      cards: [{ card: card("c1"), schedule: { box: MAX_BOX, due: NOW + 1000, reps: 5 } }],
    });
    expect(hi.score).toBeGreaterThanOrEqual(0);
    expect(hi.score).toBeLessThanOrEqual(100);
    const lo = base({ assessment: score(0, 10) });
    expect(lo.score).toBe(0);
  });

  it("is deterministic for identical inputs", () => {
    const a = base({ assessment: score(3, 5) });
    const b = base({ assessment: score(3, 5) });
    expect(a).toEqual(b);
  });
});
