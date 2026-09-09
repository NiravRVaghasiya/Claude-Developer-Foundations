# Phase 08 — Reliability & Performance: Design

## Integration tests

New files under `tests/integration/` (Vitest jsdom, already the config's include
pattern covers `tests/**/*.test.ts(x)`):

```
tests/integration/diagnostic-to-plan.test.tsx
tests/integration/flashcard-srs.test.tsx
tests/integration/exam-journey.test.tsx
tests/integration/persistence-reset.test.tsx
```

Principles:
- Render the **real** components with **real** content imports (`@content/*`) and
  the real `useLocalStorage`/`STORAGE_KEYS` (jsdom localStorage). Mock only
  `next/link` and `next/navigation` (framework glue), never engines.
- Drive them via user-style events (click/change), then assert **persisted state**
  (`localStorage`) and **derived UI** (plan/dashboard).
- Determinism: the exam uses a seed from `Date.now()`; tests answer the *current*
  question (order-agnostic) rather than assuming an order.

### Journeys
1. **diagnostic → plan**: render `DiagnosticRunner`, answer questions, submit;
   assert an attempt is persisted with a per-skill breakdown; then render
   `StudyPlan` and assert mastery/recommendations reflect the attempt.
2. **flashcard SRS**: render `FlashcardDeck` in SRS mode, rate a card; assert the
   `flashcardSchedule` key holds a `CardSchedule` produced by real `applyRating`,
   and the due count/marks update.
3. **exam autosave→resume→submit**: render `ExamRunner`, start, answer/flag;
   read the saved `examSession`; unmount + re-render (simulating reload) and
   confirm resume into the active exam; submit and assert analysis renders +
   session cleared.
4. **persistence/reset**: write via features (or directly through the same keys),
   render `Dashboard`, click reset, assert **every** `STORAGE_KEYS` value is null.

## Performance audit (`docs/PERFORMANCE.md`)
Captured from the real production build + repo, in the skill's format
(metric/baseline/issue/recommendation/impact). Sections:
- Route sizes + shared First-Load JS (from `next build`).
- Client/server boundary table (13 client components, each justified).
- Search: build-time index generation + Fuse runtime (index size, in-memory).
- MDX: build-time compilation (no client highlighter shipped).
- Persistence: centralized `useLocalStorage`, JSON round-trips, event sync.
- Findings: currently healthy; recommendations are low-risk/optional.

## CI & scripts
- Add `"verify": "bun run typecheck && bun run lint && bun run validate:content && bun run test"`
  to `package.json` for a one-shot local gate mirroring CI.
- CI already runs the full sequence (Phase 03); confirm unchanged.

## Decisions
- **Integration over Playwright** (justified in requirements): same journey
  coverage, no browser/dependency cost; Playwright deferred as a follow-up.
- **No engine mocks in integration tests** — the whole point is real wiring.
- **Do not weaken existing tests**; only add.

## Non-goals
- No Playwright/browser E2E this phase (documented follow-up).
- No perf "optimization" churn without evidence — the audit shows the app is lean;
  recommendations are optional and low-risk.
