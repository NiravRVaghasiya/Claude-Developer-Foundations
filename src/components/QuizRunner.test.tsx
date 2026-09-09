import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { QuizRunner } from "./QuizRunner";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { QuizQuestion } from "@/lib/content-types";

const questions: QuizQuestion[] = [
  {
    id: "q1",
    question: "Single question?",
    options: [
      { id: "a", text: "Wrong one" },
      { id: "b", text: "Right one" },
    ],
    correctIds: ["b"],
    explanations: { a: "explain-a", b: "explain-b" },
  },
  {
    id: "q2",
    question: "Multi question?",
    options: [
      { id: "a", text: "First" },
      { id: "b", text: "Second" },
      { id: "c", text: "Third" },
    ],
    correctIds: ["a", "c"],
    explanations: { a: "e-a", b: "e-b", c: "e-c" },
  },
];

describe("QuizRunner", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.scrollTo = () => {};
  });

  it("labels multi-response questions as select all", () => {
    render(<QuizRunner questions={questions} />);
    const q2 = screen.getByText("Multi question?").closest("li") as HTMLElement;
    expect(
      within(q2).getByText(/select all that apply/i)
    ).toBeInTheDocument();
  });

  it("scores a fully correct attempt and shows explanations", () => {
    render(<QuizRunner questions={questions} />);
    fireEvent.click(screen.getByText("Right one"));
    fireEvent.click(screen.getByText("First"));
    fireEvent.click(screen.getByText("Third"));
    fireEvent.click(screen.getByRole("button", { name: /submit quiz/i }));

    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(screen.getByText(/exam-ready/i)).toBeInTheDocument();
    // per-option explanations now visible
    expect(screen.getByText(/explain-b/)).toBeInTheDocument();
  });

  it("marks an incorrect single-answer question wrong", () => {
    render(<QuizRunner questions={questions} />);
    fireEvent.click(screen.getByText("Wrong one"));
    fireEvent.click(screen.getByRole("button", { name: /submit quiz/i }));
    expect(screen.getByText("0 / 2")).toBeInTheDocument();
    expect(screen.getAllByText(/incorrect/i).length).toBeGreaterThan(0);
  });

  it("persists the best score to localStorage on submit", () => {
    render(<QuizRunner questions={questions} />);
    fireEvent.click(screen.getByText("Right one"));
    fireEvent.click(screen.getByRole("button", { name: /submit quiz/i }));

    expect(
      JSON.parse(
        window.localStorage.getItem(STORAGE_KEYS.quizBestScore) as string
      )
    ).toBe(1);
    expect(
      JSON.parse(
        window.localStorage.getItem(STORAGE_KEYS.quizBestTotal) as string
      )
    ).toBe(2);
  });

  it("moves focus to the score heading after submit", () => {
    render(<QuizRunner questions={questions} />);
    fireEvent.click(screen.getByText("Right one"));
    fireEvent.click(screen.getByRole("button", { name: /submit quiz/i }));
    const heading = screen.getByText("Your score");
    expect(document.activeElement).toBe(heading);
  });

  it("single-response only keeps one selection", () => {
    render(<QuizRunner questions={questions} />);
    const q1 = screen.getByText("Single question?").closest("li") as HTMLElement;
    fireEvent.click(within(q1).getByText("Wrong one"));
    fireEvent.click(within(q1).getByText("Right one"));
    // Only "Right one" should be pressed
    expect(
      within(q1).getByText("Right one").closest("button")
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(q1).getByText("Wrong one").closest("button")
    ).toHaveAttribute("aria-pressed", "false");
  });
});
