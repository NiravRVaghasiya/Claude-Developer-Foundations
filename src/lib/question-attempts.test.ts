import { describe, it, expect } from "vitest";
import type { Blueprint } from "@content/blueprint";
import type { QuizQuestion } from "@/lib/content-types";
import {
  buildAttempts,
  appendAttempts,
  summarizePerformance,
  ATTEMPTS_CAP,
  type QuestionAttempt,
} from "@/lib/question-attempts";

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
        weight: 60,
        skills: [{ id: "a1", title: "A1", domainId: "d-a" }],
      },
      {
        id: "d-b",
        code: "DB",
        title: "B",
        weight: 40,
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
    ],
    correctIds,
    explanations: { a: "ea", b: "eb" },
    skillIds,
  };
}

describe("buildAttempts", () => {
  it("records only answered questions, grades correctness, and resolves domain/skill", () => {
    const questions = [q("q1", ["a1"]), q("q2", ["b1"]), q("q3", ["a1"])];
    const attempts = buildAttempts({
      questions,
      answers: { q1: ["a"], q2: ["b"] /* wrong: correct is "a" */, q3: [] /* skipped */ },
      responseMsById: { q1: 4000, q2: 8000 },
      blueprint: bp(),
      source: "exam",
      now: 1000,
    });
    expect(attempts).toHaveLength(2); // q3 skipped => not recorded
    const byId = new Map(attempts.map((a) => [a.questionId, a]));
    expect(byId.get("q1")?.correct).toBe(true);
    expect(byId.get("q1")?.domainId).toBe("d-a");
    expect(byId.get("q1")?.responseMs).toBe(4000);
    expect(byId.get("q2")?.correct).toBe(false);
    expect(byId.get("q2")?.domainId).toBe("d-b");
    expect(byId.get("q1")?.source).toBe("exam");
  });
});

describe("appendAttempts", () => {
  it("prepends newest-first and caps length", () => {
    const initial: QuestionAttempt[] = [];
    const first = appendAttempts(initial, [
      { questionId: "q1", at: 1, correct: true, skillIds: ["a1"], source: "quiz" },
      { questionId: "q2", at: 2, correct: false, skillIds: ["a1"], source: "quiz" },
    ]);
    // q2 was the latest in the batch => it lands at the front.
    expect(first[0].questionId).toBe("q2");
    expect(first).toHaveLength(2);

    const many: QuestionAttempt[] = Array.from({ length: ATTEMPTS_CAP + 10 }, (_, i) => ({
      questionId: `q${i}`,
      at: i,
      correct: true,
      skillIds: ["a1"],
      source: "quiz" as const,
    }));
    const capped = appendAttempts([], many);
    expect(capped).toHaveLength(ATTEMPTS_CAP);
  });
});

describe("summarizePerformance", () => {
  it("computes overall/domain/skill accuracy, miss streaks, repeated-error rate, avg time", () => {
    // newest-first log. skill a1: latest wrong then earlier right => streak 1.
    const history: QuestionAttempt[] = [
      { questionId: "q1", at: 30, correct: false, responseMs: 6000, domainId: "d-a", skillIds: ["a1"], source: "exam" },
      { questionId: "q1", at: 20, correct: true, responseMs: 4000, domainId: "d-a", skillIds: ["a1"], source: "quiz" },
      { questionId: "q2", at: 25, correct: false, responseMs: 2000, domainId: "d-b", skillIds: ["b1"], source: "quiz" },
      { questionId: "q2", at: 10, correct: false, responseMs: 2000, domainId: "d-b", skillIds: ["b1"], source: "quiz" },
    ];
    const perf = summarizePerformance(history);

    expect(perf.overall).toEqual({ correct: 1, total: 4, pct: 25 });
    expect(perf.byDomain.get("d-a")).toEqual({ correct: 1, total: 2, pct: 50 });
    expect(perf.byDomain.get("d-b")).toEqual({ correct: 0, total: 2, pct: 0 });

    const a1 = perf.bySkill.get("a1")!;
    expect(a1.recentlyMissed).toBe(true); // most recent (at 30) was wrong
    expect(a1.currentMissStreak).toBe(1); // then a correct at 20 breaks it
    expect(a1.pct).toBe(50);

    const b1 = perf.bySkill.get("b1")!;
    expect(b1.currentMissStreak).toBe(2); // both wrong

    // q2 missed twice => 1 repeated-error question out of 2 distinct attempted.
    expect(perf.repeatedErrorRate).toBe(0.5);
    expect(perf.avgResponseMs).toBe(Math.round((6000 + 4000 + 2000 + 2000) / 4));
  });

  it("handles an empty log without dividing by zero", () => {
    const perf = summarizePerformance([]);
    expect(perf.overall).toEqual({ correct: 0, total: 0, pct: null });
    expect(perf.avgResponseMs).toBeNull();
    expect(perf.repeatedErrorRate).toBe(0);
  });
});
