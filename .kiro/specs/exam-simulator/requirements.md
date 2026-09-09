# Phase 06 — Exam Simulator: Requirements

## Introduction

A **separate, timed certification simulation** — distinct from the practice quiz.
It draws exam parameters from structured data (`blueprint.format`), assembles a
blueprint-weighted item set, runs a countdown with autosave and timeout
auto-submission, supports navigation and flagging, and — crucially — **does not
reveal correctness during the exam**. Detailed analysis is shown only afterward.

Unblocked by Phase 03 (reliable question schemas + validation) and Phase 01
(skill mapping). Reuses `blueprint`, `quiz.ts` scoring, the diagnostic engine for
the post-exam breakdown, and the centralized storage abstraction.

## Guardrails

- **No correctness feedback during the exam** (unlike the practice quiz). No
  green/red, no explanations until submission.
- **Honesty about scale.** The real exam is 53 items / 120 min (blueprint). The
  current authored pool is smaller, so the simulator runs a **scaled** exam
  (length capped to the pool) and clearly labels it as a scaled practice
  simulation — never implies it is the real exam or predicts a pass.
- Pure, deterministic engine (seeded RNG; `now`/timing injected) with strong tests.
- Persistence only via `useLocalStorage` + `STORAGE_KEYS`.

## Requirements

### Requirement 1 — Configurable exam from structured data
#### Acceptance Criteria
1. WHEN an exam is configured THEN item count, time limit, and cut score SHALL derive from `blueprint.format` (with the count capped to the available question pool).
2. WHEN the pool is smaller than the official item count THEN the exam SHALL run a scaled length and the time limit SHALL scale proportionally (per-item time preserved), clearly labeled as scaled.
3. WHEN exam config is produced THEN it SHALL be pure data (no UI), reusable and testable.

### Requirement 2 — Seeded, blueprint-weighted assembly
#### Acceptance Criteria
1. WHEN an exam is assembled with a given seed THEN the selected questions and their order SHALL be deterministic (same seed ⇒ same exam).
2. WHEN questions are selected THEN selection SHALL be blueprint-weight-aware (domains with higher exam weight contribute proportionally more items where the pool allows).
3. WHEN options are presented THEN their order MAY be shuffled deterministically by seed, and the correct-answer mapping SHALL remain intact.
4. WHEN the pool is exhausted THEN assembly SHALL not duplicate questions and SHALL cap at pool size.

### Requirement 3 — Timing, autosave, timeout
#### Acceptance Criteria
1. WHEN an exam starts THEN a deadline SHALL be computed from the time limit and start time.
2. WHEN `remainingMs(now)` is queried THEN it SHALL return time left, clamped at 0.
3. WHEN the deadline passes THEN the exam SHALL auto-submit with whatever answers exist.
4. WHEN answers/flags/index change THEN the in-progress session SHALL be autosaved to `localStorage` so a reload resumes exactly where the learner left off (including the running deadline).

### Requirement 4 — Navigation, flags, response types
#### Acceptance Criteria
1. WHEN taking the exam THEN the learner SHALL navigate one question at a time with prev/next and jump-to, see progress (answered/flagged/remaining), and flag questions for review.
2. WHEN a question is single-response THEN one selection SHALL be kept; WHEN multiple-response THEN multiple SHALL be allowed (reuse `toggleSelection`/`isMultiResponse`).
3. WHILE the exam is in progress the UI SHALL NOT show whether any answer is correct.

### Requirement 5 — Post-exam analysis
#### Acceptance Criteria
1. WHEN the exam is submitted THEN it SHALL show overall score, a **scaled pass/fail** vs the (scaled) cut threshold — clearly labeled as a practice result, not a real-exam prediction — and time used.
2. WHEN analysis is shown THEN per-domain and per-skill breakdowns SHALL be presented (reusing the diagnostic scoring engine).
3. WHEN analysis is shown THEN each question SHALL be reviewable with the correct answer, the learner's answer, per-option explanations, and its flag state.
4. WHEN submitted THEN the in-progress session SHALL be cleared (a new attempt starts fresh) and a compact result MAY be retained.

### Requirement 6 — No regression
#### Acceptance Criteria
1. WHEN Phase 06 completes THEN `validate:content`, `typecheck`, `lint`, `test`, and `build` SHALL all pass.
2. WHEN the exam is added THEN the practice quiz, diagnostic, plan, SRS, and persistence behavior SHALL be unchanged. The exam session key SHALL be cleared by the existing reset loop.
