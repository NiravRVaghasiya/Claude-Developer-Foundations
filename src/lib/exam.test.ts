import { describe, it, expect } from "vitest";
import type { Blueprint } from "@content/blueprint";
import type { QuizQuestion } from "@/lib/content-types";
import {
  makeRng,
  seededShuffle,
  buildExamConfig,
  assembleExam,
  makeDeadline,
  remainingMs,
  isExpired,
  analyzeExam,
  planExamAllocation,
  DEFAULT_CUT_PCT,
} from "@/lib/exam";

function bp(): Blueprint {
  return {
    examCode: "CCDV-F",
    version: "1.0",
    effective: "2026-07",
    format: { items: 53, minutes: 120, scaleMin: 100, scaleMax: 1000, cutScore: 720 },
    source: { source: "t", url: "https://x", verifiedOn: "2026-09-09" },
    domains: [
      {
        id: "d-a",
        code: "DA",
        title: "A",
        weight: 75,
        skills: [{ id: "a1", title: "A1", domainId: "d-a" }],
      },
      {
        id: "d-b",
        code: "DB",
        title: "B",
        weight: 25,
        skills: [{ id: "b1", title: "B1", domainId: "d-b" }],
      },
    ],
  };
}

function q(id: string, skillIds: string[], correctIds = ["a"]): QuizQuestion {
  return {
    id,
    question: `Q ${id}`,
    options: [
      { id: "a", text: "a" },
      { id: "b", text: "b" },
      { id: "c", text: "c" },
    ],
    correctIds,
    explanations: { a: "ea", b: "eb", c: "ec" },
    skillIds,
  };
}

// Pool: 8 A-domain, 2 B-domain.
function pool(): QuizQuestion[] {
  const a = Array.from({ length: 8 }, (_, i) => q(`a${i}`, ["a1"]));
  const b = Array.from({ length: 2 }, (_, i) => q(`b${i}`, ["b1"]));
  return [...a, ...b];
}

describe("seeded RNG", () => {
  it("is deterministic for a seed and varies across seeds", () => {
    const r1 = makeRng("x");
    const r2 = makeRng("x");
    expect(r1()).toBe(r2());
    expect(makeRng("y")()).not.toBe(makeRng("z")());
  });
  it("seededShuffle is deterministic and a permutation", () => {
    const s1 = seededShuffle([1, 2, 3, 4, 5], makeRng("k"));
    const s2 = seededShuffle([1, 2, 3, 4, 5], makeRng("k"));
    expect(s1).toEqual(s2);
    expect([...s1].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("buildExamConfig", () => {
  it("caps item count to the pool and scales time proportionally", () => {
    const cfg = buildExamConfig(bp(), 10);
    expect(cfg.itemCount).toBe(10);
    expect(cfg.scaled).toBe(true);
    // per-item = 120min/53 items; 10 items => ~22.64 min
    const perItem = (120 * 60 * 1000) / 53;
    expect(cfg.timeLimitMs).toBe(Math.round(perItem * 10));
    expect(cfg.cutScorePct).toBe(DEFAULT_CUT_PCT);
  });
  it("is not scaled when the pool meets the official count", () => {
    const cfg = buildExamConfig(bp(), 100);
    expect(cfg.itemCount).toBe(53);
    expect(cfg.scaled).toBe(false);
  });
});

describe("assembleExam", () => {
  it("is deterministic for the same seed", () => {
    const e1 = assembleExam(pool(), bp(), "seed-1", 6);
    const e2 = assembleExam(pool(), bp(), "seed-1", 6);
    expect(e1.map((i) => i.question.id)).toEqual(e2.map((i) => i.question.id));
  });

  it("differs across seeds (very likely)", () => {
    const e1 = assembleExam(pool(), bp(), "seed-1", 6).map((i) => i.question.id);
    const e2 = assembleExam(pool(), bp(), "seed-2", 6).map((i) => i.question.id);
    expect(e1).not.toEqual(e2);
  });

  it("never duplicates and caps at pool size", () => {
    const items = assembleExam(pool(), bp(), "s", 50);
    const ids = items.map((i) => i.question.id);
    expect(ids.length).toBe(10); // pool size
    expect(new Set(ids).size).toBe(10);
  });

  it("is blueprint-weight-aware (A-domain dominates a small exam)", () => {
    // 4 items, A weight 75% vs B 25% => ~3 A, ~1 B.
    const items = assembleExam(pool(), bp(), "s", 4);
    const aCount = items.filter((i) => (i.question.skillIds ?? []).includes("a1")).length;
    expect(aCount).toBeGreaterThanOrEqual(2);
  });

  it("preserves correctness under option shuffle", () => {
    const items = assembleExam(pool(), bp(), "s", 6, { shuffleOptions: true });
    for (const it of items) {
      // display order is a permutation of the real option ids
      expect([...it.displayOptionIds].sort()).toEqual(
        it.question.options.map((o) => o.id).sort()
      );
    }
  });
});

describe("planExamAllocation (blueprint-weighted allocation + drift)", () => {
  it("allocates exactly the target across all domains, weight-proportional", () => {
    // Pool: 8 A (weight 75), 2 B (weight 25). Full 53-target is capped to 10.
    const plan = planExamAllocation(pool(), bp(), 53);
    expect(plan.totalAvailable).toBe(10);
    expect(plan.allocatedTotal).toBe(10); // capped to pool
    const a = plan.domains.find((d) => d.domainId === "d-a")!;
    const b = plan.domains.find((d) => d.domainId === "d-b")!;
    expect(a.allocated + b.allocated).toBe(10);
    // A dominates by weight.
    expect(a.allocated).toBeGreaterThan(b.allocated);
  });

  it("totals exactly the item count when the pool is large enough", () => {
    // 20 A + 20 B available, ask for 12 => weight 75/25 => 9 A, 3 B.
    const big = [
      ...Array.from({ length: 20 }, (_, i) => q(`a${i}`, ["a1"])),
      ...Array.from({ length: 20 }, (_, i) => q(`b${i}`, ["b1"])),
    ];
    const plan = planExamAllocation(big, bp(), 12);
    expect(plan.allocatedTotal).toBe(12);
    const a = plan.domains.find((d) => d.domainId === "d-a")!;
    const b = plan.domains.find((d) => d.domainId === "d-b")!;
    expect(a.allocated).toBe(9);
    expect(b.allocated).toBe(3);
    expect(plan.meetsBlueprint).toBe(true);
    expect(plan.notes).toEqual([]);
  });

  it("reports drift when a domain is under-supplied", () => {
    // No B questions at all; asking for 8 => B is under-supplied.
    const onlyA = Array.from({ length: 8 }, (_, i) => q(`a${i}`, ["a1"]));
    const plan = planExamAllocation(onlyA, bp(), 8);
    const b = plan.domains.find((d) => d.domainId === "d-b")!;
    expect(b.available).toBe(0);
    expect(b.allocated).toBe(0);
    expect(b.shortfall).toBeGreaterThan(0);
    expect(plan.meetsBlueprint).toBe(false);
    expect(plan.notes.some((n) => /under-supplied/.test(n))).toBe(true);
  });

  it("is deterministic and independent of any seed", () => {
    const p1 = planExamAllocation(pool(), bp(), 6);
    const p2 = planExamAllocation(pool(), bp(), 6);
    expect(p1).toEqual(p2);
  });
});

describe("timing", () => {
  it("computes deadline, remaining, and expiry", () => {
    const deadline = makeDeadline(1000, 5000);
    expect(deadline).toBe(6000);
    expect(remainingMs(deadline, 3000)).toBe(3000);
    expect(remainingMs(deadline, 9000)).toBe(0); // clamped
    expect(isExpired(deadline, 6000)).toBe(true);
    expect(isExpired(deadline, 5999)).toBe(false);
  });
});

describe("analyzeExam", () => {
  it("scores overall + practice pass/fail and builds review rows", () => {
    const items = assembleExam(pool(), bp(), "fixed", 4);
    // Answer everything correctly ("a").
    const answers: Record<string, string[]> = {};
    for (const it of items) answers[it.question.id] = ["a"];
    const flags = { [items[0].question.id]: true };

    const analysis = analyzeExam({
      items,
      answers,
      flags,
      blueprint: bp(),
      cutScorePct: 72,
    });

    expect(analysis.correct).toBe(4);
    expect(analysis.total).toBe(4);
    expect(analysis.pct).toBe(100);
    expect(analysis.passedPractice).toBe(true);
    expect(analysis.review.find((r) => r.questionId === items[0].question.id)?.flagged).toBe(true);
    expect(analysis.review.every((r) => r.correct)).toBe(true);
    // domain breakdown present
    expect(analysis.domains.length).toBe(2);
  });

  it("fails practice below the cut and marks wrong answers", () => {
    const items = assembleExam(pool(), bp(), "fixed", 4);
    const answers: Record<string, string[]> = {};
    for (const it of items) answers[it.question.id] = ["b"]; // all wrong
    const analysis = analyzeExam({
      items,
      answers,
      flags: {},
      blueprint: bp(),
      cutScorePct: 72,
    });
    expect(analysis.correct).toBe(0);
    expect(analysis.passedPractice).toBe(false);
    expect(analysis.review.every((r) => !r.correct)).toBe(true);
  });
});
