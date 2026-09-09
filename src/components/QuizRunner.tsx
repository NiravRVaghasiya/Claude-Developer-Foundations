"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { isMultiResponse, type QuizQuestion } from "@/lib/content-types";
import {
  isQuestionCorrect,
  scoreQuiz,
  toggleSelection,
  scoreVerdict,
  type QuizAnswers,
} from "@/lib/quiz";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { scrollToTop } from "@/lib/a11y";

const TONE_CLASSES: Record<string, string> = {
  good: "text-green-700 dark:text-green-400",
  ok: "text-amber-700 dark:text-amber-400",
  low: "text-red-700 dark:text-red-400",
};

export function QuizRunner({ questions }: { questions: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [submitted, setSubmitted] = useState(false);
  const resultHeadingRef = useRef<HTMLParagraphElement>(null);
  const [bestScore, setBestScore] = useLocalStorage<number>(
    STORAGE_KEYS.quizBestScore,
    0
  );
  const [bestTotal, setBestTotal] = useLocalStorage<number>(
    STORAGE_KEYS.quizBestTotal,
    0
  );

  const result = useMemo(
    () => scoreQuiz(questions, answers),
    [questions, answers]
  );
  const answeredCount = useMemo(
    () => questions.filter((q) => (answers[q.id] ?? []).length > 0).length,
    [questions, answers]
  );

  const select = (q: QuizQuestion, optionId: string) => {
    if (submitted) return;
    setAnswers((prev) => ({
      ...prev,
      [q.id]: toggleSelection(prev[q.id] ?? [], optionId, isMultiResponse(q)),
    }));
  };

  const submit = () => {
    setSubmitted(true);
    // Keep the best attempt by percentage (falls back to raw when equal total).
    const prevPct = bestTotal > 0 ? bestScore / bestTotal : -1;
    const thisPct = result.total > 0 ? result.correct / result.total : 0;
    if (thisPct >= prevPct) {
      setBestScore(result.correct);
      setBestTotal(result.total);
    }
    scrollToTop();
  };

  // Move focus to the score heading when results appear (screen-reader users
  // are taken straight to the outcome).
  useEffect(() => {
    if (submitted) resultHeadingRef.current?.focus();
  }, [submitted]);

  const reset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  const verdict = scoreVerdict(result.correct, result.total);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Practice Quiz</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          {questions.length} scenario questions. Some are &ldquo;select all that
          apply.&rdquo; Answer, then submit for your score and per-option
          explanations.
        </p>
      </header>

      {submitted ? (
        <div className="mb-8 rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-center dark:border-neutral-800 dark:bg-neutral-900/50">
          <p
            ref={resultHeadingRef}
            tabIndex={-1}
            className="text-sm uppercase tracking-wide text-neutral-500 focus:outline-none"
          >
            Your score
          </p>
          <p className="my-1 text-4xl font-bold">
            {result.correct} / {result.total}
          </p>
          <p className={`font-medium ${TONE_CLASSES[verdict.tone]}`}>
            {verdict.label}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded-md border border-brand/40 bg-brand/10 px-4 py-2 text-sm font-medium text-brand-fg transition hover:bg-brand/20 dark:text-amber-300"
          >
            Retake quiz
          </button>
        </div>
      ) : (
        <p className="mb-6 text-sm text-neutral-500">
          Answered {answeredCount} of {questions.length}
        </p>
      )}

      <ol className="space-y-8">
        {questions.map((q, qi) => {
          const selected = answers[q.id] ?? [];
          const multi = isMultiResponse(q);
          const correct = submitted && isQuestionCorrect(q, selected);
          return (
            <li key={q.id}>
              <div className="mb-3 flex items-start gap-2">
                <span className="mt-0.5 text-sm font-semibold text-neutral-400">
                  {qi + 1}.
                </span>
                <div>
                  <p className="font-medium">{q.question}</p>
                  {multi ? (
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-brand-fg dark:text-amber-400">
                      Select all that apply
                    </p>
                  ) : null}
                </div>
              </div>

              <ul className="space-y-2">
                {q.options.map((opt) => {
                  const isSelected = selected.includes(opt.id);
                  const isCorrectOption = q.correctIds.includes(opt.id);

                  let optionClass =
                    "border-neutral-200 dark:border-neutral-800";
                  if (submitted) {
                    if (isCorrectOption)
                      optionClass =
                        "border-green-400/70 bg-green-50 dark:border-green-500/40 dark:bg-green-950/30";
                    else if (isSelected)
                      optionClass =
                        "border-red-400/70 bg-red-50 dark:border-red-500/40 dark:bg-red-950/30";
                  } else if (isSelected) {
                    optionClass = "border-brand/60 bg-brand/10";
                  }

                  return (
                    <li key={opt.id}>
                      <button
                        type="button"
                        disabled={submitted}
                        onClick={() => select(q, opt.id)}
                        aria-pressed={isSelected}
                        className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm transition ${optionClass} ${
                          submitted ? "cursor-default" : "hover:border-brand/40"
                        }`}
                      >
                        <span className="mt-0.5 font-semibold uppercase text-neutral-400">
                          {opt.id}
                        </span>
                        <span className="flex-1">{opt.text}</span>
                        {submitted && isCorrectOption ? (
                          <span aria-label="correct">✓</span>
                        ) : null}
                        {submitted && isSelected && !isCorrectOption ? (
                          <span aria-label="incorrect">✗</span>
                        ) : null}
                      </button>
                      {submitted ? (
                        <p className="ml-3 mt-1 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                          <span className="font-semibold">{opt.id}:</span>{" "}
                          {q.explanations[opt.id]}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>

              {submitted ? (
                <p
                  className={`mt-2 text-sm font-medium ${
                    correct
                      ? "text-green-700 dark:text-green-400"
                      : "text-red-700 dark:text-red-400"
                  }`}
                >
                  {correct ? "Correct" : "Incorrect"}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>

      {!submitted ? (
        <button
          type="button"
          onClick={submit}
          className="mt-8 w-full rounded-lg bg-brand px-4 py-3 font-semibold text-white transition hover:bg-brand-fg disabled:opacity-50"
        >
          Submit quiz
        </button>
      ) : null}
    </div>
  );
}
