"use client";

import { useMemo, useState } from "react";
import type { Flashcard, Topic } from "@/lib/content-types";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import {
  filterByTopic,
  deckStats,
  type FlashcardMarks,
  type MarkState,
} from "@/lib/flashcards";
import {
  applyRating,
  orderByDue,
  countDue,
  type Rating,
  type ScheduleMap,
} from "@/lib/srs";

type StudyMode = "browse" | "srs";

const RATING_BUTTONS: Array<{ rating: Rating; label: string; className: string }> = [
  {
    rating: "again",
    label: "Again",
    className:
      "border-red-400/60 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-300",
  },
  {
    rating: "hard",
    label: "Hard",
    className:
      "border-amber-400/60 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-300",
  },
  {
    rating: "good",
    label: "Good",
    className:
      "border-blue-400/60 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-500/40 dark:bg-blue-950/30 dark:text-blue-300",
  },
  {
    rating: "easy",
    label: "Easy",
    className:
      "border-green-400/60 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-500/40 dark:bg-green-950/30 dark:text-green-300",
  },
];

export function FlashcardDeck({
  cards,
  topics,
}: {
  cards: Flashcard[];
  topics: Topic[];
}) {
  const [marks, setMarks] = useLocalStorage<FlashcardMarks>(
    STORAGE_KEYS.flashcardMarks,
    {}
  );
  const [schedule, setSchedule] = useLocalStorage<ScheduleMap>(
    STORAGE_KEYS.flashcardSchedule,
    {}
  );
  const [mode, setMode] = useState<StudyMode>("browse");
  const [topicId, setTopicId] = useState<string>("all");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Only offer topics that actually have cards.
  const topicOptions = useMemo(() => {
    const withCards = new Set(cards.map((c) => c.topicId));
    return topics.filter((t) => withCards.has(t.id));
  }, [cards, topics]);

  const filtered = useMemo(
    () => filterByTopic(cards, topicId),
    [cards, topicId]
  );

  // In SRS mode, order the filtered cards due-first (computed once per
  // filter/mode change so ratings don't reshuffle the current position).
  const [orderKey, setOrderKey] = useState(0);
  const deck = useMemo(() => {
    if (mode !== "srs") return filtered;
    const ordered = orderByDue(
      filtered.map((c) => c.id),
      schedule
    );
    const byId = new Map(filtered.map((c) => [c.id, c]));
    return ordered.map((id) => byId.get(id)!).filter(Boolean);
    // orderKey forces a re-sort when the user explicitly restarts the session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, mode, orderKey]);

  const stats = useMemo(() => deckStats(filtered, marks), [filtered, marks]);
  const dueCount = useMemo(
    () =>
      countDue(
        filtered.map((c) => c.id),
        schedule
      ),
    [filtered, schedule]
  );

  const current = deck[index];

  const goTo = (next: number) => {
    if (deck.length === 0) return;
    const wrapped = (next + deck.length) % deck.length;
    setIndex(wrapped);
    setFlipped(false);
  };

  const changeTopic = (id: string) => {
    setTopicId(id);
    setIndex(0);
    setFlipped(false);
    setOrderKey((k) => k + 1);
  };

  const changeMode = (m: StudyMode) => {
    setMode(m);
    setIndex(0);
    setFlipped(false);
    setOrderKey((k) => k + 1);
  };

  const mark = (state: MarkState) => {
    if (!current) return;
    setMarks((prev) => ({ ...prev, [current.id]: state }));
    goTo(index + 1);
  };

  const rate = (rating: Rating) => {
    if (!current) return;
    setSchedule((prev) => ({
      ...prev,
      [current.id]: applyRating(prev[current.id], rating),
    }));
    // Keep marks roughly in sync so the dashboard reflects mastery.
    setMarks((prev) => ({
      ...prev,
      [current.id]: rating === "again" ? "unknown" : "known",
    }));
    goTo(index + 1);
  };

  const topicTitle = (id: string) =>
    topics.find((t) => t.id === id)?.title ?? id;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Flashcards</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Active recall: read the question, try to answer, then flip. In spaced
          repetition, rate each card so it resurfaces at the right time.
        </p>
      </header>

      {/* Mode toggle */}
      <div
        className="mb-4 inline-flex rounded-lg border border-neutral-200 p-1 dark:border-neutral-800"
        role="tablist"
        aria-label="Study mode"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "browse"}
          onClick={() => changeMode("browse")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            mode === "browse"
              ? "bg-brand/15 text-brand-fg dark:text-amber-300"
              : "text-neutral-600 dark:text-neutral-400"
          }`}
        >
          Browse
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "srs"}
          onClick={() => changeMode("srs")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            mode === "srs"
              ? "bg-brand/15 text-brand-fg dark:text-amber-300"
              : "text-neutral-600 dark:text-neutral-400"
          }`}
        >
          Spaced repetition
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium" htmlFor="topic-filter">
          Topic
        </label>
        <select
          id="topic-filter"
          value={topicId}
          onChange={(e) => changeTopic(e.target.value)}
          className="rounded-md border border-neutral-300 bg-transparent px-3 py-1.5 text-sm dark:border-neutral-700"
        >
          <option value="all">All topics ({cards.length})</option>
          {topicOptions.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title} ({cards.filter((c) => c.topicId === t.id).length})
            </option>
          ))}
        </select>

        <span className="ml-auto flex gap-3 text-sm text-neutral-500">
          {mode === "srs" ? (
            <span className="text-brand-fg dark:text-amber-400">
              ⏰ {dueCount} due
            </span>
          ) : (
            <>
              <span className="text-green-600 dark:text-green-400">
                ✓ {stats.known} known
              </span>
              <span className="text-amber-600 dark:text-amber-400">
                ↻ {stats.unknown} review
              </span>
              <span>◦ {stats.unseen} new</span>
            </>
          )}
        </span>
      </div>

      {deck.length === 0 || !current ? (
        <p className="rounded-lg border border-neutral-200 p-8 text-center text-neutral-500 dark:border-neutral-800">
          No flashcards for this topic yet.
        </p>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between text-sm text-neutral-500">
            <span>
              Card {index + 1} of {deck.length}
            </span>
            <span>{topicTitle(current.topicId)}</span>
          </div>

          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            aria-label={flipped ? "Show question" : "Reveal answer"}
            className="flex min-h-56 w-full flex-col items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm transition hover:border-brand/40 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              {flipped ? "Answer" : "Question"}
            </span>
            <span className="text-lg leading-relaxed">
              {flipped ? current.answer : current.question}
            </span>
            <span className="mt-2 text-xs text-neutral-400">
              {flipped ? "Tap to hide" : "Tap to reveal"}
            </span>
          </button>

          {mode === "srs" ? (
            <div className="mt-5 grid grid-cols-4 gap-2">
              {RATING_BUTTONS.map((b) => (
                <button
                  key={b.rating}
                  type="button"
                  onClick={() => rate(b.rating)}
                  className={`rounded-lg border px-2 py-3 text-sm font-medium transition ${b.className}`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => mark("unknown")}
                className="rounded-lg border border-amber-400/60 bg-amber-50 px-4 py-3 font-medium text-amber-700 transition hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-300"
              >
                Still learning
              </button>
              <button
                type="button"
                onClick={() => mark("known")}
                className="rounded-lg border border-green-400/60 bg-green-50 px-4 py-3 font-medium text-green-700 transition hover:bg-green-100 dark:border-green-500/40 dark:bg-green-950/30 dark:text-green-300"
              >
                I know this
              </button>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              ← Previous
            </button>
            <span className="text-xs text-neutral-400">
              {current.id in marks
                ? marks[current.id] === "known"
                  ? "Marked: known"
                  : "Marked: still learning"
                : "Not marked yet"}
            </span>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
