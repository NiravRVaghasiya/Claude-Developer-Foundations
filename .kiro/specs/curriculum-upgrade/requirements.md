# Phase 02 — Curriculum Upgrade: Requirements

## Introduction

Phase 01 produced a sourced 8-domain blueprint with 29 stable skills and mapped
existing content to ~13 of them. The coverage matrix flagged 14 skills with **no
learning content**. Phase 02 closes the highest-value gaps with original,
verified curriculum and fixes the one `needs-review` topic (prompt-caching
per-model minimums).

This phase is additive: it adds MDX topics, flashcards, and questions, all with
blueprint skill mapping, difficulty, cognitive level, and sourced evidence. It
does not change the app architecture or the schema (Phase 01 already added the
metadata fields).

Scope is prioritized by **exam weight** and coherence, not by covering every
skill at once (shallow coverage would violate the content-quality bar):

| New topic | Blueprint skills covered | Domain weight |
|---|---|---|
| Prompt & Context Engineering | d6-context-management, d6-prompt-principles | D6 = 11.0% |
| Security & Safety | d7-prompt-injection, d7-guardrails, d7-secrets | D7 = 8.1% |
| MCP & Tool Customization | d8-mcp-servers, d8-agentic-customization | D8 = 10.6% |
| Claude Code & Debugging | d3-core-components, d3-config-hierarchy, d3-modes, d4-trace-analysis, d1-agent-sdk, d2-config-management | D3+D4 = 5.7% (+D1/D2 skills) |

## Requirements

### Requirement 1 — Fix the flagged prompt-caching topic
**User story:** As a learner, I want accurate per-model cache facts, so I don't
memorize an over-generalized figure.

#### Acceptance Criteria
1. WHEN topic 06 is rendered THEN it SHALL present a precise per-model minimum-cacheable-length table (512 Opus 5; 1,024 Opus 4.8 / Sonnet 5; 2,048 Opus 4.7 / Haiku 3.5; 4,096 Opus 4.6 / 4.5 / Haiku 4.5), sourced.
2. WHEN topic 06 is rendered THEN the sampling-params / prefill version boundaries SHALL be stated precisely (prefill 400 on 4.6+/Fable/Mythos; sampling-params 400 on 4.7+ and Mythos Preview).
3. WHEN topic 06 metadata is validated THEN its `status` SHALL be `verified` with the supporting evidence entries.

### Requirement 2 — Original, verified curriculum for prioritized skills
**User story:** As a learner, I want each new topic to teach a skill to exam depth
with sources, so my study maps to the blueprint.

#### Acceptance Criteria
1. WHEN a new topic is authored THEN it SHALL include: a learning objective, core concepts, a practical (annotated) example, tradeoffs, common traps, at least one scenario, exam-oriented reasoning, and authoritative source evidence.
2. WHEN a new topic is registered THEN it SHALL declare `skillIds` (resolving to the blueprint), `difficulty`, `objective`, `evidence`, and `status`.
3. WHEN a factual claim cannot be sourced authoritatively THEN it SHALL be marked `needs-review` rather than asserted.
4. WHEN content is authored THEN it SHALL be original study material and SHALL NOT reproduce or reconstruct real exam questions (per exam-integrity steering).

### Requirement 3 — Assessment coverage
**User story:** As a learner, I want retrieval practice for the new skills.

#### Acceptance Criteria
1. WHEN a new topic is added THEN it SHALL have at least two original flashcards and at least one original practice question, each mapped to its skill(s) with full metadata.
2. WHEN validation runs THEN the targeted skills SHALL no longer be reported as "no learning content" and SHALL have assessment.

### Requirement 4 — No regression
#### Acceptance Criteria
1. WHEN Phase 02 completes THEN `validate:content`, `typecheck`, `lint`, `test`, and `build` SHALL all pass.
2. WHEN topics are added THEN sidebar grouping, search index generation, prev/next navigation, and existing tests SHALL continue to work.
3. WHEN the search index is regenerated THEN it SHALL include the new topics.
