# Phase 04 — Diagnostic Assessment: Design

## Architecture

Pure engine + thin client + centralized storage, matching the existing split.

```
src/lib/diagnostic.ts             # pure: scoring, weighting, readiness, weakness, recommendations
src/lib/diagnostic.test.ts        # unit tests (scoring/weight/timing/rank/bounds/recs)
src/lib/diagnostic-history.ts     # pure history helpers (append, cap, latest)
src/lib/diagnostic-history.test.ts
src/components/DiagnosticRunner.tsx  # client: question flow + timing + results
src/components/DiagnosticRunner.test.tsx
src/app/diagnostic/page.tsx       # server route: loads questions + blueprint + topics
```

Reuses: `isQuestionCorrect`/`scoreQuiz` (quiz.ts), `blueprint` + `allSkills`
(blueprint.ts), `getAllTopics` (content.ts), `useLocalStorage` + `STORAGE_KEYS`.

## Data model (`diagnostic.ts`)

```ts
export interface AnsweredQuestion {
  questionId: string;
  selected: string[];
  elapsedMs?: number;   // optional; timing degrades gracefully
}

export interface SkillScore {
  skillId: string; title: string; domainId: string;
  correct: number; total: number;       // total 0 => not assessed
  pct: number | null;                    // null when not assessed
}
export interface DomainScore {
  domainId: string; code: string; title: string; weight: number;
  correct: number; total: number; pct: number | null;
}
export interface TimingSummary { totalMs: number; answered: number; avgMs: number | null; }

export type ReadinessBand = "unavailable" | "low" | "developing" | "solid" | "strong";
export interface Readiness {
  index: number | null;    // 0-100, null when nothing assessed
  band: ReadinessBand;
  label: string;
  disclaimer: string;      // explicit "not a pass prediction"
}

export interface Recommendation {
  skillId: string; title: string; domainId: string;
  pct: number | null; topicSlugs: string[]; note?: string;
}

export interface DiagnosticResult {
  correct: number; total: number;
  skills: SkillScore[]; domains: DomainScore[];
  timing: TimingSummary;
  readiness: Readiness;
  weaknesses: SkillScore[];        // ranked
  recommendations: Recommendation[];
}
```

### Core functions
- `scoreBySkill(questions, answers, blueprint)` → `SkillScore[]` (a question counts toward each of its `skillIds`).
- `scoreByDomain(skillScores, blueprint)` → `DomainScore[]` (sum the domain's skills' correct/total).
- `summarizeTiming(answers)` → `TimingSummary` (sum defined `elapsedMs`; avg over answered).
- `computeReadiness(domainScores)` → `Readiness`:
  - Consider only **assessed** domains (total > 0).
  - `index = Σ(weightᵢ·pctᵢ) / Σ(weightᵢ)` over assessed domains (renormalized), rounded.
  - Bands: `unavailable` (none assessed), `low` (<50), `developing` (<70), `solid` (<85), `strong` (≥85). Cut points are study heuristics, **not** the real exam cut score, and are labeled as such.
- `rankWeaknesses(skillScores, blueprint)` → assessed skills sorted by pct asc, tie-break by domain weight desc, then skillId asc (deterministic).
- `recommendTopics(weaknesses, topics)` → map each weak skill to topics whose `skillIds` include it; note when none.
- `runDiagnostic({ questions, answers, blueprint, topics })` → `DiagnosticResult` (composition of the above; also overall correct/total via `scoreQuiz`).

All pure, deterministic, no `Date.now()` inside scoring (timing is passed in).

## History (`diagnostic-history.ts` + storage)

New key `STORAGE_KEYS.diagnosticHistory = "ccdvf:diagnostic-history"`.

```ts
export interface DiagnosticAttempt {
  at: number;                 // epoch ms (captured in the component, not the pure engine)
  correct: number; total: number;
  readinessIndex: number | null;
  readinessBand: ReadinessBand;
  domains: Array<{ domainId: string; pct: number | null }>;
  weakestSkillIds: string[];
  totalMs: number;
}
export const HISTORY_CAP = 20;
export function appendAttempt(history, attempt, cap=HISTORY_CAP): DiagnosticAttempt[]; // newest-first, capped
export function latestAttempt(history): DiagnosticAttempt | undefined;
```

Because reset iterates `Object.values(STORAGE_KEYS)`, adding the key makes reset
clear it automatically (R5.3).

## UI (`DiagnosticRunner.tsx`, client)

- Presents questions using the same option-button pattern as QuizRunner
  (`aria-pressed`, keyboard/focus, "select all" label for multi).
- Records per-question timing: capture `performance.now()` when a question first
  becomes current; store elapsed on advance/submit. (Component concern, kept out
  of the pure engine.)
- On submit: build `AnsweredQuestion[]`, call `runDiagnostic`, render results:
  - Readiness card (index + band + **disclaimer**).
  - Per-domain bars (weight shown; "not assessed" where total 0).
  - Weakness list + recommendations (links to topics).
  - Timing summary.
  - Appends an attempt to history; shows a small history list.
- Server route `/app/diagnostic/page.tsx` loads `quiz.json`, `blueprint`, and
  `getAllTopics()` and passes them in (data-loading in the server component,
  interactivity in the client island — existing pattern).

## Dashboard & nav
- Add a "Diagnostic" primary link to `Sidebar` `PRIMARY_LINKS`.
- Dashboard: read `diagnosticHistory`; if a latest attempt exists, show its
  readiness band + top weakness with a link to `/diagnostic` (hydration-guarded).

## Decisions / tradeoffs
- **Reuse the existing quiz pool** as the diagnostic question set for now (14
  mapped questions across the covered skills). A dedicated larger diagnostic bank
  is a future content task; the engine is agnostic to the pool.
- **Timing lives in the component**, engine takes `elapsedMs` as data → keeps the
  engine pure and deterministic (testable without fake timers).
- **Readiness is weight-renormalized over assessed domains** so a partial
  diagnostic isn't unfairly dragged down by unassessed high-weight domains; this
  is documented and the band labels avoid any pass-probability claim.

## Non-goals
- No adaptive item selection (Phase 05). No exam simulator (Phase 06).
- No backend; history is local only.
