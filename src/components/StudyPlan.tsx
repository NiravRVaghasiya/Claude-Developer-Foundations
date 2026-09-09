"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Flashcard, QuizQuestion } from "@/lib/content-types";
import type { Topic } from "@/lib/content-types";
import { blueprint } from "@content/blueprint";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { ScheduleMap } from "@/lib/srs";
import { countDue } from "@/lib/srs";
import type { FlashcardMarks } from "@/lib/flashcards";
import { computeAllMastery, type SkillMastery } from "@/lib/mastery";
import { buildStudyPlan } from "@/lib/study-plan";
import type { SkillScore } from "@/lib/diagnostic";
import type { DiagnosticAttempt } from "@/lib/diagnostic-history";
import { latestAttempt } from "@/lib/diagnostic-history";
import {
  summarizePerformance,
  type QuestionAttempt,
} from "@/lib/question-attempts";

const LEVEL_TONE: Record<string, string> = {
  unknown: "text-neutral-500",
  beginning: "text-red-700 dark:text-red-400",
  developing: "text-amber-700 dark:text-amber-400",
  proficient: "text-blue-700 dark:text-blue-400",
  mastered: "text-green-700 dark:text-green-400",
};

export function StudyPlan({
  flashcards,
  topics,
  questions,
}: {
  flashcards: Flashcard[];
  topics: Topic[];
  questions: QuizQuestion[];
}) {
  const [schedule, , schedHydrated] = useLocalStorage<ScheduleMap>(
    STORAGE_KEYS.flashcardSchedule,
    {}
  );
  const [marks] = useLocalStorage<FlashcardMarks>(STORAGE_KEYS.flashcardMarks, {});
  const [history] = useLocalStorage<DiagnosticAttempt[]>(
    STORAGE_KEYS.diagnosticHistory,
    []
  );
  const [attempts] = useLocalStorage<QuestionAttempt[]>(
    STORAGE_KEYS.questionAttempts,
    []
  );

  const { mastery, plan } = useMemo(() => {
    const now = Date.now();

    // Reconstruct per-skill assessment scores from the latest diagnostic.
    const latest = latestAttempt(history);
    const assessments: SkillScore[] = (latest?.skills ?? []).map((s) => ({
      skillId: s.skillId,
      title: s.skillId,
      domainId: "",
      correct: s.correct,
      total: s.total,
      pct: s.total > 0 ? Math.round((s.correct / s.total) * 100) : null,
    }));

    const known: Record<string, boolean> = {};
    for (const [id, m] of Object.entries(marks)) known[id] = m === "known";

    const mastery = computeAllMastery({
      blueprint,
      assessments,
      flashcards,
      schedule,
      known,
      now,
    });

    // Overdue card count per skill (reads SRS state; scheduling unchanged).
    const overdueBySkill = new Map<string, number>();
    for (const d of blueprint.domains) {
      for (const sk of d.skills) {
        const cardIds = flashcards
          .filter((c) => (c.skillIds ?? []).includes(sk.id))
          .map((c) => c.id);
        overdueBySkill.set(sk.id, countDue(cardIds, schedule, now));
      }
    }

    // Error-driven remediation signal from real question attempts:
    // per-skill current miss streak (recently missed) drives a priority boost
    // and a targeted-practice recommendation.
    const perf = summarizePerformance(attempts);
    const recentMissesBySkill = new Map<string, number>();
    for (const [skillId, sp] of perf.bySkill) {
      if (sp.currentMissStreak > 0) recentMissesBySkill.set(skillId, sp.currentMissStreak);
    }
    // How many practice questions exist per skill (for the "N targeted questions").
    const practiceQuestionsBySkill = new Map<string, number>();
    for (const q of questions) {
      for (const sid of q.skillIds ?? []) {
        practiceQuestionsBySkill.set(sid, (practiceQuestionsBySkill.get(sid) ?? 0) + 1);
      }
    }

    const plan = buildStudyPlan({
      blueprint,
      mastery,
      overdueBySkill,
      topics,
      recentMissesBySkill,
      practiceQuestionsBySkill,
    });

    return { mastery, plan };
  }, [history, marks, schedule, flashcards, topics, attempts, questions]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Your Study Plan</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          A prioritized plan built from your diagnostic results and flashcard
          review state. Each item explains why it&rsquo;s here. This guides study
          — it is not a prediction of passing.
        </p>
      </header>

      {!schedHydrated ? (
        <p className="text-sm text-neutral-500">Loading your progress…</p>
      ) : (
        <>
          <section aria-labelledby="plan-heading" className="mb-10">
            <h2 id="plan-heading" className="mb-3 text-lg font-semibold">
              Today&rsquo;s focus
            </h2>
            {plan.allCaughtUp ? (
              <p className="rounded-lg border border-neutral-200 p-4 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
                You&rsquo;re caught up — no weak or overdue skills right now. Take a
                fresh <Link href="/diagnostic" className="underline">diagnostic</Link> to
                re-check, or drill more <Link href="/flashcards" className="underline">flashcards</Link>.
              </p>
            ) : (
              <ol className="space-y-3">
                {plan.items.map((item, i) => (
                  <li
                    key={item.skillId}
                    className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-medium">
                        <span className="mr-2 text-neutral-400">{i + 1}.</span>
                        {item.title}
                      </span>
                      <span className={`text-xs font-medium ${LEVEL_TONE[item.mastery.level]}`}>
                        {item.mastery.level}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                      {item.reason}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm">
                      {item.actions.map((a, ai) => {
                        if (a.kind === "read") {
                          return (
                            <Link
                              key={ai}
                              href={`/topics/${a.topicSlug}`}
                              className="font-medium text-brand-fg underline underline-offset-2 dark:text-amber-400"
                            >
                              Read: {a.topicTitle}
                            </Link>
                          );
                        }
                        if (a.kind === "drill") {
                          return (
                            <Link
                              key={ai}
                              href="/flashcards"
                              className="font-medium text-brand-fg underline underline-offset-2 dark:text-amber-400"
                            >
                              Drill {a.dueCount} due card{a.dueCount === 1 ? "" : "s"}
                            </Link>
                          );
                        }
                        return (
                          <Link
                            key={ai}
                            href="/quiz"
                            className="font-medium text-brand-fg underline underline-offset-2 dark:text-amber-400"
                          >
                            Practice {a.questionCount} targeted question
                            {a.questionCount === 1 ? "" : "s"}
                          </Link>
                        );
                      })}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section aria-labelledby="mastery-heading">
            <h2 id="mastery-heading" className="mb-3 text-lg font-semibold">
              Skill mastery
            </h2>
            <ul className="space-y-2">
              {mastery.map((m) => (
                <MasteryRow key={m.skillId} m={m} />
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function MasteryRow({ m }: { m: SkillMastery }) {
  return (
    <li className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
      <details>
        <summary className="flex cursor-pointer items-baseline justify-between gap-3">
          <span className="text-sm font-medium">{m.title}</span>
          <span className="flex items-center gap-2 text-sm">
            <span className={LEVEL_TONE[m.level]}>
              {m.score === null ? "—" : `${m.score}/100`}
            </span>
            <span className="text-xs text-neutral-400">
              {m.level} · {m.confidence} confidence
            </span>
          </span>
        </summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-neutral-600 dark:text-neutral-400">
          {m.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </details>
    </li>
  );
}
