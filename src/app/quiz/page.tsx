import type { Metadata } from "next";
import { QuizRunner } from "@/components/QuizRunner";
import type { QuizQuestion } from "@/lib/content-types";
import quiz from "@content/quiz.json";

export const metadata: Metadata = {
  title: "Practice Quiz — CCDV-F Study",
  description:
    "Take a scored CCDV-F practice quiz with instant feedback and per-option explanations.",
};

export default function QuizPage() {
  const questions = quiz as QuizQuestion[];
  return <QuizRunner questions={questions} />;
}
