"use client";

import Link from "next/link";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { FlashcardMarks } from "@/lib/flashcards";
import { countKnown, percent, summarize } from "@/lib/progress";

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
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

export function Dashboard({
  topicsTotal,
  cardsTotal,
}: {
  topicsTotal: number;
  cardsTotal: number;
}) {
  const [viewed, , viewedHydrated] = useLocalStorage<string[]>(
    STORAGE_KEYS.viewedTopics,
    []
  );
  const [marks] = useLocalStorage<FlashcardMarks>(
    STORAGE_KEYS.flashcardMarks,
    {}
  );
  const [quizBest] = useLocalStorage<number>(STORAGE_KEYS.quizBestScore, 0);
  const [quizBestTotal] = useLocalStorage<number>(
    STORAGE_KEYS.quizBestTotal,
    0
  );

  const topicsViewed = viewed.length;
  const cardsKnown = countKnown(marks);

  const { readingPct, cardsPct, quizPct, overall } = summarize({
    topicsViewed,
    topicsTotal,
    cardsKnown,
    cardsTotal,
    quizBest,
    quizBestTotal,
  });

  const resetProgress = () => {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Reset all progress? This clears reading, flashcard, and quiz data.")
    ) {
      return;
    }
    for (const key of Object.values(STORAGE_KEYS)) {
      window.localStorage.removeItem(key);
    }
    // Notify all hook instances to re-read (they fall back to defaults).
    for (const key of Object.values(STORAGE_KEYS)) {
      window.dispatchEvent(new CustomEvent("local-storage", { detail: { key } }));
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-10 text-center">
        <span className="rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-sm font-medium text-brand-fg dark:text-amber-300">
          CCDV-F Exam Prep
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Claude Certified Developer: Foundations
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-neutral-600 dark:text-neutral-300">
          Read the topics, drill flashcards, and test yourself with a scored
          practice quiz. Your progress is saved on this device.
        </p>
      </header>

      {/* Overall progress */}
      <section className="mb-8 rounded-xl border border-neutral-200 p-6 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Overall progress</h2>
          <span className="text-2xl font-bold text-brand-fg dark:text-amber-400">
            {viewedHydrated ? `${overall}%` : "—"}
          </span>
        </div>
        <ProgressBar value={viewedHydrated ? overall : 0} />
      </section>

      {/* Three tracked dimensions */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
          <p className="text-sm text-neutral-500">Topics read</p>
          <p className="mt-1 text-2xl font-bold">
            {topicsViewed}
            <span className="text-base font-normal text-neutral-400">
              {" "}/ {topicsTotal}
            </span>
          </p>
          <ProgressBar value={readingPct} />
        </div>

        <div className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
          <p className="text-sm text-neutral-500">Flashcards known</p>
          <p className="mt-1 text-2xl font-bold">
            {cardsKnown}
            <span className="text-base font-normal text-neutral-400">
              {" "}/ {cardsTotal}
            </span>
          </p>
          <ProgressBar value={cardsPct} />
        </div>

        <div className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
          <p className="text-sm text-neutral-500">Best quiz score</p>
          <p className="mt-1 text-2xl font-bold">
            {quizBestTotal > 0 ? (
              <>
                {quizBest}
                <span className="text-base font-normal text-neutral-400">
                  {" "}/ {quizBestTotal}
                </span>
              </>
            ) : (
              <span className="text-base font-normal text-neutral-400">
                Not taken
              </span>
            )}
          </p>
          <ProgressBar value={quizPct} />
        </div>
      </section>

      {/* Quick actions */}
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { href: "/topics", label: "Browse topics", icon: "📚" },
          { href: "/flashcards", label: "Drill flashcards", icon: "🃏" },
          { href: "/quiz", label: "Take the quiz", icon: "📝" },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group flex items-center gap-3 rounded-xl border border-neutral-200 p-5 transition hover:border-brand/50 hover:shadow-sm dark:border-neutral-800"
          >
            <span className="text-2xl" aria-hidden>
              {a.icon}
            </span>
            <span className="font-medium group-hover:text-brand-fg dark:group-hover:text-amber-400">
              {a.label}
            </span>
          </Link>
        ))}
      </section>

      <div className="mt-10 text-center">
        <button
          type="button"
          onClick={resetProgress}
          className="text-sm text-neutral-500 underline underline-offset-2 transition hover:text-red-600 dark:hover:text-red-400"
        >
          Reset all progress
        </button>
      </div>
    </div>
  );
}

// Re-export for tests that want the raw percentage helper alongside the UI.
export { percent };
