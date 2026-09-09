import type { Metadata } from "next";
import { DiagnosticRunner } from "@/components/DiagnosticRunner";
import { getAllTopics } from "@/lib/content";
import type { QuizQuestion } from "@/lib/content-types";
import quiz from "@content/quiz.json";

export const metadata: Metadata = {
  title: "Diagnostic — CCDV-F Study",
  description:
    "Take a diagnostic to see your CCDV-F strengths and gaps by domain and skill, a study-readiness estimate, and what to study next.",
};

export default function DiagnosticPage() {
  const questions = quiz as QuizQuestion[];
  return <DiagnosticRunner questions={questions} topics={getAllTopics()} />;
}
