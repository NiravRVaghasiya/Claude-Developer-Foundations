"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  isMultiResponse,
  type QuizQuestion,
  type Topic,
} from "@/lib/content-types";
import { toggleSelection } from "@/lib/quiz";
import { blueprint } from "@content/blueprint";
import {
  assembleExam,
  buildExamConfig,
  makeDeadline,
  remainingMs,
  analyzeExam,
  type ExamItem,
  type ExamAnalysis,
} from "@/lib/exam";
import {
  answeredCount,
  flaggedCount,
  isSessionActive,
  type ExamSession,
} from "@/lib/exam-session";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { STORAGE_KEYS } from "@/lib/storage-keys";

type Phase = "idle" | "active" | "results";

/** Time thresholds (seconds) at which to announce remaining time politely. */
const WARN_THRESHOLDS = [300, 60, 30];

function fmtTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function ExamRunner({
  questions,
  topics,
}: {
  questions: QuizQuestion[];
  topics: Topic[];
}) {
  const [session, setSession, hydrated] = useLocalStorage<ExamSession | null>(
    STORAGE_KEYS.examSession,
    null
  );
  const [phase, setPhase] = useState<Phase>("idle");
  const [index, setIndex] = useState(0);
  const [analysis, setAnalysis] = useState<ExamAnalysis | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [timeAnnouncement, setTimeAnnouncement] = useState("");
  const lastWarnRef = useRef<number | null>(null);

  const config = useMemo(
    () => buildExamConfig(blueprint, questions.length),
    [questions.length]
  );

  // Rehydrate exam items from the saved session's ordered ids.
  const items: ExamItem[] = useMemo(() => {
    if (!session) return [];
    const byId = new Map(questions.map((q) => [q.id, q]));
    return session.itemIds
      .map((id) => byId.get(id))
      .filter((q): q is QuizQuestion => Boolean(q))
      .map((question) => ({
        question,
        displayOptionIds:
          session.optionOrder[question.id] ?? question.options.map((o) => o.id),
      }));
  }, [session, questions]);

  // If an active session exists on mount, resume it.
  useEffect(() => {
    if (!hydrated) return;
    if (session && isSessionActive(session, Date.now())) {
      setPhase("active");
      setIndex(session.index);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const submit = useCallback(() => {
    if (!session) return;
    const result = analyzeExam({
      items,
      answers: session.answers,
      flags: session.flags,
      blueprint,
      cutScorePct: session.config.cutScorePct,
    });
    setAnalysis(result);
    setPhase("results");
    setSession(null); // clear the in-progress session
  }, [session, items, setSession]);

  // Countdown tick + timeout auto-submit.
  const submitRef = useRef(submit);
  submitRef.current = submit;
  useEffect(() => {
    if (phase !== "active" || !session) return;
    const id = setInterval(() => {
      const now = Date.now();
      setNowTick(now);
      const leftMs = remainingMs(session.deadline, now);
      const leftSec = Math.ceil(leftMs / 1000);
      // Announce once when crossing a warning threshold (no per-second chatter).
      const crossed = WARN_THRESHOLDS.find(
        (t) => leftSec <= t && (lastWarnRef.current === null || lastWarnRef.current > t)
      );
      if (crossed !== undefined) {
        lastWarnRef.current = crossed;
        const mins = Math.floor(crossed / 60);
        setTimeAnnouncement(
          mins >= 1
            ? `${mins} minute${mins === 1 ? "" : "s"} remaining.`
            : `${crossed} seconds remaining.`
        );
      }
      if (leftMs === 0) {
        submitRef.current();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [phase, session]);

  const start = () => {
    const seed = Date.now() >>> 0;
    const assembled = assembleExam(questions, blueprint, seed, config.itemCount, {
      shuffleOptions: true,
    });
    const startedAt = Date.now();
    const newSession: ExamSession = {
      seed,
      startedAt,
      deadline: makeDeadline(startedAt, config.timeLimitMs),
      itemIds: assembled.map((it) => it.question.id),
      optionOrder: Object.fromEntries(
        assembled.map((it) => [it.question.id, it.displayOptionIds])
      ),
      answers: {},
      flags: {},
      index: 0,
      config,
    };
    setSession(newSession);
    setIndex(0);
    setAnalysis(null);
    setPhase("active");
    setNowTick(startedAt);
    lastWarnRef.current = null;
    setTimeAnnouncement("");
  };

  const patchSession = (patch: Partial<ExamSession>) => {
    setSession((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const selectOption = (q: QuizQuestion, optionId: string) => {
    if (!session) return;
    const next = toggleSelection(
      session.answers[q.id] ?? [],
      optionId,
      isMultiResponse(q)
    );
    patchSession({ answers: { ...session.answers, [q.id]: next } });
  };

  const toggleFlag = (qid: string) => {
    if (!session) return;
    patchSession({ flags: { ...session.flags, [qid]: !session.flags[qid] } });
  };

  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(items.length - 1, i));
    setIndex(clamped);
    patchSession({ index: clamped });
  };

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-neutral-500">Loading…</p>
      </div>
    );
  }

  // ---- Results ----
  if (phase === "results" && analysis) {
    return (
      <ExamResults
        analysis={analysis}
        topics={topics}
        onRestart={() => {
          setAnalysis(null);
          setPhase("idle");
        }}
      />
    );
  }

  // ---- Idle / config ----
  if (phase !== "active") {
    const resumable = session && isSessionActive(session, Date.now());
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Exam Simulator</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          A timed, no-feedback practice simulation. You won&rsquo;t see whether an
          answer is right until you finish.
        </p>

        {config.scaled ? (
          <div className="mt-4 rounded-lg border border-amber-300/60 bg-amber-50 p-4 text-sm dark:border-amber-500/30 dark:bg-amber-950/30">
            <strong>Scaled practice exam.</strong> The official exam is{" "}
            {config.officialItems} items in {config.officialMinutes} minutes. This
            simulation uses the {config.itemCount} available practice questions with
            time scaled proportionally ({fmtTime(config.timeLimitMs)}). It is a study
            aid, not a prediction of passing the real exam.
          </div>
        ) : null}

        <ul className="mt-4 space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
          <li>• {config.itemCount} questions · {fmtTime(config.timeLimitMs)} time limit</li>
          <li>• Practice pass mark: {config.cutScorePct}% correct (a study heuristic, not the official scaled cut)</li>
          <li>• Navigate freely, flag questions, autosaves as you go</li>
        </ul>

        <div className="mt-6 flex gap-3">
          {resumable ? (
            <button
              type="button"
              onClick={() => {
                setPhase("active");
                setIndex(session!.index);
              }}
              className="rounded-lg bg-brand px-4 py-3 font-semibold text-white transition hover:bg-brand-fg"
            >
              Resume exam ({fmtTime(remainingMs(session!.deadline, Date.now()))} left)
            </button>
          ) : null}
          <button
            type="button"
            onClick={start}
            className={`rounded-lg px-4 py-3 font-semibold transition ${
              resumable
                ? "border border-neutral-300 dark:border-neutral-700"
                : "bg-brand text-white hover:bg-brand-fg"
            }`}
          >
            {resumable ? "Start new exam" : "Start exam"}
          </button>
        </div>
      </div>
    );
  }

  // ---- Active exam ----
  const item = items[index];
  if (!session || !item) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-neutral-500">Preparing exam…</p>
      </div>
    );
  }
  const q = item.question;
  const selected = session.answers[q.id] ?? [];
  const multi = isMultiResponse(q);
  const remaining = remainingMs(session.deadline, nowTick);
  const optionById = new Map(q.options.map((o) => [o.id, o]));

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Timer + progress header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">
            Question {index + 1} of {items.length}
          </p>
          <p className="text-xs text-neutral-400">
            {answeredCount(session)} answered · {flaggedCount(session)} flagged
          </p>
        </div>
        <div
          className={`rounded-md px-3 py-1.5 font-mono text-lg font-semibold ${
            remaining < 60000 ? "text-red-600 dark:text-red-400" : ""
          }`}
          role="timer"
          aria-label="Time remaining"
        >
          {fmtTime(remaining)}
        </div>
      </div>

      {/* Polite, threshold-based time announcements (no per-second chatter). */}
      <p className="sr-only" role="status" aria-live="polite">
        {timeAnnouncement}
      </p>

      {/* Question */}
      <div className="mb-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <p className="font-medium">{q.question}</p>
          <button
            type="button"
            onClick={() => toggleFlag(q.id)}
            aria-pressed={session.flags[q.id] === true}
            className={`shrink-0 rounded-md border px-2 py-1 text-xs font-medium transition ${
              session.flags[q.id]
                ? "border-amber-400 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                : "border-neutral-300 text-neutral-500 dark:border-neutral-700"
            }`}
          >
            {session.flags[q.id] ? "🚩 Flagged" : "Flag"}
          </button>
        </div>
        {multi ? (
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-brand-fg dark:text-amber-400">
            Select all that apply
          </p>
        ) : null}

        <ul className="space-y-2">
          {item.displayOptionIds.map((oid) => {
            const opt = optionById.get(oid);
            if (!opt) return null;
            const isSelected = selected.includes(oid);
            return (
              <li key={oid}>
                <button
                  type="button"
                  onClick={() => selectOption(q, oid)}
                  aria-pressed={isSelected}
                  className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm transition ${
                    isSelected
                      ? "border-brand/60 bg-brand/10"
                      : "border-neutral-200 hover:border-brand/40 dark:border-neutral-800"
                  }`}
                >
                  <span className="mt-0.5 font-semibold uppercase text-neutral-400">
                    {oid}
                  </span>
                  <span className="flex-1">{opt.text}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium disabled:opacity-40 dark:border-neutral-700"
        >
          ← Previous
        </button>
        {index < items.length - 1 ? (
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-fg"
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            Submit exam
          </button>
        )}
      </div>

      {/* Jump grid */}
      <div className="mt-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Questions
        </p>
        <div className="flex flex-wrap gap-2">
          {items.map((it, i) => {
            const answered = (session.answers[it.question.id] ?? []).length > 0;
            const flagged = session.flags[it.question.id];
            return (
              <button
                key={it.question.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to question ${i + 1}${answered ? ", answered" : ""}${
                  flagged ? ", flagged" : ""
                }`}
                aria-current={i === index ? "true" : undefined}
                className={`h-8 w-8 rounded text-xs font-medium transition ${
                  i === index
                    ? "bg-brand text-white"
                    : answered
                      ? "bg-brand/20 text-brand-fg dark:text-amber-300"
                      : "border border-neutral-300 text-neutral-500 dark:border-neutral-700"
                } ${flagged ? "ring-2 ring-amber-400" : ""}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={submit}
          className="mt-6 w-full rounded-lg border border-green-600/50 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100 dark:bg-green-950/30 dark:text-green-400"
        >
          Submit exam now
        </button>
      </div>
    </div>
  );
}

function ExamResults({
  analysis,
  topics,
  onRestart,
}: {
  analysis: ExamAnalysis;
  topics: Topic[];
  onRestart: () => void;
}) {
  const topicBySlugForSkill = useMemo(() => topics, [topics]);
  void topicBySlugForSkill;
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <section
        className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900/50"
        aria-labelledby="exam-score-heading"
      >
        <h1
          id="exam-score-heading"
          ref={headingRef}
          tabIndex={-1}
          className="text-sm uppercase tracking-wide text-neutral-500 focus:outline-none"
        >
          Practice exam result
        </h1>
        <p
          className={`mt-1 text-4xl font-bold ${
            analysis.passedPractice
              ? "text-green-700 dark:text-green-400"
              : "text-amber-700 dark:text-amber-400"
          }`}
        >
          {analysis.correct} / {analysis.total} ({analysis.pct}%)
        </p>
        <p className="font-medium">
          {analysis.passedPractice
            ? `At or above the ${analysis.cutScorePct}% practice mark`
            : `Below the ${analysis.cutScorePct}% practice mark`}
        </p>
        <p className="mt-2 text-xs text-neutral-500">
          This is a practice result against a study heuristic, not the official
          scaled score and not a prediction of whether you will pass the real exam.
        </p>
      </section>

      <section className="mt-8" aria-labelledby="exam-domains-heading">
        <h2 id="exam-domains-heading" className="mb-3 text-lg font-semibold">
          By domain
        </h2>
        <ul className="space-y-2 text-sm">
          {analysis.domains.map((d) => (
            <li key={d.domainId} className="flex justify-between">
              <span>
                {d.title}{" "}
                <span className="text-xs text-neutral-400">({d.weight}%)</span>
              </span>
              <span className="text-neutral-500">
                {d.pct === null ? "Not assessed" : `${d.pct}% (${d.correct}/${d.total})`}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8" aria-labelledby="exam-review-heading">
        <h2 id="exam-review-heading" className="mb-3 text-lg font-semibold">
          Review
        </h2>
        <ol className="space-y-6">
          {analysis.review.map((r, i) => (
            <li key={r.questionId}>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-sm font-semibold text-neutral-400">
                  {i + 1}.
                </span>
                <div className="flex-1">
                  <p className="font-medium">
                    {r.question}{" "}
                    {r.flagged ? <span aria-label="was flagged">🚩</span> : null}
                  </p>
                  <p
                    className={`mt-1 text-sm font-medium ${
                      r.correct
                        ? "text-green-700 dark:text-green-400"
                        : "text-red-700 dark:text-red-400"
                    }`}
                  >
                    {r.correct ? "Correct" : "Incorrect"}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Your answer: {r.selected.length ? r.selected.join(", ") : "—"} ·
                    Correct: {r.correctIds.join(", ")}
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                    {Object.entries(r.explanations).map(([oid, text]) => (
                      <li key={oid}>
                        <span className="font-semibold">{oid}:</span> {text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="rounded-lg bg-brand px-4 py-3 font-semibold text-white transition hover:bg-brand-fg"
        >
          Back to exam start
        </button>
        <Link
          href="/plan"
          className="rounded-lg border border-neutral-300 px-4 py-3 font-semibold dark:border-neutral-700"
        >
          See study plan
        </Link>
      </div>
    </div>
  );
}
