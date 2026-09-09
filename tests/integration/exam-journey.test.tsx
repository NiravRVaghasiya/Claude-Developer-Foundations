import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExamRunner } from "@/components/ExamRunner";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { blueprint } from "@content/blueprint";
import type { QuizQuestion, Topic } from "@/lib/content-types";
import type { ExamSession } from "@/lib/exam-session";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}));

const skillA = blueprint.domains[0].skills[0].id;

function q(id: string): QuizQuestion {
  return {
    id,
    question: `Exam ${id}?`,
    options: [
      { id: "a", text: `Right ${id}` },
      { id: "b", text: `Wrong ${id}` },
    ],
    correctIds: ["a"],
    explanations: { a: `why-a-${id}`, b: `why-b-${id}` },
    skillIds: [skillA],
  };
}
const questions: QuizQuestion[] = [q("q1"), q("q2"), q("q3")];
const topics: Topic[] = [];

describe("integration: exam autosave → resume → submit", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("autosaves an in-progress session, resumes it on re-render, then submits to analysis", () => {
    // Start the exam.
    const first = render(<ExamRunner questions={questions} topics={topics} />);
    fireEvent.click(screen.getByRole("button", { name: /^start exam$/i }));
    expect(screen.getByText(/question 1 of 3/i)).toBeInTheDocument();

    // Answer the current question and flag it (autosaves to REAL storage).
    const optionButtons = screen
      .getAllByRole("button", { pressed: false })
      .filter((b) => /(Right|Wrong)\s/.test(b.textContent ?? ""));
    fireEvent.click(optionButtons[0]);
    fireEvent.click(screen.getByRole("button", { name: /^flag$/i }));

    const saved = JSON.parse(
      window.localStorage.getItem(STORAGE_KEYS.examSession) as string
    ) as ExamSession;
    expect(saved.itemIds).toHaveLength(3);
    expect(Object.values(saved.answers).some((a) => a.length > 0)).toBe(true);
    expect(Object.values(saved.flags).some(Boolean)).toBe(true);

    // Simulate a page reload: unmount and re-render fresh.
    first.unmount();
    render(<ExamRunner questions={questions} topics={topics} />);
    // Resumes straight into the active exam (session still valid).
    expect(screen.getByText(/question 1 of 3/i)).toBeInTheDocument();

    // Submit and reach analysis; session is cleared.
    fireEvent.click(screen.getByRole("button", { name: /submit exam now/i }));
    expect(screen.getByText(/practice exam result/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /review/i })).toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEYS.examSession)).toBe("null");
  });
});
