# Phase 03 — Content Quality Gates: Tasks

- [x] 1. Author this spec (requirements/design/tasks) with the no-dependency + bun-TS-runner decision.
  - _Requirements: all_

- [x] 2. Implement `src/lib/content-validation.ts` (`validateAll` + pure checkers + enum/shape guards), reusing `src/lib/blueprint.ts` helpers.
  - _Requirements: R1, R2, R3, R4_

- [x] 3. Write `src/lib/content-validation.test.ts` with negative fixtures for every rule + a passing baseline (25 tests).
  - _Requirements: R5.4_

- [x] 4. Replace `scripts/validate-content.mjs` with `scripts/validate-content.ts` (bun runner); update the `validate:content` npm script; delete the `.mjs`.
  - _Requirements: R5.1_

- [x] 5. Add `validateAll(realContent).errors == []` assertion to `tests/content.test.ts`.
  - _Requirements: R5.2, R6.1_

- [x] 6. Add `.github/workflows/ci.yml` (bun; typecheck, lint, validate:content, test, build) and document it in the README.
  - _Requirements: R5.3_

- [x] 7. Run `validate:content`, `typecheck`, `lint`, `test`, `build`; all green with zero content errors.
  - _Requirements: R6.1_

## Result

- New strict, pure-TS validator (`src/lib/content-validation.ts`) covers: duplicate
  ids (topics/slugs/files/flashcards/questions/options), dangling & missing skillIds
  (orphan content), unresolved topicIds, <2 options, bad/empty correctIds, missing
  per-option explanations, invalid difficulty/cognitiveLevel/status enums, malformed
  evidence (source/https-url/ISO-date), and the provenance rule (`verified` ⇒ sourced,
  with cards/questions inheriting their topic's evidence).
- The **same validator** runs in the Vitest suite and the `bun scripts/validate-content.ts`
  runner — no regex, no drift. The fragile `.mjs` was deleted.
- Provenance gap surfaced & resolved: all flashcards were `verified` without their own
  evidence; the rule now accepts evidence inherited from the parent topic (which is
  sourced), which is the correct model.
- CI: `.github/workflows/ci.yml` runs typecheck → lint → validate:content → test → build on Bun.

### Gates (all green)
- `validate:content`: pass (17 topics, 32 flashcards, 14 questions, 8 domains; 7 non-fatal coverage warnings).
- `typecheck`: clean. `lint`: clean. `test`: 109/109 across 14 files (was 83/13). `build`: green (24 pages, 103 kB shared JS — validator not in client bundle).

## Unresolved (unchanged from Phase 02, tracked)
7 coverage warnings (`d1-orchestration` uncovered; a few skills have content but no
dedicated assessment). Non-fatal by design — tracked backlog for a later curriculum pass.
