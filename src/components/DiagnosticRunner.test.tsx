import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DiagnosticRunner } from "./DiagnosticRunner";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { blueprint } from "@content/blueprint";
import type { QuizQuestion, Topic } from "@/lib/content-types";
import type { DiagnosticAttempt } from "@/lib/diagnostic-history";

// Use real blueprint skill ids so scoring maps cleanly.
const firstSkill = blueprint.domains[0].skills[0].id; // e.g. d1-...
const secondSkill = blueprint.domains[1].skills[0].id; // e.g. d2-...

const questions: QuizQuestion[] = [
  {
    id: "dq1",
    question: "Diag question one?",
    options: [
      { id: "a", text: "Right one" },
      { id: "b", text: "Wrong one" },
    ],
    correctIds: ["a"],
    explanations: { a: "", b: "" },
    skillIds: [firstSkill],
  },
  {
    id: "dq2",
    question: "Diag question two?",
    options: [
      { id: "a", text: "Alpha" },
      { id: "b", text: "Beta" },
    ],
    correctIds: ["b"],
    explanations: { a: "", b: "" },
    skillIds: [secondSkill],
  },
];

const topics: Topic[] = [
  {
    id: "topic-one",
    slug: "topic-one",
    title: "Topic One",
    summary: "",
    domain: "Applications & Integration",
    file: "topic-one.mdx",
    source: "CCDV-F Study Notes.md",
    order: 1,
    skillIds: [secondSkill],
  },
];

describe("DiagnosticRunner", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.scrollTo = () => {};
  });

  it("shows progress and disables submit until something is answered", () => {
    render(<DiagnosticRunner questions={questions} topics={topics} />);
    expect(screen.getByText(/answered 0 of 2/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /see my results/i })).toBeDisabled();
  });

  it("produces a readiness estimate with a not-a-pass-prediction disclaimer", () => {
    render(<DiagnosticRunner questions={questions} topics={topics} />);
    fireEvent.click(screen.getByText("Right one")); // dq1 correct
    fireEvent.click(screen.getByText("Alpha")); // dq2 wrong
    fireEvent.click(screen.getByRole("button", { name: /see my results/i }));

    expect(
      screen.getByRole("heading", { name: /study-readiness estimate/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/not a prediction of whether you will pass/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /by domain/i })).toBeInTheDocument();
  });

  it("recommends the topic that teaches a weak skill", () => {
    render(<DiagnosticRunner questions={questions} topics={topics} />);
    // Answer dq2 wrong so its skill (secondSkill, taught by Topic One) is weak.
    fireEvent.click(screen.getByText("Right one"));
    fireEvent.click(screen.getByText("Alpha"));
    fireEvent.click(screen.getByRole("button", { name: /see my results/i }));

    expect(
      screen.getByRole("heading", { name: /what to study next/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Topic One" })).toBeInTheDocument();
  });

  it("persists an attempt to diagnostic history", () => {
    render(<DiagnosticRunner questions={questions} topics={topics} />);
    fireEvent.click(screen.getByText("Right one"));
    fireEvent.click(screen.getByRole("button", { name: /see my results/i }));

    const raw = window.localStorage.getItem(STORAGE_KEYS.diagnosticHistory);
    expect(raw).not.toBeNull();
    const history = JSON.parse(raw as string) as DiagnosticAttempt[];
    expect(history.length).toBe(1);
    expect(history[0].total).toBe(1);
    expect(history[0].correct).toBe(1);
  });
});
