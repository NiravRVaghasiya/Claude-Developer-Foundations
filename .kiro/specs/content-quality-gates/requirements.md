# Phase 03 — Content Quality Gates: Requirements

## Introduction

Content is production data. Phases 01–02 added a blueprint, provenance metadata,
and a first-pass validator. That validator parses TS with regex and only checks
skill mappings — too weak and too fragile to be the gate the plan requires before
diagnostics/adaptive/simulator work.

Phase 03 replaces it with **one strict, pure-TypeScript validator** that runs in
both the test suite and a thin runner (`validate:content`), plus comprehensive
negative tests and a CI workflow. No architecture change; no new dependency.

## Dependency decision (per architecture steering)

We do **not** add a schema library (zod/ajv/etc.). The content model is a small,
fixed set of known shapes validated at build/test time (not untrusted runtime
input). A hand-rolled pure-TS validator has zero bundle/runtime cost, is fully
typed and deterministic, is trivially unit-testable, and matches the steering's
"pure functions for scoring/validation" and "avoid unnecessary dependencies"
principles. The Node runner executes the same `.ts` via **bun** (the project
runtime, which runs TypeScript natively and resolves tsconfig path aliases),
eliminating the previous regex parsing and any risk of drift between the runner
and the tests.

## Requirements

### Requirement 1 — Strict blueprint validation
#### Acceptance Criteria
1. WHEN the blueprint is validated THEN duplicate domain ids, duplicate skill ids, empty domains, and skill/domain FK mismatches SHALL be errors.
2. WHEN the blueprint is validated THEN domain weights summing outside ±0.5 of 100 SHALL be an error.
3. WHEN the blueprint is validated THEN a domain/skill with a blank id or title SHALL be an error.

### Requirement 2 — Strict topic/flashcard/question validation
#### Acceptance Criteria
1. WHEN content is validated THEN duplicate ids within any collection (topics, flashcards, questions) SHALL be errors.
2. WHEN a unit declares `skillIds` THEN each SHALL resolve to a blueprint skill; a unit with zero `skillIds` SHALL be an error (orphan content).
3. WHEN a flashcard references a `topicId` THEN it SHALL resolve to a real topic; likewise a question's optional `topicId` when present.
4. WHEN a topic is validated THEN its `file` field SHALL be non-empty and its `slug`/`id` unique.
5. WHEN a flashcard/topic is validated THEN non-empty `question`/`answer`/`title` SHALL be required.

### Requirement 3 — Question integrity
#### Acceptance Criteria
1. WHEN a question is validated THEN it SHALL have ≥2 options with unique option ids.
2. WHEN a question is validated THEN `correctIds` SHALL be non-empty and every id SHALL reference a real option.
3. WHEN a question is validated THEN EVERY option SHALL have a non-empty explanation (missing explanation = error).
4. WHEN a question is validated THEN there SHALL be no duplicate option ids and no `correctId` outside the options.

### Requirement 4 — Metadata validity
#### Acceptance Criteria
1. WHEN present, `difficulty` SHALL be one of `intro|core|advanced`; `cognitiveLevel` one of `recall|application|analysis`; `status` one of `verified|needs-review`. Invalid values SHALL be errors.
2. WHEN present, each `evidence` entry SHALL have a non-empty `source`, a URL-shaped `url`, and an ISO-date `verifiedOn`. Malformed evidence SHALL be an error.
3. WHEN a unit has `status: "verified"` THEN it SHALL carry at least one `evidence` entry (verified claims must be sourced). Topics/flashcards/questions with claims but no evidence and no `needs-review` SHALL be flagged.

### Requirement 5 — One gate, two runners, CI-ready
#### Acceptance Criteria
1. WHEN `bun run validate:content` runs THEN it SHALL execute the pure validator over the real content and exit non-zero on any error, printing errors and (non-fatal) coverage warnings.
2. WHEN `bun run test` runs THEN the same strict validator SHALL assert zero errors against the real content.
3. WHEN CI runs THEN it SHALL execute typecheck, lint, validate:content, test, and build, failing on any error.
4. WHEN the validator changes THEN negative unit tests SHALL cover every rule (bad ids, missing explanations, duplicates, orphans, invalid metadata, malformed evidence).

### Requirement 6 — No regression
#### Acceptance Criteria
1. WHEN Phase 03 completes THEN typecheck, lint, the full test suite, validate:content, and the production build SHALL all pass, and the real content SHALL have zero validation errors.
