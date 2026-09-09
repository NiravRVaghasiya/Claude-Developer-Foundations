import { describe, it, expect } from "vitest";
import {
  isSessionActive,
  answeredCount,
  flaggedCount,
  type ExamSession,
} from "@/lib/exam-session";
import type { ExamConfig } from "@/lib/exam";

const config: ExamConfig = {
  itemCount: 3,
  timeLimitMs: 60000,
  cutScorePct: 72,
  scaled: true,
  officialItems: 53,
  officialMinutes: 120,
};

function session(overrides: Partial<ExamSession> = {}): ExamSession {
  return {
    seed: 1,
    startedAt: 1000,
    deadline: 61000,
    itemIds: ["q1", "q2", "q3"],
    optionOrder: { q1: ["a", "b"], q2: ["a", "b"], q3: ["a", "b"] },
    answers: { q1: ["a"], q2: [] },
    flags: { q2: true },
    index: 0,
    config,
    ...overrides,
  };
}

describe("isSessionActive", () => {
  it("is true before the deadline", () => {
    expect(isSessionActive(session(), 30000)).toBe(true);
  });
  it("is false at/after the deadline", () => {
    expect(isSessionActive(session(), 61000)).toBe(false);
    expect(isSessionActive(session(), 99999)).toBe(false);
  });
  it("is false for a null session", () => {
    expect(isSessionActive(null, 0)).toBe(false);
  });
});

describe("answeredCount / flaggedCount", () => {
  it("counts non-empty answers", () => {
    expect(answeredCount(session())).toBe(1);
  });
  it("counts flags", () => {
    expect(flaggedCount(session())).toBe(1);
  });
});
