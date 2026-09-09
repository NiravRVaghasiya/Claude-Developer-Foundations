"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { isMultiResponse, type QuizQuestion, type Topic } from "@/lib/content-types";
import { toggleSelection } from "@/lib/quiz";
import { blueprint } from "@content/blueprint";
import {
  runDiagnostic,
  type AnsweredQuestion,
  type DiagnosticResult,
  type ReadinessBand,
} from "@/lib/diagnostic";
import { appendAttempt, type DiagnosticAttempt } from "@/lib/diagnostic-history";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { scrollToTop } from "@/lib/a11y";

const BAND_TONE: Record<ReadinessBand, string> = {
  unavailable: "text-neutral-500",
  low: "text-red-700 dark:text-red-400",
  developing: "text-amber-700 dark:text-amber-400",
  solid: "text-blue-700 dark:text-blue-400",
  strong: "text-green-700 dark:text-green-400",
};

function Bar({ value }: { value: number }) {
  return (
    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
      <div
        className="h-full rounded-full bg-brand transition-all"
        style={{ width: `${value}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

export function DiagnosticRunner({
  questions,
  topics,
}: {
  questions: QuizQuestion[];
  topics: Topic[];
}) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [history, setHistory] = useLocalStorage<DiagnosticAttempt[]>(
    STORAGE_KEYS.diagnosticHistory,
    []
  );

  const topicTitleBySlug = useMemo(
    () => new Map(topics.map((t) => [t.slug, t.title])),
    [topics]
  );

  const answeredCount = useMemo(
    () => questions.filter((q) => (answers[q.id] ?? []).length > 0).length,
    [questions, answers]
  );

  const select = (q: QuizQuestion, optionId: string) => {
    if (result) return;
    setAnswers((prev) => ({
      ...prev,
      [q.id]: toggleSelection(prev[q.id] ?? [], optionId, isMultiResponse(q)),
    }));
  };

  const submit = () => {
    const answered: AnsweredQuestion[] = questions
      .filter((q) => (answers[q.id] ?? []).length > 0)
      .map((q) => ({ questionId: q.id, selected: answers[q.id] ?? [] }));

    const res = runDiagnostic({ questions, answers: answered, blueprint, topics });
    setResult(res);

    const attempt: DiagnosticAttempt = {
      at: Date.now(),
      correct: res.correct,
      total: res.total,
      readinessIndex: res.readiness.index,
      readinessBand: res.readiness.band,
      domains: res.domains.map((d) => ({ domainId: d.domainId, pct: d.pct })),
      skills: res.skills
        .filter((s) => s.total > 0)
        .map((s) => ({ skillId: s.skillId, correct: s.correct, total: s.total })),
      weakestSkillIds: res.weaknesses.slice(0, 3).map((w) => w.skillId),
      totalMs: res.timing.totalMs,
    };
    setHistory((prev) => appendAttempt(prev, attempt));

    scrollToTop();
  };

  const retake = () => {
    setAnswers({});
    setResult(null);
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Diagnostic Assessment</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Answer to see your strengths and gaps by exam domain and skill, a
          study-readiness estimate, and what to study next. Your attempts are saved
          on this device.
        </p>
      </header>

      {result ? (
        <DiagnosticResults
          result={result}
          topicTitleBySlug={topicTitleBySlug}
          onRetake={retake}
          history={history}
        />
      ) : (
        <>
          <p className="mb-6 text-sm text-neutral-500">
            Answered {answeredCount} of {questions.length}
          </p>
          <ol className="space-y-8">
            {questions.map((q, qi) => {
              const selected = answers[q.id] ?? [];
              const multi = isMultiResponse(q);
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
                      return (
                        <li key={opt.id}>
                          <button
                            type="button"
                            onClick={() => select(q, opt.id)}
                            aria-pressed={isSelected}
                            className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm transition ${
                              isSelected
                                ? "border-brand/60 bg-brand/10"
                                : "border-neutral-200 hover:border-brand/40 dark:border-neutral-800"
                            }`}
                          >
                            <span className="mt-0.5 font-semibold uppercase text-neutral-400">
                              {opt.id}
                            </span>
                            <span className="flex-1">{opt.text}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ol>
          <button
            type="button"
            onClick={submit}
            disabled={answeredCount === 0}
            className="mt-8 w-full rounded-lg bg-brand px-4 py-3 font-semibold text-white transition hover:bg-brand-fg disabled:opacity-50"
          >
            See my results
          </button>
        </>
      )}
    </div>
  );
}

function DiagnosticResults({
  result,
  topicTitleBySlug,
  onRetake,
  history,
}: {
  result: DiagnosticResult;
  topicTitleBySlug: Map<string, string>;
  onRetake: () => void;
  history: DiagnosticAttempt[];
}) {
  const { readiness, domains, weaknesses, recommendations, correct, total, timing } =
    result;
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="space-y-8">
      {/* Readiness */}
      <section
        className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900/50"
        aria-labelledby="readiness-heading"
      >
        <h2
          id="readiness-heading"
          ref={headingRef}
          tabIndex={-1}
          className="text-sm uppercase tracking-wide text-neutral-500 focus:outline-none"
        >
          Study-readiness estimate
        </h2>
        <p className={`mt-1 text-4xl font-bold ${BAND_TONE[readiness.band]}`}>
          {readiness.index === null ? "—" : `${readiness.index}/100`}
        </p>
        <p className={`font-medium ${BAND_TONE[readiness.band]}`}>{readiness.label}</p>
        <p className="mt-2 text-xs text-neutral-500">{readiness.disclaimer}</p>
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
          Score {correct} / {total}
          {timing.avgMs !== null
            ? ` · avg ${Math.round(timing.avgMs / 1000)}s per question`
            : ""}
        </p>
      </section>

      {/* Domain breakdown */}
      <section aria-labelledby="domains-heading">
        <h2 id="domains-heading" className="mb-3 text-lg font-semibold">
          By domain
        </h2>
        <ul className="space-y-3">
          {domains.map((d) => (
            <li key={d.domainId}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">
                  {d.title}{" "}
                  <span className="text-xs text-neutral-400">({d.weight}% of exam)</span>
                </span>
                <span className="text-neutral-500">
                  {d.pct === null ? "Not assessed" : `${d.pct}% (${d.correct}/${d.total})`}
                </span>
              </div>
              {d.pct !== null ? <Bar value={d.pct} /> : null}
            </li>
          ))}
        </ul>
      </section>

      {/* Recommendations */}
      <section aria-labelledby="recs-heading">
        <h2 id="recs-heading" className="mb-3 text-lg font-semibold">
          What to study next
        </h2>
        {weaknesses.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No weak skills assessed yet — answer more questions for a fuller picture.
          </p>
        ) : (
          <ul className="space-y-3">
            {recommendations.map((r) => (
              <li
                key={r.skillId}
                className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-medium">{r.title}</span>
                  <span className="text-sm text-neutral-500">
                    {r.pct === null ? "" : `${r.pct}%`}
                  </span>
                </div>
                {r.topicSlugs.length > 0 ? (
                  <p className="mt-1 text-sm">
                    Review:{" "}
                    {r.topicSlugs.map((slug, i) => (
                      <span key={slug}>
                        {i > 0 ? ", " : ""}
                        <Link
                          href={`/topics/${slug}`}
                          className="font-medium text-brand-fg underline underline-offset-2 dark:text-amber-400"
                        >
                          {topicTitleBySlug.get(slug) ?? slug}
                        </Link>
                      </span>
                    ))}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-neutral-500">{r.note}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* History */}
      {history.length > 1 ? (
        <section aria-labelledby="history-heading">
          <h2 id="history-heading" className="mb-3 text-lg font-semibold">
            Recent attempts
          </h2>
          <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
            {history.slice(0, 5).map((a) => (
              <li key={a.at} className="flex justify-between">
                <span>{new Date(a.at).toLocaleString()}</span>
                <span>
                  {a.correct}/{a.total}
                  {a.readinessIndex !== null ? ` · readiness ${a.readinessIndex}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <button
        type="button"
        onClick={onRetake}
        className="rounded-md border border-brand/40 bg-brand/10 px-4 py-2 text-sm font-medium text-brand-fg transition hover:bg-brand/20 dark:text-amber-300"
      >
        Retake diagnostic
      </button>
    </div>
  );
}
