import { describe, it, expect } from "vitest";
import {
  isQuestionCorrect,
  scoreQuiz,
  toggleSelection,
  scoreVerdict,
} from "./quiz";
import type { QuizQuestion } from "@/lib/content-types";

const single: QuizQuestion = {
  id: "s",
  question: "q",
  options: [
    { id: "a", text: "a" },
    { id: "b", text: "b" },
  ],
  correctIds: ["b"],
  explanations: { a: "no", b: "yes" },
};

const multi: QuizQuestion = {
  id: "m",
  question: "q",
  options: [
    { id: "a", text: "a" },
    { id: "b", text: "b" },
    { id: "c", text: "c" },
  ],
  correctIds: ["a", "c"],
  explanations: { a: "yes", b: "no", c: "yes" },
};

describe("isQuestionCorrect", () => {
  it("single: exact match", () => {
    expect(isQuestionCorrect(single, ["b"])).toBe(true);
    expect(isQuestionCorrect(single, ["a"])).toBe(false);
    expect(isQuestionCorrect(single, [])).toBe(false);
  });

  it("multi: requires the exact set (order-independent)", () => {
    expect(isQuestionCorrect(multi, ["a", "c"])).toBe(true);
    expect(isQuestionCorrect(multi, ["c", "a"])).toBe(true);
    // under-selection is wrong
    expect(isQuestionCorrect(multi, ["a"])).toBe(false);
    // over-selection is wrong
    expect(isQuestionCorrect(multi, ["a", "b", "c"])).toBe(false);
  });
});

describe("scoreQuiz", () => {
  it("counts correct answers across questions", () => {
    const res = scoreQuiz([single, multi], { s: ["b"], m: ["a"] });
    expect(res).toEqual({ correct: 1, total: 2 });
  });
  it("treats missing answers as incorrect", () => {
    expect(scoreQuiz([single, multi], {})).toEqual({ correct: 0, total: 2 });
  });
});

describe("toggleSelection", () => {
  it("single: replaces the selection", () => {
    expect(toggleSelection(["a"], "b", false)).toEqual(["b"]);
    // clicking the same option clears it
    expect(toggleSelection(["a"], "a", false)).toEqual([]);
  });
  it("multi: adds and removes", () => {
    expect(toggleSelection(["a"], "c", true)).toEqual(["a", "c"]);
    expect(toggleSelection(["a", "c"], "a", true)).toEqual(["c"]);
  });
});

describe("scoreVerdict", () => {
  it("classifies by percentage", () => {
    expect(scoreVerdict(10, 10).tone).toBe("good");
    expect(scoreVerdict(9, 10).tone).toBe("good");
    expect(scoreVerdict(8, 10).tone).toBe("ok");
    expect(scoreVerdict(7, 10).tone).toBe("ok");
    expect(scoreVerdict(6, 10).tone).toBe("low");
  });
});
