import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { StudyPlan } from "./StudyPlan";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { blueprint } from "@content/blueprint";
import { MAX_BOX } from "@/lib/srs";
import type { Flashcard, Topic } from "@/lib/content-types";
import type { DiagnosticAttempt } from "@/lib/diagnostic-history";

const skillA = blueprint.domains[0].skills[0].id;

const flashcards: Flashcard[] = [
  { id: "c1", topicId: "t1", question: "q", answer: "a", skillIds: [skillA] },
];
const topics: Topic[] = [
  {
    id: "t1",
    slug: "t1",
    title: "Topic One",
    summary: "",
    domain: "Applications & Integration",
    file: "t1.mdx",
    source: "CCDV-F Study Notes.md",
    order: 1,
    skillIds: [skillA],
  },
];

describe("StudyPlan", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("recommends reading the topic for a weak assessed skill", () => {
    const attempt: DiagnosticAttempt = {
      at: Date.now(),
      correct: 0,
      total: 2,
      readinessIndex: 0,
      readinessBand: "low",
      domains: [],
      skills: [{ skillId: skillA, correct: 0, total: 2 }], // weak
      weakestSkillIds: [skillA],
      totalMs: 1000,
    };
    window.localStorage.setItem(
      STORAGE_KEYS.diagnosticHistory,
      JSON.stringify([attempt])
    );

    render(<StudyPlan flashcards={flashcards} topics={topics} />);
    expect(screen.getByRole("heading", { name: /today’s focus|today's focus/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Read: Topic One/i })).toBeInTheDocument();
  });

  it("shows an all-caught-up message when the skill is mastered and nothing is due", () => {
    // Strong assessment + a card in the top Leitner box, due far in the future.
    const attempt: DiagnosticAttempt = {
      at: Date.now(),
      correct: 2,
      total: 2,
      readinessIndex: 100,
      readinessBand: "strong",
      domains: [],
      skills: [{ skillId: skillA, correct: 2, total: 2 }],
      weakestSkillIds: [],
      totalMs: 1000,
    };
    window.localStorage.setItem(
      STORAGE_KEYS.diagnosticHistory,
      JSON.stringify([attempt])
    );
    window.localStorage.setItem(
      STORAGE_KEYS.flashcardSchedule,
      JSON.stringify({
        c1: { box: MAX_BOX, due: Date.now() + 10 * 24 * 3600 * 1000, reps: 5 },
      })
    );

    render(<StudyPlan flashcards={flashcards} topics={topics} />);
    expect(screen.getByText(/caught up/i)).toBeInTheDocument();
  });

  it("renders per-skill mastery with explanations", () => {
    render(<StudyPlan flashcards={flashcards} topics={topics} />);
    expect(screen.getByRole("heading", { name: /skill mastery/i })).toBeInTheDocument();
    // With no data, the skill should read as unknown.
    expect(screen.getAllByText(/unknown/i).length).toBeGreaterThan(0);
  });
});
