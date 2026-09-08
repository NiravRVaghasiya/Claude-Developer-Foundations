import type { Metadata } from "next";
import { FlashcardDeck } from "@/components/FlashcardDeck";
import { getAllTopics } from "@/lib/content";
import type { Flashcard } from "@/lib/content-types";
import flashcards from "@content/flashcards.json";

export const metadata: Metadata = {
  title: "Flashcards — CCDV-F Study",
  description:
    "Drill CCDV-F concepts with active-recall flashcards. Filter by topic and track what you know.",
};

export default function FlashcardsPage() {
  const cards = flashcards as Flashcard[];
  const topics = getAllTopics();
  return <FlashcardDeck cards={cards} topics={topics} />;
}
