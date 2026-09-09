import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FlashcardDeck } from "@/components/FlashcardDeck";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { BOX_INTERVALS_DAYS, type ScheduleMap } from "@/lib/srs";
import type { Flashcard, Topic } from "@/lib/content-types";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}));

const cards: Flashcard[] = [
  { id: "fc-a", topicId: "t1", question: "A front", answer: "A back" },
  { id: "fc-b", topicId: "t1", question: "B front", answer: "B back" },
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
  },
];

describe("integration: flashcard SRS scheduling round-trip", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("rating a card in SRS mode persists a real applyRating schedule", () => {
    render(<FlashcardDeck cards={cards} topics={topics} />);

    // Switch to spaced repetition.
    fireEvent.click(screen.getByRole("tab", { name: /spaced repetition/i }));

    // Rate the current card "Good" (advances one Leitner box via real srs.ts).
    fireEvent.click(screen.getByRole("button", { name: /^good$/i }));

    const raw = window.localStorage.getItem(STORAGE_KEYS.flashcardSchedule);
    expect(raw).not.toBeNull();
    const schedule = JSON.parse(raw as string) as ScheduleMap;

    // Exactly one card scheduled, box advanced to 1, reps incremented, due in the future.
    const entries = Object.values(schedule);
    expect(entries).toHaveLength(1);
    expect(entries[0].box).toBe(1);
    expect(entries[0].reps).toBe(1);
    expect(entries[0].due).toBeGreaterThan(Date.now());
    // Box-1 interval is 1 day per BOX_INTERVALS_DAYS — sanity-check the constant is used.
    expect(BOX_INTERVALS_DAYS[1]).toBe(1);
  });

  it("rating 'Again' keeps the card due now and marks it unknown", () => {
    render(<FlashcardDeck cards={cards} topics={topics} />);
    fireEvent.click(screen.getByRole("tab", { name: /spaced repetition/i }));
    fireEvent.click(screen.getByRole("button", { name: /^again$/i }));

    const schedule = JSON.parse(
      window.localStorage.getItem(STORAGE_KEYS.flashcardSchedule) as string
    ) as ScheduleMap;
    const entry = Object.values(schedule)[0];
    expect(entry.box).toBe(0);
    expect(entry.due).toBeLessThanOrEqual(Date.now() + 50);

    const marks = JSON.parse(
      window.localStorage.getItem(STORAGE_KEYS.flashcardMarks) as string
    );
    expect(Object.values(marks)).toContain("unknown");
  });
});
