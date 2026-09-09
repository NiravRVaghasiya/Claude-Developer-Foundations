# Phase 01 — Blueprint & Provenance: Design

## Overview

Add three things, all additive:
1. A typed blueprint module (`content/blueprint.ts`) describing the official
   CCDV-F domains and stable skills, with sourcing.
2. Provenance/evidence + skill-mapping fields on the content types
   (`src/lib/content-types.ts`), kept **optional** so existing content compiles.
3. A pure validation module (`src/lib/blueprint.ts`) + a Node script
   (`scripts/validate-content.mjs`) + tests, wired to a `validate:content` npm script.

No architecture change: blueprint and validation are plain typed data + pure
functions, consistent with the existing `content/*` + `src/lib/*` split.

## Architecture & data model

### Blueprint (`content/blueprint.ts`)

```ts
export interface ExamSkill {
  id: string;        // stable, e.g. "d2-api-messages" — NEVER renumbered
  title: string;
  domainId: string;  // FK -> ExamDomain.id
}

export interface ExamDomain {
  id: string;        // stable, e.g. "applications-integration"
  code: string;      // official display code, e.g. "D2"
  title: string;     // official domain title
  weight: number;    // official percentage (e.g. 33.1)
  skills: ExamSkill[];
}

export interface Blueprint {
  examCode: "CCDV-F";
  version: string;         // "1.0"
  effective: string;       // "2026-07"
  format: { items: number; minutes: number; scaleMin: number; scaleMax: number; cutScore: number };
  source: Evidence;        // exam guide URL + verifiedOn
  domains: ExamDomain[];
}
```

Stable-ID rule: skill ids are content-addressable by meaning, prefixed by domain
code (`d2-...`). Once published they are frozen; renames add a new id and
deprecate the old one. This is what Phase 05 will target.

### Evidence + content metadata (`src/lib/content-types.ts`)

```ts
export type ContentStatus = "verified" | "needs-review";
export type Difficulty = "intro" | "core" | "advanced";
// Bloom-style cognitive level for questions
export type CognitiveLevel = "recall" | "application" | "analysis";

export interface Evidence {
  source: string;      // human label, e.g. "Anthropic — Prompt caching"
  url: string;
  verifiedOn: string;  // ISO date "YYYY-MM-DD"
  note?: string;
}
```

Extend existing interfaces with **optional** fields (backward compatible):
- `Topic`: `skillIds?: string[]`, `difficulty?`, `objective?`, `evidence?: Evidence[]`, `status?`.
- `Flashcard`: `skillIds?: string[]`, `difficulty?`, `evidence?: Evidence[]`, `status?`.
- `QuizQuestion`: `skillIds?: string[]`, `difficulty?`, `cognitiveLevel?`, `evidence?: Evidence[]`, `status?`.

Optional at the type level (so the JSON that lacks them still compiles);
**required by validation** for completeness. This lets us land the schema and
map incrementally without a red build.

### Validation (`src/lib/blueprint.ts`, pure)

Pure functions (unit-testable, no I/O):
- `allSkillIds(bp): Set<string>`
- `validateBlueprint(bp): string[]` — duplicate domain/skill ids, weight-sum tolerance, empty domains.
- `validateContentMappings({ bp, topics, flashcards, quiz }): { errors: string[]; warnings: string[] }`
  - errors: dangling `skillId`, content unit with zero `skillIds`.
  - warnings: skill with no learning content; skill with no assessment (coverage gaps for the blueprint-audit skill).
- `coverageMatrix(...)` — per-skill counts of topics/flashcards/questions (feeds later phases + audit).

### Script (`scripts/validate-content.mjs`)

Node ESM, mirrors `build-search-index.mjs` style. Imports the compiled data via a
lightweight path: since the script is plain Node, it reads the JSON directly and
imports the blueprint/skill list from a generated or parsed source. To avoid a TS
runtime dependency (same constraint the search-index script documents), the
validator will operate on: `content/flashcards.json`, `content/quiz.json`, and a
parsed skill-id list. Blueprint skill ids are also exported to a small JSON
(`content/blueprint.skills.json`, generated) so the Node script and the browser
share one source of truth without a TS loader.

Exit non-zero on errors; print warnings without failing. Wired as
`"validate:content": "node scripts/validate-content.mjs"`.

### Tests

- `src/lib/blueprint.test.ts` — pure-function coverage: weight sum, duplicate ids, dangling mapping detection, orphan detection, coverage matrix counts.
- Extend `tests/content.test.ts` — every `skillId` on any content resolves to the blueprint; (once mapped) no content unit has zero skills.

## Sequencing (to keep the build green at every step)

1. Add `Evidence`/metadata types + `blueprint.ts` + generated `blueprint.skills.json`.
2. Add pure `src/lib/blueprint.ts` + `blueprint.test.ts` (green immediately).
3. Map content incrementally; run validator in "warn on missing, error on dangling" mode first.
4. Flip missing-skill mapping to an error once all content is mapped.
5. Add `validate:content` script; run full pipeline.

## Decisions & tradeoffs

- **Optional schema fields, validation-enforced completeness.** Lets the schema
  land without a giant simultaneous content edit; avoids a red build; matches the
  plan's "small, reviewable changes."
- **Keep `TopicDomain` for now.** The sidebar uses the informal 5-group domain.
  Remapping the UI to the official 8 domains is presentation and belongs to Phase
  02/07; Phase 01 adds the official blueprint as the authoritative skill source
  without breaking navigation. `skillIds` (not the old domain) become the
  canonical mapping.
- **Generated `blueprint.skills.json`.** Avoids adding a TS-in-Node loader just
  for validation, consistent with how `build-search-index.mjs` already parses TS
  without a runtime TS dep.

## Non-goals (this phase)
- No topic prose rewrite (Phase 02).
- No diagnostic/adaptive/simulator features (Phases 4–6).
- No UI redesign; no destructive rename of `TopicDomain`.
