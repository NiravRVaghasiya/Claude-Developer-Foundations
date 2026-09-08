import type { Flashcard } from "@/lib/content-types";

export type MarkState = "known" | "unknown";
export type FlashcardMarks = Record<string, MarkState>;

/** Filter cards by topic id; "all" returns every card. */
export function filterByTopic(cards: Flashcard[], topicId: string): Flashcard[] {
  if (topicId === "all") return cards;
  return cards.filter((c) => c.topicId === topicId);
}

/** Count known / unknown / unseen for a set of cards given the marks map. */
export function deckStats(cards: Flashcard[], marks: FlashcardMarks) {
  let known = 0;
  let unknown = 0;
  for (const c of cards) {
    const m = marks[c.id];
    if (m === "known") known += 1;
    else if (m === "unknown") unknown += 1;
  }
  const unseen = cards.length - known - unknown;
  return { total: cards.length, known, unknown, unseen };
}

/** The distinct topic ids present in a set of cards, order-preserving. */
export function topicIdsInCards(cards: Flashcard[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of cards) {
    if (!seen.has(c.topicId)) {
      seen.add(c.topicId);
      out.push(c.topicId);
    }
  }
  return out;
}
