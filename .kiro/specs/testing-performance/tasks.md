# Phase 08 — Reliability & Performance: Tasks

- [x] 1. Author this spec (requirements/design/tasks); justify integration-over-Playwright; define coverage + audit scope.
  - _Requirements: all_

- [x] 2. Measure baseline; write `docs/PERFORMANCE.md` (metric/baseline/issue/recommendation/impact). Fixed a `react-hooks/exhaustive-deps` warning found in the build (AppShell drawer cleanup).
  - _Requirements: R2_

- [x] 3. `tests/integration/diagnostic-to-plan.test.tsx` (real engines/content/storage).
  - _Requirements: R1.1, R1.5_

- [x] 4. `tests/integration/flashcard-srs.test.tsx` (real srs.ts through the UI).
  - _Requirements: R1.2, R1.5_

- [x] 5. `tests/integration/exam-journey.test.tsx` (autosave→resume→submit).
  - _Requirements: R1.3, R1.5_

- [x] 6. `tests/integration/persistence-reset.test.tsx` (all keys cleared by reset + dashboard reflects readiness).
  - _Requirements: R1.4_

- [x] 7. Added `verify` npm script (typecheck+lint+validate:content+test); CI already runs the full sequence (Phase 03). No assertions weakened.
  - _Requirements: R3_

- [x] 8. Ran `validate:content`, `typecheck`, `lint`, `test`, `build`; all green. Updated spec + `docs/PERFORMANCE.md`.
  - _Requirements: R4_

## Result

- **Integration tier added** (`tests/integration/`, 4 files, 6 tests) exercising the
  critical journeys through **real** components + content + `localStorage` (only
  `next/link`/`next/navigation` mocked): diagnostic→plan, flashcard SRS round-trip,
  exam autosave→resume→submit, and persistence/reset across every storage key.
- **Measured performance audit** in `docs/PERFORMANCE.md`: 27 prerendered pages,
  103 kB shared First-Load JS (flat across phases), 13 justified client components,
  build-time MDX + search index (~60 kB), bounded persistence. No high-impact issues.
- **Quality fix, not a workaround:** removed the `react-hooks/exhaustive-deps`
  warning in `AppShell` by capturing the toggle ref inside the effect — build is now
  warning-free. No test was weakened.
- Added a one-shot `verify` script mirroring CI.

### Gates (all green)
- `validate:content`: pass. `typecheck`: clean. `lint`: clean (warning fixed).
- `test`: **194/194 across 28 files** (was 188/24).
- `build`: compiles successfully, 103 kB shared, no warnings.

## Unresolved / follow-ups
- **Browser E2E (Playwright) deferred** — a scoped follow-up. Integration tests
  cover the same journeys without a browser-automation dependency; add Playwright
  only if a real cross-browser/visual-regression need arises.
- **Field performance metrics** (Lighthouse LCP/CLS/INP) need a deployed
  environment; recommended before production launch to confirm the static analysis.
- Optional perf follow-ups noted in `docs/PERFORMANCE.md` (lazy search index, dynamic
  import of heavy results views) — not needed at current scale.
