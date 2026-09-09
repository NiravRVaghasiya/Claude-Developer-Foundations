# Phase 04 — Diagnostic Assessment: Requirements

## Introduction

A diagnostic assessment measures a learner's performance **by domain and skill**,
records timing, estimates study-readiness, identifies weaknesses, and produces
concrete recommendations — then persists attempt history locally so progress is
visible across sessions. It is the entry point of the learn→practice→review loop
and the foundation the adaptive engine (Phase 05) will build on.

This phase is now unblocked: stable skill IDs (Phase 01), reliable question
schemas + validation (Phase 03) exist. It reuses the existing quiz scoring
(`src/lib/quiz.ts`), the blueprint (`content/blueprint.ts`), and the centralized
storage abstraction. No architecture change.

## Guardrails (product/steering)

- **Never claim pass probability or guarantee exam success.** The readiness output
  is an explicitly-labeled study-readiness *index*, not a prediction of the real
  exam outcome.
- Scoring / readiness / weakness / recommendation logic MUST be **pure functions**
  with strong test coverage (testing steering).
- Persistence goes **only** through `useLocalStorage` + `STORAGE_KEYS`.

## Requirements

### Requirement 1 — Per-domain and per-skill scoring
#### Acceptance Criteria
1. WHEN a diagnostic is scored THEN it SHALL compute correct/total per **skill** (via each question's `skillIds`) and per **domain** (aggregating the domain's skills).
2. WHEN a question maps to multiple skills THEN its result SHALL count toward each mapped skill.
3. WHEN scoring a multiple-response question THEN it SHALL use the existing exact-match rule (`isQuestionCorrect`).
4. WHEN a domain/skill has no answered questions THEN it SHALL be reported as "not assessed" rather than 0%.

### Requirement 2 — Timing
#### Acceptance Criteria
1. WHEN a learner answers THEN per-question elapsed time SHALL be recorded (ms).
2. WHEN a diagnostic completes THEN total time and average time-per-question SHALL be available in the result.
3. WHEN timing is unavailable (e.g. restored/partial) THEN aggregation SHALL degrade gracefully (treat missing as 0/omit), never throw.

### Requirement 3 — Readiness estimate (NOT pass probability)
#### Acceptance Criteria
1. WHEN a diagnostic is scored THEN a **readiness index 0–100** SHALL be computed as the blueprint-**weighted** average of assessed domain scores (each domain weighted by its official exam weight, renormalized over assessed domains).
2. WHEN readiness is displayed THEN it SHALL be labeled a study-readiness estimate and SHALL carry an explicit disclaimer that it is **not** a prediction of passing.
3. WHEN readiness maps to a band THEN bands SHALL be qualitative (e.g. "Keep building", "Getting there", "Strong") — never "% chance to pass".
4. WHEN no domains are assessed THEN readiness SHALL be reported as unavailable, not 0.

### Requirement 4 — Weakness identification & recommendations
#### Acceptance Criteria
1. WHEN a diagnostic is scored THEN weakest skills SHALL be ranked (lowest score first; ties broken by higher exam weight, then by skill id for determinism).
2. WHEN recommendations are produced THEN each SHALL name the weak skill/domain and point to the topic(s) that teach it (resolved via topic `skillIds`).
3. WHEN a skill has no learning topic THEN the recommendation SHALL still name the skill (no crash) and note that content is pending.

### Requirement 5 — Local history persistence
#### Acceptance Criteria
1. WHEN a diagnostic completes THEN a typed attempt record (timestamp, overall correct/total, per-domain & per-skill breakdown, timing summary, readiness) SHALL be appended to history in `localStorage` via `useLocalStorage`/`STORAGE_KEYS`.
2. WHEN history is stored THEN it SHALL be capped (most recent N) to bound storage.
3. WHEN progress is reset THEN the diagnostic history key SHALL be cleared by the existing reset loop.
4. WHEN history exists THEN the latest readiness/weaknesses SHALL be surfaceable on the Dashboard.

### Requirement 6 — UI & navigation
#### Acceptance Criteria
1. WHEN a learner visits `/diagnostic` THEN they SHALL be able to take the diagnostic (answer questions, submit) and see a results view with per-domain/skill breakdown, readiness (+disclaimer), weaknesses, recommendations, and prior-attempt history.
2. WHEN the diagnostic UI renders THEN it SHALL follow the accessibility conventions already used by QuizRunner (semantic controls, `aria-pressed`, visible focus, progressbar semantics).
3. WHEN navigation renders THEN the diagnostic SHALL be linked from the sidebar.

### Requirement 7 — No regression
#### Acceptance Criteria
1. WHEN Phase 04 completes THEN `validate:content`, `typecheck`, `lint`, `test`, and `build` SHALL all pass.
2. WHEN the diagnostic is added THEN existing quiz/flashcard/search/persistence behavior SHALL be unchanged.
