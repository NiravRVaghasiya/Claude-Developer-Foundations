# Phase 06 — Exam Simulator: Design

## Architecture

Pure engine + session helpers + thin client, reusing scoring/diagnostic + storage.

```
src/lib/exam.ts             # pure: config, seeded RNG, weighted assembly, timing, analysis
src/lib/exam.test.ts
src/lib/exam-session.ts     # pure: in-progress session shape + autosave helpers
src/lib/exam-session.test.ts
src/components/ExamRunner.tsx # client: config→take→submit→analyze, timer, autosave
src/components/ExamRunner.test.tsx
src/app/exam/page.tsx       # server route: loads blueprint + quiz + topics
```

Reuses: `blueprint`, `isQuestionCorrect`/`scoreQuiz`/`toggleSelection`/`isMultiResponse`
(quiz.ts), diagnostic `scoreBySkill`/`scoreByDomain` for the analysis breakdown,
`useLocalStorage` + `STORAGE_KEYS`.

## Seeded RNG (deterministic)
Small pure PRNG (mulberry32 + a string→int hash) so a seed reproduces the exact
exam and option order. Lives in `exam.ts`; no dependency.

## Exam config (`buildExamConfig`)
```ts
export interface ExamConfig {
  itemCount: number;   // min(blueprint.format.items, pool size)
  timeLimitMs: number; // per-item time from official × itemCount (scaled honestly)
  cutScorePct: number; // scaled cut as a % (see below)
  scaled: boolean;     // true when itemCount < official items
  officialItems: number; officialMinutes: number;
}
```
- Per-item minutes = `officialMinutes / officialItems`; `timeLimitMs = perItem × itemCount`.
- **Cut score**: the official 720/1000 scaled score is not a raw %; we present a
  **practice threshold** as a percentage (default 72% correct) and label it a
  practice heuristic, NOT the real scaled cut. Documented in the UI + spec.

## Assembly (`assembleExam(questions, blueprint, seed, itemCount)`)
- Group questions by domain (via each question's `skillIds` → domain).
- Allocate item slots per domain ∝ domain weight (largest-remainder rounding),
  clamped by how many questions each domain actually has; fill any shortfall from
  the remaining pool. Never duplicate.
- Seeded shuffle within/order the chosen set; optionally seeded option shuffle
  (kept simple: shuffle option order, remap `correctIds` by id — ids are stable so
  correctness is preserved regardless of display order).
- Returns `ExamItem[] = { question, displayOptionIds }`.

## Timing (`makeDeadline(startedAt, timeLimitMs)`, `remainingMs(deadline, now)`)
Pure: deadline = startedAt + timeLimitMs; remaining = max(0, deadline − now);
`isExpired = remaining === 0`.

## Analysis (`analyzeExam({ items, answers, blueprint, topics })`)
- Overall correct/total via `isQuestionCorrect`.
- Per-skill/domain via diagnostic `scoreBySkill`/`scoreByDomain` (reuse — no dup).
- `passedPractice = pct >= cutScorePct` (labeled practice-only).
- Per-question review rows: question, correctIds, selected, explanations, flagged.

## Session persistence (`exam-session.ts` + storage)
New key `STORAGE_KEYS.examSession = "ccdvf:exam-session"`.
```ts
export interface ExamSession {
  seed: number; startedAt: number; deadline: number;
  itemIds: string[];                       // ordered question ids (rehydrate items from pool)
  optionOrder: Record<string, string[]>;   // per-question display option order
  answers: Record<string, string[]>;
  flags: Record<string, boolean>;
  index: number;                           // current question
  config: ExamConfig;
}
export function isSessionActive(s, now): boolean;   // deadline in future & exists
```
Autosaved on every change; on submit/expiry the key is set to null. Because reset
iterates `Object.values(STORAGE_KEYS)`, the key is cleared on reset.

## UI (`ExamRunner.tsx`, client)
States: `idle` (config/start card explaining scaled nature + rules) →
`in-progress` (one question, prev/next, jump grid with answered/flagged markers,
flag toggle, live countdown, NO correctness shown) → `results` (analysis + review).
- On mount, if an active session exists, offer resume.
- Countdown via `setInterval` reading `remainingMs`; at 0 → auto-submit.
- Autosave via the session storage on answer/flag/navigate.
- Reuses QuizRunner's accessible option-button pattern (`aria-pressed`), progressbar.
- Results reuse diagnostic-style domain bars; review list shows correctness ONLY here.
Server route loads `blueprint`, `quiz.json`, `getAllTopics()`.

## Nav & dashboard
- Sidebar: add "Exam Simulator".
- Dashboard: add a quick-action / entry point.

## Decisions / tradeoffs
- **Scaled exam, clearly labeled.** With a 14-question pool we cannot run 53 items;
  the engine scales count + time honestly and the UI states it's a scaled practice
  simulation. Expanding the bank later automatically grows the exam (config caps to pool).
- **Practice cut as %**, explicitly not the official 720/1000 scaled score, to avoid
  implying a real pass/fail. Labeled everywhere.
- **Option shuffle by id-remap** keeps correctness intact independent of display order.
- **Reuse diagnostic scoring** for analysis — no duplicate scoring logic.
- **`now`/seed injected** into the engine → deterministic, fake-timer-free tests.

## Non-goals
- No adaptive item selection during the exam (fixed set once assembled).
- No backend; sessions are local. No change to the practice quiz behavior.
