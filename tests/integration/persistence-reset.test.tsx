import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Dashboard } from "@/components/Dashboard";
import { STORAGE_KEYS } from "@/lib/storage-keys";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}));

describe("integration: persistence round-trip + reset covers every key", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.confirm = () => true;
  });

  it("reset clears EVERY storage key, including diagnostic + exam session", () => {
    // Seed every known key with representative data.
    window.localStorage.setItem(
      STORAGE_KEYS.viewedTopics,
      JSON.stringify(["messages-api"])
    );
    window.localStorage.setItem(
      STORAGE_KEYS.flashcardMarks,
      JSON.stringify({ "fc-1": "known" })
    );
    window.localStorage.setItem(
      STORAGE_KEYS.flashcardSchedule,
      JSON.stringify({ "fc-1": { box: 2, due: Date.now(), reps: 3 } })
    );
    window.localStorage.setItem(STORAGE_KEYS.quizBestScore, JSON.stringify(8));
    window.localStorage.setItem(STORAGE_KEYS.quizBestTotal, JSON.stringify(10));
    window.localStorage.setItem(
      STORAGE_KEYS.diagnosticHistory,
      JSON.stringify([{ at: 1, correct: 1, total: 2 }])
    );
    window.localStorage.setItem(
      STORAGE_KEYS.examSession,
      JSON.stringify({ seed: 1, itemIds: ["q1"] })
    );

    render(<Dashboard topicsTotal={17} cardsTotal={32} />);
    fireEvent.click(screen.getByRole("button", { name: /reset all progress/i }));

    // Every declared key must be cleared by the reset loop.
    for (const key of Object.values(STORAGE_KEYS)) {
      expect(window.localStorage.getItem(key), `key not cleared: ${key}`).toBeNull();
    }
  });

  it("dashboard reflects a persisted diagnostic readiness on load", () => {
    window.localStorage.setItem(
      STORAGE_KEYS.diagnosticHistory,
      JSON.stringify([
        {
          at: Date.now(),
          correct: 7,
          total: 10,
          readinessIndex: 74,
          readinessBand: "solid",
          domains: [],
          weakestSkillIds: [],
          totalMs: 1000,
        },
      ])
    );

    render(<Dashboard topicsTotal={17} cardsTotal={32} />);
    expect(screen.getByText("74/100")).toBeInTheDocument();
  });
});
