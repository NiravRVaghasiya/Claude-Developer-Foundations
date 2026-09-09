import type { Metadata } from "next";
import { StudyPlan } from "@/components/StudyPlan";
import { getAllTopics } from "@/lib/content";
import type { Flashcard, QuizQuestion } from "@/lib/content-types";
import flashcards from "@content/flashcards.json";
import quiz from "@content/quiz.json";

export const metadata: Metadata = {
  title: "Study Plan — CCDV-F Study",
  description:
    "A personalized, explainable study plan that prioritizes your weak and overdue CCDV-F skills based on your diagnostic results, flashcard review state, and recent question errors.",
};

export default function PlanPage() {
  return (
    <StudyPlan
      flashcards={flashcards as Flashcard[]}
      topics={getAllTopics()}
      questions={quiz as QuizQuestion[]}
    />
  );
}
