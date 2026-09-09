# Phase 08 — Reliability & Performance: Requirements

## Introduction

Broaden the test pyramid with **integration coverage of the critical learner
journeys**, produce a **measured performance audit**, and strengthen CI. The
foundations (pure-logic unit tests, component tests) are already strong; this
phase adds the integration tier and documents performance with evidence.

## Testing-tier decision (per architecture/product steering)

The pyramid asks for unit → component → integration → E2E. We already have solid
unit + component tests. For the top tiers:

- **Integration tests (added this phase):** exercise complete multi-step journeys
  through the **real** components, **real** content (blueprint/topics/flashcards/
  quiz), and **real** `localStorage` (jsdom) — no engine mocks. This is the
  highest-value coverage for a fully client-side app.
- **Browser E2E (Playwright): deliberately deferred.** Adding it means a browser
  automation dependency + CI browser runners, which the product/architecture
  steering says to avoid without a concrete need. RTL integration tests over the
  real DOM cover the same journeys at far lower cost. Playwright is recorded as a
  scoped follow-up, not silently added. **Tests will not be weakened to pass.**

## Requirements

### Requirement 1 — Integration coverage of critical journeys
1. WHEN the diagnostic → study-plan journey runs THEN a completed diagnostic SHALL persist an attempt that drives the study plan's mastery and recommendations (verified end-to-end).
2. WHEN the flashcard SRS journey runs THEN rating cards SHALL persist schedule state via the real `srs.ts` and be reflected in due counts (verified through the UI).
3. WHEN the exam journey runs THEN autosave → resume (re-render from saved session) → submit SHALL produce analysis and clear the session (verified end-to-end).
4. WHEN the persistence/reset journey runs THEN every `STORAGE_KEYS` entry written by features SHALL be cleared by reset (including diagnostic + exam keys).
5. WHEN integration tests run THEN they SHALL use real engines/content/storage (no mocking of scoring/SRS/mastery/exam logic).

### Requirement 2 — Measured performance audit
1. WHEN the audit is produced THEN it SHALL record concrete metrics: production route sizes + shared First-Load JS, client-component count, and search-index size.
2. WHEN the audit reports an item THEN it SHALL follow metric / baseline / issue / recommendation / expected-impact.
3. WHEN client/server boundaries are audited THEN each `"use client"` component SHALL be justified (genuine interactivity) or flagged.
4. WHEN search, MDX, and persistence are audited THEN their runtime cost profile SHALL be described with evidence (build-time vs runtime, index size, access pattern).

### Requirement 3 — CI & scripts
1. WHEN CI runs THEN it SHALL execute typecheck, lint, validate:content, test, and build (already wired in Phase 03) — verify it still holds and add a local one-shot `verify` script.
2. WHEN tests are added THEN existing tests SHALL remain unchanged and passing (no weakening).

### Requirement 4 — No regression
1. WHEN Phase 08 completes THEN `validate:content`, `typecheck`, `lint`, `test`, and `build` SHALL all pass with the expanded suite.
