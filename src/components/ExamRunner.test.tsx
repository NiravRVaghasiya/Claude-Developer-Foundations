import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { ExamRunner } from "./ExamRunner";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { blueprint } from "@content/blueprint";
import type { QuizQuestion, Topic } from "@/lib/content-types";
import type { ExamSession } from "@/lib/exam-session";

const skillA = blueprint.domains[0].skills[0].id;

function q(id: string, correctIds = ["a"]): QuizQuestion {
  return {
    id,
    question: `Question ${id}?`,
    options: [
      { id: "a", text: `Right ${id}` },
      { id: "b", text: `Wrong ${id}` },
    ],
    correctIds,
    explanations: { a: `explain-a-${id}`, b: `explain-b-${id}` },
    skillIds: [skillA],
  };
}

const questions: QuizQuestion[] = [q("q1"), q("q2"), q("q3")];
const topics: Topic[] = [];

describe("ExamRunner", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the scaled-practice notice and starts an exam", () => {
    render(<ExamRunner questions={questions} topics={topics} />);
    expect(screen.getByText(/scaled practice exam/i)).toBeInTheDocument();
    expect(screen.getByText(/not a prediction of passing/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^start exam$/i }));
    expect(screen.getByText(/question 1 of 3/i)).toBeInTheDocument();
    expect(screen.getByRole("timer")).toBeInTheDocument();
  });

  it("does not reveal correctness while the exam is in progress", () => {
    render(<ExamRunner questions={questions} topics={topics} />);
    fireEvent.click(screen.getByRole("button", { name: /^start exam$/i }));
    // Select an option.
    const firstOption = screen.getAllByRole("button", { pressed: false })[0];
    fireEvent.click(firstOption);
    // No correctness words and no explanations should be shown mid-exam.
    expect(screen.queryByText(/^correct$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^incorrect$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/explain-a-/)).not.toBeInTheDocument();
  });

  it("flags a question and persists the session (autosave)", () => {
    render(<ExamRunner questions={questions} topics={topics} />);
    fireEvent.click(screen.getByRole("button", { name: /^start exam$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^flag$/i }));

    const raw = window.localStorage.getItem(STORAGE_KEYS.examSession);
    expect(raw).not.toBeNull();
    const session = JSON.parse(raw as string) as ExamSession;
    expect(Object.values(session.flags).some(Boolean)).toBe(true);
    expect(session.itemIds.length).toBe(3);
  });

  it("submits and shows analysis with review + correctness (only after submit)", () => {
    render(<ExamRunner questions={questions} topics={topics} />);
    fireEvent.click(screen.getByRole("button", { name: /^start exam$/i }));

    // Answer the current question (order is seeded/randomized), then submit.
    // The option buttons are the unpressed toggle buttons on the question.
    const optionButtons = screen
      .getAllByRole("button", { pressed: false })
      .filter((b) => /(Right|Wrong)\s/.test(b.textContent ?? ""));
    fireEvent.click(optionButtons[0]);
    fireEvent.click(screen.getByRole("button", { name: /submit exam now/i }));

    expect(screen.getByText(/practice exam result/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /review/i })).toBeInTheDocument();
    // Correctness now appears in review.
    expect(screen.getAllByText(/correct|incorrect/i).length).toBeGreaterThan(0);
    // Session cleared on submit.
    expect(window.localStorage.getItem(STORAGE_KEYS.examSession)).toBe("null");
  });

  it("surfaces actionable remediation and records question attempts on submit", () => {
    // A topic that teaches skillA so the weak-skill recommendation can link it.
    const withTopic: Topic[] = [
      {
        id: "topic-a",
        slug: "topic-a",
        title: "The A Topic",
        summary: "",
        domain: "Applications & Integration",
        file: "topic-a.mdx",
        source: "CCDV-F Study Notes.md",
        order: 1,
        skillIds: [skillA],
      },
    ];
    render(<ExamRunner questions={questions} topics={withTopic} />);
    fireEvent.click(screen.getByRole("button", { name: /^start exam$/i }));

    // Answer the current question WRONG (pick the "Wrong" option), then submit.
    const wrong = screen
      .getAllByRole("button", { pressed: false })
      .find((b) => /Wrong\s/.test(b.textContent ?? ""))!;
    fireEvent.click(wrong);
    fireEvent.click(screen.getByRole("button", { name: /submit exam now/i }));

    // Remediation section is present and links the weak skill's topic + practice.
    const remediation = screen
      .getByRole("heading", { name: /what to focus on next/i })
      .closest("section") as HTMLElement;
    expect(remediation).toBeInTheDocument();
    expect(
      within(remediation).getByRole("link", { name: /The A Topic/i })
    ).toBeInTheDocument();
    expect(
      within(remediation).getByRole("link", { name: /practice questions/i })
    ).toBeInTheDocument();

    // Per-question attempts were recorded locally (no PII, just outcomes).
    const raw = window.localStorage.getItem(STORAGE_KEYS.questionAttempts);
    expect(raw).not.toBeNull();
    const attempts = JSON.parse(raw as string) as Array<{
      questionId: string;
      correct: boolean;
      source: string;
    }>;
    expect(attempts.length).toBeGreaterThanOrEqual(1);
    expect(attempts.every((a) => a.source === "exam")).toBe(true);
    expect(attempts.some((a) => a.correct === false)).toBe(true);
  });

  it("offers to resume an active saved session", () => {
    const now = Date.now();
    const session: ExamSession = {
      seed: 1,
      startedAt: now,
      deadline: now + 600000,
      itemIds: ["q1", "q2", "q3"],
      optionOrder: { q1: ["a", "b"], q2: ["a", "b"], q3: ["a", "b"] },
      answers: {},
      flags: {},
      index: 0,
      config: {
        itemCount: 3,
        timeLimitMs: 600000,
        cutScorePct: 72,
        scaled: true,
        officialItems: 53,
        officialMinutes: 120,
      },
    };
    window.localStorage.setItem(STORAGE_KEYS.examSession, JSON.stringify(session));

    render(<ExamRunner questions={questions} topics={topics} />);
    // Auto-resumes into the active exam.
    expect(screen.getByText(/question 1 of 3/i)).toBeInTheDocument();
  });
});
