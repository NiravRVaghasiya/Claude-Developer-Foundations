# Phase 05 — Adaptive Learning: Tasks

- [x] 1. Author this spec (requirements/design/tasks); define the explainable mastery model + plan prioritization; preserve SRS.
  - _Requirements: all_

- [x] 2. Implement pure `src/lib/mastery.ts` (computeSkillMastery/computeAllMastery: accuracy + SRS strength + recency + difficulty factors, active-weight renormalization, confidence/exposure, levels, reasons; `now` injected).
  - _Requirements: R1, R2_

- [x] 3. Write `src/lib/mastery.test.ts` (11 tests: each factor, bounds 0–100, no-data → unknown, confidence tiers, reasons, determinism).
  - _Requirements: R1, R2_

- [x] 4. Implement pure `src/lib/study-plan.ts` (buildStudyPlan: priority = gap + overdue + weight; read/drill actions; deterministic sort + cap; all-caught-up state).
  - _Requirements: R3_

- [x] 5. Write `src/lib/study-plan.test.ts` (9 tests: prioritization, overdue weighting, weight tie-breaks, action selection, cap, determinism, all-caught-up).
  - _Requirements: R3_

- [x] 6. Build `src/components/StudyPlan.tsx` + `src/app/plan/page.tsx`; add "Study Plan" to Sidebar + dashboard quick action; `StudyPlan.test.tsx` (3 tests). Extended `DiagnosticAttempt` with a compact per-skill breakdown so the plan can reconstruct assessment signal.
  - _Requirements: R4_

- [x] 7. Run `validate:content`, `typecheck`, `lint`, `test`, `build`; all green.
  - _Requirements: R5_

## Result

- **Explainable mastery** (`mastery.ts`): per-skill 0–100 from accuracy (0.45),
  SRS box strength (0.30), recency (0.10), difficulty (0.15), renormalized over
  *active* factors; qualitative level, confidence from exposure, `reasons[]` per
  factor; no-data → `unknown`. Deterministic (`now` injected). SRS untouched (read-only).
- **Study plan** (`study-plan.ts`): priority = 0.55·gap + 0.30·overdue + 0.15·examWeight;
  read/drill actions with reasons; deterministic ordering + tie-breaks; cap 6;
  excludes strong-and-nothing-due skills; explicit all-caught-up state.
- **UI**: `/plan` route + `StudyPlan` client component (today's focus + per-skill
  mastery with expandable reasons), sidebar + dashboard entry points.
- `DiagnosticAttempt` extended with an optional compact `skills[]` breakdown so the
  plan reconstructs assessment signal without storing raw answers.

### Gates (all green)
- `validate:content`: pass. `typecheck`: clean. `lint`: clean.
- `test`: **159/159 across 20 files** (was 136/17).
- `build`: green, 27 pages; `/plan` 112 kB First Load; shared JS still 103 kB.

## Unresolved / follow-ups
- Mastery's assessment signal comes from the **latest** diagnostic attempt only;
  blending multiple attempts or per-question quiz results is a future enhancement.
- Difficulty factor currently activates when the diagnostic supplies answered-item
  difficulties; the UI path doesn't yet pass per-question difficulty into mastery
  (SRS + accuracy still drive it). Wiring that through is a small future step.
- Coverage-gap warnings (7) unchanged — content backlog, not adaptive-engine scope.
