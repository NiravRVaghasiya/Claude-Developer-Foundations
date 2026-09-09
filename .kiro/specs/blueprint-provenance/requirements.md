# Phase 01 — Blueprint & Provenance: Requirements

## Introduction

Phase 01 establishes the trustworthy foundation every later phase depends on: a
structured, sourced CCDV-F exam blueprint with **stable skill IDs**, and a
**provenance/evidence model** attached to every factual content unit. Without
this, adaptive learning (Phase 5) has nothing stable to target and the coverage
matrix (blueprint-audit skill) cannot be produced.

This phase is **additive and backward-compatible**: it adds a blueprint artifact,
extends the content schema with optional metadata, maps existing content to
skills, and adds validation. It does not redesign the working Next.js/MDX/localStorage
architecture, and it does not rewrite topic prose (that is Phase 02 — Curriculum).

Source of truth: the official CCDV-F Exam Guide v1.0 (effective July 2026) and
current official Anthropic documentation. All model facts referenced here were
verified in the Phase 01 source-verification sweep (see `docs/phases/01-claims-ledger.md`).

## Requirements

### Requirement 1 — Structured exam blueprint
**User story:** As a curriculum maintainer, I want a typed, sourced blueprint of
the official CCDV-F domains and skills, so that all content can map to stable IDs.

#### Acceptance Criteria
1. WHEN the blueprint is loaded THEN it SHALL contain all 8 official domains with their exact official weights (D1 14.7, D2 33.1, D3 3.1, D4 2.6, D5 16.8, D6 11.0, D7 8.1, D8 10.6).
2. WHEN a domain is defined THEN it SHALL have a stable `id`, official `title`, `weight`, and at least one `skill`.
3. WHEN a skill is defined THEN it SHALL have a stable `id` (never reused/renumbered), a human title, and the owning domain id.
4. WHEN blueprint weights are summed THEN the total SHALL be within a documented tolerance of 100% (official figures sum to ~100.0 by rounding).
5. WHEN the blueprint cites the exam structure THEN it SHALL record the source (exam guide URL) and a `verifiedOn` date.

### Requirement 2 — Provenance / evidence model
**User story:** As a content reviewer, I want every factual unit to carry sourced
evidence, so that no claim is unverifiable and fabricated facts cannot hide.

#### Acceptance Criteria
1. WHEN the schema is extended THEN it SHALL add an `Evidence` type with `source` (label), `url`, and `verifiedOn` (ISO date), plus optional `note`.
2. WHEN a claim cannot be sourced THEN it SHALL be representable as `status: "needs-review"` rather than silently asserted.
3. WHEN evidence is attached to a content unit THEN existing content that lacks it SHALL still type-check (fields are optional at the type level; completeness is enforced by validation, not the compiler).

### Requirement 3 — Content ↔ skill mapping
**User story:** As a learner, I want every topic, flashcard, and question tied to
exam skills, so the platform can later diagnose and target my weak areas.

#### Acceptance Criteria
1. WHEN a topic is defined THEN it SHALL declare one or more `skillIds` that exist in the blueprint.
2. WHEN a flashcard or quiz question is defined THEN it SHALL declare one or more `skillIds` that exist in the blueprint.
3. WHEN content declares a `skillId` THEN that id SHALL resolve to a real blueprint skill (no dangling references).
4. WHEN the mapping is complete THEN every content unit SHALL map to at least one skill (no orphan content).

### Requirement 4 — Validation gate
**User story:** As a maintainer, I want automated validation of mappings and
evidence, so broken references or missing sourcing fail fast.

#### Acceptance Criteria
1. WHEN `validate:content` runs THEN it SHALL fail on any content `skillId` that does not resolve to the blueprint.
2. WHEN `validate:content` runs THEN it SHALL fail on any content unit with no `skillIds`.
3. WHEN `validate:content` runs THEN it SHALL report (warn) skills that have no learning content and skills that have no assessment.
4. WHEN `validate:content` runs THEN it SHALL fail on blueprint weight totals outside tolerance and on duplicate skill/domain ids.
5. WHEN validation logic exists THEN it SHALL be covered by unit tests and runnable via `bun run validate:content` and inside the test suite.

### Requirement 5 — Preserve existing behavior
**User story:** As a maintainer, I want the site to keep working exactly as
before, so this foundational change carries no regression.

#### Acceptance Criteria
1. WHEN Phase 01 completes THEN typecheck, lint, the full test suite, and the production build SHALL all pass.
2. WHEN Phase 01 completes THEN all existing routes, search, SRS, quiz scoring, and persistence SHALL behave as before (no UI redesign).
3. WHEN the schema changes THEN the existing `TopicDomain` sidebar grouping SHALL continue to function (the official blueprint domains are added alongside, not as a destructive rename in this phase).
