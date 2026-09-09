# Phase 01 — Blueprint & Provenance: Tasks

- [x] 1. Record source-verification results in `docs/phases/01-claims-ledger.md` (models, caching, tokens, prefill, tokenizer, blueprint) with URLs + verifiedOn.
  - _Requirements: R1.5, R2.1, R2.2_

- [x] 2. Add `Evidence` and metadata types to `src/lib/content-types.ts`; extend `Topic`/`Flashcard`/`QuizQuestion` with optional `skillIds`, `difficulty`, `cognitiveLevel`, `objective`, `evidence`, `status`.
  - _Requirements: R2.1, R2.3, R3.1, R3.2_

- [x] 3. Author `content/blueprint.ts` — 8 official domains + stable skills + weights + source Evidence.
  - _Requirements: R1.1–R1.5_
  - _Note: skill-id list is parsed directly from `blueprint.ts` by the validator (no separate generated JSON), avoiding drift._

- [x] 4. Add pure `src/lib/blueprint.ts` (allSkillIds, validateBlueprint, validateContentMappings, coverageMatrix) + `src/lib/blueprint.test.ts` (14 tests).
  - _Requirements: R4.1–R4.5_

- [x] 5. Map existing 13 topics to blueprint `skillIds` (+ difficulty/objective/evidence) in `content/topics.index.ts`.
  - _Requirements: R3.1, R3.3, R3.4_

- [x] 6. Map 24 flashcards and 10 quiz questions to `skillIds` (+ difficulty/cognitiveLevel/evidence/status).
  - _Requirements: R3.2, R3.3, R3.4, R2.2_

- [x] 7. Add `scripts/validate-content.mjs` + `"validate:content"` npm script; extend `tests/content.test.ts` with mapping-resolution assertions.
  - _Requirements: R4.1–R4.5_

- [x] 8. Run `typecheck`, `lint`, `test`, `validate:content`, and `build`; all green. Report changed files, results, and unresolved risks.
  - _Requirements: R5.1, R5.2, R5.3_

## Result

All gates green: `validate:content` (29 skills, all content mapped, 28 coverage-gap
warnings), `typecheck` clean, `test` 83/83 across 13 files, `lint` clean, `build`
green (20 pages, 103–108 kB First Load JS — unchanged; metadata adds no client
bundle weight).

## Unresolved (carried to Phase 02)
- `06-prompt-caching` topic body marked `status: needs-review`: replace the coarse
  per-model cache-minimum grouping with a precise per-model table (claims ledger #7).
- 28 coverage-gap warnings are the Phase 02 curriculum backlog: Claude Code (D3),
  Security & Safety (D7), MCP server development, Agent SDK, prompt-engineering
  principles, context management, trace analysis, and configuration management have
  a blueprint skill but no learning content/assessment yet.
