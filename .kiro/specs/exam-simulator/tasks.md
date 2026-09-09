# Phase 06 — Exam Simulator: Tasks

- [x] 1. Author this spec (requirements/design/tasks); define config-from-blueprint, scaled honesty, seeded assembly, autosave, timeout, no-reveal.
  - _Requirements: all_

- [x] 2. Implement pure `src/lib/exam.ts` (seeded RNG, buildExamConfig, assembleExam weighted+capped, makeDeadline/remainingMs/isExpired, analyzeExam reusing diagnostic scoring).
  - _Requirements: R1, R2, R3, R5_

- [x] 3. Write `src/lib/exam.test.ts` (12 tests: seed determinism, weighted allocation, pool cap/no-dup, option-shuffle correctness preserved, timing/remaining/expiry, analysis + practice pass/fail).
  - _Requirements: R1–R3, R5_

- [x] 4. Add `STORAGE_KEYS.examSession`; implement `src/lib/exam-session.ts` (ExamSession type + isSessionActive + counts) + tests (5).
  - _Requirements: R3.4, R6.2_

- [x] 5. Build `src/components/ExamRunner.tsx` + `src/app/exam/page.tsx` (idle/config → in-progress w/ nav+flags+jump-grid+countdown+autosave+timeout, NO in-exam correctness → results/analysis+review).
  - _Requirements: R1–R5_

- [x] 6. Add "Exam Simulator" to Sidebar + dashboard entry; `ExamRunner.test.tsx` (5 tests: start, no-reveal in progress, flag+autosave, submit→analysis, resume).
  - _Requirements: R4, R5_

- [x] 7. Run `validate:content`, `typecheck`, `lint`, `test`, `build`; all green.
  - _Requirements: R6_

## Result

- **Pure engine** (`exam.ts`): seeded mulberry32 RNG + Fisher–Yates; `buildExamConfig`
  scales item count/time to the pool (honestly labeled); `assembleExam` does
  blueprint-weighted, largest-remainder domain allocation with no duplicates and a
  seeded order + option shuffle (correctness preserved by id); `makeDeadline`/
  `remainingMs`/`isExpired` timing; `analyzeExam` reuses diagnostic `scoreBySkill`/
  `scoreByDomain` and produces a practice pass/fail + per-question review.
- **Session** (`exam-session.ts` + `STORAGE_KEYS.examSession`): autosaved in-progress
  state (seed, ordered ids, option order, answers, flags, index, deadline, config);
  `isSessionActive` for resume; cleared on submit and by the reset loop.
- **UI** (`ExamRunner` + `/exam`): config/start card with a scaled-practice notice;
  timed one-question navigation with prev/next, a jump grid (answered/flagged
  markers), flagging, a live countdown, and **no correctness shown during the exam**;
  countdown auto-submits at 0; results screen shows score, practice pass/fail
  (clearly labeled non-official), domain breakdown, and full per-question review
  (correctness + explanations appear only here). Autosaves on every change; resumes
  an active session on reload.
- Sidebar + dashboard entry points added.

### Gates (all green)
- `validate:content`: pass. `typecheck`: clean. `lint`: clean.
- `test`: **181/181 across 23 files** (was 159/20).
- `build`: green, 28 pages; `/exam` 114 kB First Load; shared JS still 103 kB.

## Design notes
- **No in-exam feedback** enforced: correctness/explanations are computed and shown
  only in `analyzeExam`/results, verified by a component test.
- **Scaled honesty**: with a 14-question pool the exam runs scaled (count + time),
  clearly labeled; expanding the bank auto-grows the exam (config caps to pool).
- **Practice cut = % correct** (default 72), explicitly not the official 720/1000
  scaled cut, labeled everywhere to avoid implying a real pass/fail.

## Unresolved / follow-ups
- Timeout auto-submit is driven by a 1s interval reading `remainingMs`; the timing
  math is unit-tested, the interval wiring is not fake-timer-tested (kept simple).
- Exam realism is bounded by the 14-question pool; a larger authored bank makes the
  simulation closer to the 53-item format (ties into the content backlog).
