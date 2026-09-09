# Phase 04 — Diagnostic Assessment: Tasks

- [x] 1. Author this spec (requirements/design/tasks); define readiness model (weighted, no pass-probability).
  - _Requirements: all_

- [x] 2. Implement pure `src/lib/diagnostic.ts` (scoreBySkill, scoreByDomain, summarizeTiming, computeReadiness, rankWeaknesses, recommendTopics, runDiagnostic + types).
  - _Requirements: R1, R2, R3, R4_

- [x] 3. Write `src/lib/diagnostic.test.ts` (17 tests: scoring, multi-skill counting, weighting/renormalization, timing, readiness bands & bounds, weakness ranking/determinism, recommendations incl. no-topic case).
  - _Requirements: R1–R4_

- [x] 4. Add `STORAGE_KEYS.diagnosticHistory`; implement pure `src/lib/diagnostic-history.ts` (appendAttempt cap, latestAttempt) + `diagnostic-history.test.ts` (6 tests).
  - _Requirements: R5_

- [x] 5. Build `src/components/DiagnosticRunner.tsx` (question flow + results: readiness w/ disclaimer, domain bars, weaknesses, recommendations, history) and `src/app/diagnostic/page.tsx`.
  - _Requirements: R6_

- [x] 6. Add "Diagnostic" to `Sidebar` PRIMARY_LINKS; surface latest readiness on the Dashboard; add `DiagnosticRunner.test.tsx` (4 tests).
  - _Requirements: R5.4, R6.3_

- [x] 7. Run `validate:content`, `typecheck`, `lint`, `test`, `build`; all green.
  - _Requirements: R7_

## Result

- Pure diagnostic engine: per-skill & per-domain scoring, timing summary,
  blueprint-**weight-renormalized** readiness index (0–100, qualitative bands,
  explicit "not a pass prediction" disclaimer), deterministic weakness ranking,
  and topic recommendations. All pure/deterministic (timing passed in as data).
- Local history via `STORAGE_KEYS.diagnosticHistory` (capped 20, newest-first);
  cleared by the existing reset loop. Dashboard surfaces the latest readiness.
- `/diagnostic` route + `DiagnosticRunner` client island reusing QuizRunner's
  accessible option pattern (`aria-pressed`, progressbar semantics).
- Sidebar + Dashboard link to the diagnostic.

### Gates (all green)
- `validate:content`: pass (17 topics, 32 flashcards, 14 questions; 7 non-fatal warnings).
- `typecheck`: clean. `lint`: clean. `test`: **136/136 across 17 files** (was 109/14).
- `build`: green, 25 pages; `/diagnostic` 112 kB First Load; shared JS still 103 kB (engine not in shared bundle).

## Design notes / decisions
- **Readiness ≠ pass probability.** Bands are study heuristics, explicitly labeled;
  index is weight-renormalized over *assessed* domains so a partial run isn't
  unfairly penalized by untested high-weight domains.
- **Reused the 14-question quiz pool** as the diagnostic item set. A larger,
  purpose-built diagnostic bank is future content work; the engine is pool-agnostic.
- **Timing lives in the component**; the engine takes `elapsedMs` as data to stay
  pure and testable without fake timers. (The current runner records answers but a
  richer per-question timer UI can be layered on later without engine changes.)

## Unresolved / follow-ups
- Per-question live timing capture in the UI is minimal (submit-time aggregation);
  a per-question stopwatch can be added later — engine already supports `elapsedMs`.
- Diagnostic breadth is bounded by the current 14-question pool; expanding the bank
  will improve per-skill signal (ties into the coverage-gap backlog).
