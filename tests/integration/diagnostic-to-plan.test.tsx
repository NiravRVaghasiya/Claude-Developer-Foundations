import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DiagnosticRunner } from "@/components/DiagnosticRunner";
import { StudyPlan } from "@/components/StudyPlan";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { blueprint } from "@content/blueprint";
import type { Flashcard, QuizQuestion, Topic } from "@/lib/content-types";
import type { DiagnosticAttempt } from "@/lib/diagnostic-history";

// Framework glue only — engines/content/storage are REAL.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}));

const skillA = blueprint.domains[0].skills[0].id;
const skillB = blueprint.domains[1].skills[0].id;

const questions: QuizQuestion[] = [
  {
    id: "iq1",
    question: "Integration Q1?",
    options: [
      { id: "a", text: "Correct one" },
      { id: "b", text: "Nope" },
    ],
    correctIds: ["a"],
    explanations: { a: "", b: "" },
    skillIds: [skillA],
  },
  {
    id: "iq2",
    question: "Integration Q2?",
    options: [
      { id: "a", text: "Alpha" },
      { id: "b", text: "Beta" },
    ],
    correctIds: ["b"],
    explanations: { a: "", b: "" },
    skillIds: [skillB],
  },
];

const topics: Topic[] = [
  {
    id: "topic-b",
    slug: "topic-b",
    title: "The B Topic",
    summary: "",
    domain: "Applications & Integration",
    file: "topic-b.mdx",
    source: "CCDV-F Study Notes.md",
    order: 1,
    skillIds: [skillB],
  },
];

const flashcards: Flashcard[] = [];

describe("integration: diagnostic → study plan", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.scrollTo = () => {};
    cleanup();
  });

  it("a completed diagnostic persists an attempt that drives the study plan", () => {
    // 1) Take the diagnostic: get skillA right, skillB wrong.
    const { unmount } = render(
      <DiagnosticRunner questions={questions} topics={topics} />
    );
    fireEvent.click(screen.getByText("Correct one")); // iq1 correct (skillA)
    fireEvent.click(screen.getByText("Alpha")); // iq2 wrong (skillB)
    fireEvent.click(screen.getByRole("button", { name: /see my results/i }));

    // Attempt persisted with a per-skill breakdown (REAL storage).
    const raw = window.localStorage.getItem(STORAGE_KEYS.diagnosticHistory);
    expect(raw).not.toBeNull();
    const history = JSON.parse(raw as string) as DiagnosticAttempt[];
    expect(history).toHaveLength(1);
    const skillEntry = history[0].skills?.find((s) => s.skillId === skillB);
    expect(skillEntry).toEqual({ skillId: skillB, correct: 0, total: 1 });

    unmount();

    // 2) The study plan (REAL mastery + plan engines) reflects the weak skill B,
    //    recommending its teaching topic.
    render(<StudyPlan flashcards={flashcards} topics={topics} questions={questions} />);
    expect(
      screen.getByRole("heading", { name: /today’s focus|today's focus/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Read: The B Topic/i })).toBeInTheDocument();
    // Error-driven remediation: the recently-missed skill B also gets a
    // targeted-practice action sourced from the persisted question attempts.
    expect(
      screen.getByRole("link", { name: /Practice \d+ targeted question/i })
    ).toBeInTheDocument();
  });
});
