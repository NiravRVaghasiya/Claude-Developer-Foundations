import type { QuizQuestion } from "@/lib/content-types";

/** A user's selected option ids per question id. */
export type QuizAnswers = Record<string, string[]>;

/**
 * A question is correct only when the selected set EXACTLY equals the
 * correct set (order-independent). Under- or over-selecting is wrong —
 * this matches the exam's "select all that apply" grading.
 */
export function isQuestionCorrect(
  question: QuizQuestion,
  selected: string[]
): boolean {
  const correct = new Set(question.correctIds);
  const chosen = new Set(selected);
  if (correct.size !== chosen.size) return false;
  for (const id of correct) if (!chosen.has(id)) return false;
  return true;
}

/** Total correct across all questions given the answers map. */
export function scoreQuiz(
  questions: QuizQuestion[],
  answers: QuizAnswers
): { correct: number; total: number } {
  let correct = 0;
  for (const q of questions) {
    if (isQuestionCorrect(q, answers[q.id] ?? [])) correct += 1;
  }
  return { correct, total: questions.length };
}

/**
 * Toggle an option in a selection. For single-response questions the
 * selection is replaced; for multi-response it's added/removed.
 */
export function toggleSelection(
  current: string[],
  optionId: string,
  multi: boolean
): string[] {
  if (!multi) {
    return current.includes(optionId) ? [] : [optionId];
  }
  return current.includes(optionId)
    ? current.filter((id) => id !== optionId)
    : [...current, optionId];
}

export interface ScoreVerdict {
  label: string;
  tone: "good" | "ok" | "low";
}

/**
 * Maps a score to the notes' guidance, scaled to the question count so it
 * works for any quiz length (the source guide was written for 10 questions).
 */
export function scoreVerdict(correct: number, total: number): ScoreVerdict {
  if (total === 0) return { label: "No questions", tone: "low" };
  const pct = correct / total;
  if (pct >= 0.9)
    return { label: "Exam-ready on these topics", tone: "good" };
  if (pct >= 0.7)
    return { label: "Solid — review your misses", tone: "ok" };
  return {
    label: "Re-read the flagged topics and re-drill the traps",
    tone: "low",
  };
}
