import { describe, it, expect } from "vitest";
import {
  filterByTopic,
  deckStats,
  topicIdsInCards,
  type FlashcardMarks,
} from "./flashcards";
import type { Flashcard } from "@/lib/content-types";

const cards: Flashcard[] = [
  { id: "a", topicId: "t1", question: "q", answer: "x" },
  { id: "b", topicId: "t1", question: "q", answer: "x" },
  { id: "c", topicId: "t2", question: "q", answer: "x" },
];

describe("filterByTopic", () => {
  it("returns all cards for 'all'", () => {
    expect(filterByTopic(cards, "all")).toHaveLength(3);
  });
  it("filters to a single topic", () => {
    expect(filterByTopic(cards, "t1").map((c) => c.id)).toEqual(["a", "b"]);
    expect(filterByTopic(cards, "t2").map((c) => c.id)).toEqual(["c"]);
  });
});

describe("deckStats", () => {
  it("counts known / unknown / unseen", () => {
    const marks: FlashcardMarks = { a: "known", c: "unknown" };
    const s = deckStats(cards, marks);
    expect(s).toEqual({ total: 3, known: 1, unknown: 1, unseen: 1 });
  });
  it("treats an empty marks map as all unseen", () => {
    expect(deckStats(cards, {})).toEqual({
      total: 3,
      known: 0,
      unknown: 0,
      unseen: 3,
    });
  });
});

describe("topicIdsInCards", () => {
  it("returns distinct topic ids in order", () => {
    expect(topicIdsInCards(cards)).toEqual(["t1", "t2"]);
  });
});
