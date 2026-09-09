import type { Metadata } from "next";
import { ExamRunner } from "@/components/ExamRunner";
import { getAllTopics } from "@/lib/content";
import type { QuizQuestion } from "@/lib/content-types";
import quiz from "@content/quiz.json";

export const metadata: Metadata = {
  title: "Exam Simulator — CCDV-F Study",
  description:
    "A timed, no-feedback CCDV-F practice exam simulation with navigation, flagging, autosave, and detailed post-exam analysis. A study aid, not a prediction of passing.",
};

export default function ExamPage() {
  const questions = quiz as QuizQuestion[];
  return <ExamRunner questions={questions} topics={getAllTopics()} />;
}
