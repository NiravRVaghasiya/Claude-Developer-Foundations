import { describe, it, expect } from "vitest";
import {
  appendAttempt,
  latestAttempt,
  HISTORY_CAP,
  type DiagnosticAttempt,
} from "@/lib/diagnostic-history";

function attempt(at: number): DiagnosticAttempt {
  return {
    at,
    correct: 5,
    total: 10,
    readinessIndex: 50,
    readinessBand: "developing",
    domains: [{ domainId: "d-a", pct: 50 }],
    weakestSkillIds: ["a1"],
    totalMs: 1000,
  };
}

describe("appendAttempt", () => {
  it("prepends newest-first", () => {
    const h1 = appendAttempt([], attempt(1));
    const h2 = appendAttempt(h1, attempt(2));
    expect(h2.map((a) => a.at)).toEqual([2, 1]);
  });

  it("caps the history length", () => {
    let history: DiagnosticAttempt[] = [];
    for (let i = 0; i < HISTORY_CAP + 5; i++) {
      history = appendAttempt(history, attempt(i));
    }
    expect(history.length).toBe(HISTORY_CAP);
    // Newest retained, oldest dropped.
    expect(history[0].at).toBe(HISTORY_CAP + 4);
    expect(history.every((a) => a.at > 4)).toBe(true);
  });

  it("does not mutate the input array", () => {
    const original: DiagnosticAttempt[] = [attempt(1)];
    appendAttempt(original, attempt(2));
    expect(original).toHaveLength(1);
  });

  it("respects a custom cap", () => {
    const history = appendAttempt(
      appendAttempt(appendAttempt([], attempt(1)), attempt(2)),
      attempt(3),
      2
    );
    expect(history.map((a) => a.at)).toEqual([3, 2]);
  });
});

describe("latestAttempt", () => {
  it("returns the newest attempt", () => {
    const history = appendAttempt(appendAttempt([], attempt(1)), attempt(2));
    expect(latestAttempt(history)?.at).toBe(2);
  });
  it("returns undefined for empty history", () => {
    expect(latestAttempt([])).toBeUndefined();
  });
});
