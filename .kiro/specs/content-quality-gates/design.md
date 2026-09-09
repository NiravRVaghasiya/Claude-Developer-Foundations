# Phase 03 — Content Quality Gates: Design

## Architecture

One pure module, two entry points, plus CI:

```
src/lib/content-validation.ts      # pure: validateAll(inputs) -> { errors, warnings }
src/lib/content-validation.test.ts # negative fixtures for every rule
scripts/validate-content.ts        # thin bun runner over real content (replaces .mjs)
tests/content.test.ts              # asserts validateAll(realContent).errors == []
.github/workflows/ci.yml           # typecheck + lint + validate:content + test + build
```

`content-validation.ts` extends the existing `src/lib/blueprint.ts` helpers rather
than duplicating them: it imports `allSkillIds`/`allSkills` and adds the strict
per-collection rules. `blueprint.ts` keeps the coverage matrix and mapping checks.

## Validator API

```ts
export interface ValidationInputs {
  blueprint: Blueprint;
  topics: Topic[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
}
export interface ValidationResult { errors: string[]; warnings: string[]; }

export function validateAll(input: ValidationInputs): ValidationResult;
```

Internally composed of small pure checkers, each returning `string[]`:
- `checkBlueprint` (reuses `validateBlueprint`) + blank-id/title checks.
- `checkCollectionIds` — duplicate ids across topics/flashcards/questions.
- `checkTopics` — non-empty file/title, unique slug, skillIds resolve & non-empty.
- `checkFlashcards` — non-empty Q/A, topicId resolves, skillIds resolve & non-empty.
- `checkQuestions` — ≥2 options, unique option ids, correctIds non-empty & ⊆ options, every option explained, optional topicId resolves, skillIds resolve & non-empty.
- `checkMetadata` — difficulty/cognitiveLevel/status enums; evidence shape (source/url/verifiedOn ISO); `verified` ⇒ ≥1 evidence.
- Warnings: coverage gaps (skill with no learning content / no assessment) via `blueprint.ts`.

Enum + shape helpers:
- `isDifficulty`, `isCognitiveLevel`, `isStatus` — set-membership guards.
- `isIsoDate(s)` — `^\d{4}-\d{2}-\d{2}$`.
- `isUrlish(s)` — starts with `https://` (docs are all https; keeps it dependency-free and strict).

## Node/bun runner

`scripts/validate-content.ts` imports `validateAll`, `blueprint`, `getAllTopics`,
`flashcards.json`, `quiz.json`, runs the validator, prints warnings, prints errors,
and `process.exit(1)` on any error. Executed by **bun** (native TS + tsconfig
alias resolution, verified). `package.json`:
`"validate:content": "bun scripts/validate-content.ts"`. The old regex `.mjs` is
deleted (its behavior is fully subsumed and made stricter).

## Test strategy

`content-validation.test.ts` builds a known-good `ValidationInputs` factory and,
per rule, mutates one field to assert exactly that error appears (and that the
good baseline yields none). This gives negative coverage for: dangling/blank/
duplicate ids, orphan (no skillIds), unresolved topicId, missing option
explanation, <2 options, bad correctIds, invalid enum values, malformed evidence,
and verified-without-evidence.

`tests/content.test.ts` gains one assertion: `validateAll(real).errors` is empty —
so the real content is gated inside `bun run test` too, matching the runner.

## CI

`.github/workflows/ci.yml`: on push/PR, set up bun, install, then run
`typecheck`, `lint`, `validate:content`, `test`, `build`. Any non-zero fails CI.

## Tradeoffs / decisions
- **No schema lib** (justified in requirements): fixed shapes, build-time only.
- **bun-run TS validator** over regex-parsed JS: single source of truth, no drift.
- **`verified ⇒ evidence` as error, coverage gaps as warnings**: provenance is a
  hard rule; incomplete blueprint coverage is a tracked backlog, not a failure.
- **`isUrlish` = https-only**: strict enough for our all-official-docs sources
  without pulling a URL-parsing dependency.

## Non-goals
- No diagnostic/adaptive/simulator logic (Phases 4–6).
- No change to rendering, storage, or the content shapes themselves (only their validation).
