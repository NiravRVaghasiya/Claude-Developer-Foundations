import { Dashboard } from "@/components/Dashboard";
import { getAllTopics } from "@/lib/content";
import type { Flashcard } from "@/lib/content-types";
import flashcards from "@content/flashcards.json";

export default function HomePage() {
  const topicsTotal = getAllTopics().length;
  const cardsTotal = (flashcards as Flashcard[]).length;
  return <Dashboard topicsTotal={topicsTotal} cardsTotal={cardsTotal} />;
}
