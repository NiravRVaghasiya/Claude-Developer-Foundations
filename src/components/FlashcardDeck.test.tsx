import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FlashcardDeck } from "./FlashcardDeck";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { Flashcard, Topic } from "@/lib/content-types";

const cards: Flashcard[] = [
  { id: "a", topicId: "t1", question: "Q-one", answer: "A-one" },
  { id: "b", topicId: "t1", question: "Q-two", answer: "A-two" },
];

const topics: Topic[] = [
  {
    id: "t1",
    slug: "t1",
    title: "Topic One",
    summary: "s",
    domain: "Applications & Integration",
    file: "01.mdx",
    source: "CCDV-F Study Notes.md",
    order: 1,
  },
];

describe("FlashcardDeck", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the question, then flips to the answer", () => {
    render(<FlashcardDeck cards={cards} topics={topics} />);
    expect(screen.getByText("Q-one")).toBeInTheDocument();
    expect(screen.queryByText("A-one")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /reveal answer/i }));
    expect(screen.getByText("A-one")).toBeInTheDocument();
  });

  it("marks a card known and persists it to localStorage", () => {
    render(<FlashcardDeck cards={cards} topics={topics} />);
    fireEvent.click(screen.getByRole("button", { name: /i know this/i }));

    const raw = window.localStorage.getItem(STORAGE_KEYS.flashcardMarks);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string)).toEqual({ a: "known" });
  });

  it("advances to the next card after marking", () => {
    render(<FlashcardDeck cards={cards} topics={topics} />);
    expect(screen.getByText("Q-one")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /still learning/i }));
    // second card now shown
    expect(screen.getByText("Q-two")).toBeInTheDocument();
  });

  it("switches to spaced-repetition mode and shows rating buttons", () => {
    render(<FlashcardDeck cards={cards} topics={topics} />);
    fireEvent.click(screen.getByRole("tab", { name: /spaced repetition/i }));
    expect(screen.getByRole("button", { name: "Again" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Good" })).toBeInTheDocument();
    expect(screen.getByText(/2 due/i)).toBeInTheDocument();
  });

  it("persists a schedule entry when rating a card in SR mode", () => {
    render(<FlashcardDeck cards={cards} topics={topics} />);
    fireEvent.click(screen.getByRole("tab", { name: /spaced repetition/i }));
    fireEvent.click(screen.getByRole("button", { name: "Good" }));

    const raw = window.localStorage.getItem(STORAGE_KEYS.flashcardSchedule);
    expect(raw).not.toBeNull();
    const sched = JSON.parse(raw as string);
    // one card now has a schedule entry with box advanced to 1
    const entries = Object.values(sched) as Array<{ box: number }>;
    expect(entries.length).toBe(1);
    expect(entries[0].box).toBe(1);
  });
});
