# Phase 05 — Adaptive Learning: Requirements

## Introduction

Turn the signals the platform already collects — diagnostic/quiz accuracy per
skill, flashcard SRS state, marks, recency, difficulty, and exposure — into an
**explainable per-skill mastery model** and a **daily study plan** that
prioritizes weak and overdue skills. Every score and recommendation must show
*why*, so a learner can trust and act on it.

Unblocked by Phase 04 (skill scores) and Phase 01 (stable skill IDs). Reuses the
existing SRS (`src/lib/srs.ts`), diagnostic engine (`src/lib/diagnostic.ts`),
flashcards helpers, blueprint, and centralized storage. Pure functions per the
testing steering.

## Guardrails

- **Explainability is mandatory.** Mastery and plan items carry human-readable
  `reasons`; no opaque scores.
- **Preserve existing SRS behavior.** The Leitner scheduler in `srs.ts` is not
  changed; mastery *reads* SRS state, it does not alter scheduling.
- **No pass-probability / exam-guarantee claims.** Mastery is a study signal.
- Pure, deterministic engines with strong tests; persistence only via the
  centralized abstraction (this phase mostly *reads* existing state).

## Requirements

### Requirement 1 — Explainable per-skill mastery
#### Acceptance Criteria
1. WHEN mastery is computed for a skill THEN it SHALL combine: assessment **accuracy** (diagnostic/quiz correct-rate), **SRS strength** (Leitner box progress of the skill's cards), **recency** (how recently reviewed/assessed), **difficulty** (harder content weighted), and **exposure** (how much evidence exists).
2. WHEN mastery is computed THEN the result SHALL be a 0–100 score with a qualitative **level** (e.g. unknown/beginning/developing/proficient/mastered).
3. WHEN mastery is computed THEN it SHALL include a `reasons` list explaining each contributing factor (e.g. "Accuracy 3/5 on assessments", "Cards mostly in early Leitner boxes", "Not reviewed recently").
4. WHEN a skill has **no data** (no assessments, no cards seen) THEN mastery SHALL be `unknown` with low confidence, not 0/mastered — and SHALL say so.
5. WHEN evidence is thin THEN a **confidence** signal SHALL reflect low exposure (mastery from 1 question is less trusted than from 6).

### Requirement 2 — Deterministic & bounded
#### Acceptance Criteria
1. WHEN mastery is computed with identical inputs THEN the output SHALL be identical (deterministic; the clock/`now` is passed in, not read internally).
2. WHEN any factor is at an extreme THEN the score SHALL remain within 0–100.

### Requirement 3 — Daily study plan
#### Acceptance Criteria
1. WHEN a plan is generated THEN it SHALL rank skills by a priority combining **low mastery**, **overdue SRS** cards, and **exam weight** (higher-weight skills break ties toward being studied first).
2. WHEN a plan item is produced THEN it SHALL specify an **action** (e.g. "Read topic X", "Drill N due cards for skill Y") and a human-readable **reason**.
3. WHEN a skill has overdue cards THEN the plan SHALL reflect that overdue count and prioritize it.
4. WHEN a skill has low mastery but a learning topic exists THEN the plan SHALL recommend reading that topic; WHEN cards exist and are due THEN it SHALL recommend drilling them.
5. WHEN the plan is generated THEN it SHALL be **capped** to a manageable daily size and **deterministic** in ordering (tie-breaks specified).
6. WHEN there is nothing to do (all strong, nothing due) THEN the plan SHALL say so rather than invent work.

### Requirement 4 — UI & navigation
#### Acceptance Criteria
1. WHEN a learner visits the study plan THEN they SHALL see prioritized items with actions, reasons, and links to the relevant topic/flashcards, plus per-skill mastery with its explanation.
2. WHEN the plan UI renders THEN it SHALL follow existing accessibility conventions.
3. WHEN navigation renders THEN the study plan SHALL be reachable (sidebar link and/or dashboard).

### Requirement 5 — No regression
#### Acceptance Criteria
1. WHEN Phase 05 completes THEN `validate:content`, `typecheck`, `lint`, `test`, and `build` SHALL all pass.
2. WHEN mastery/plan is added THEN existing SRS, quiz, diagnostic, flashcard, and persistence behavior SHALL be unchanged.
