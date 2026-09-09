# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). This project versions the
application, content, and exam blueprint independently — see
[docs/VERSIONING.md](docs/VERSIONING.md).

## [Unreleased]

### Added

- **Explicit provenance tiers.** `Evidence` now carries `sourceType`
  (`official | secondary | inferred`) and `confidence`. Validation rejects invalid
  tiers, refuses to label a known secondary/community host `official`, and requires
  every `status: "verified"` (exam-critical) question to be backed by a citable
  official/secondary source. The blueprint source is tagged `secondary`.
- **Deterministic blueprint-weighted exam allocation + drift detection**
  (`planExamAllocation` in `src/lib/exam.ts`): per-domain ideal/available/
  allocated/shortfall over all 8 domains, capped by availability. `validate:content`
  now hard-fails if the shipped bank cannot build a full 53-item exam.
- **Local, PII-free per-question analytics** (`src/lib/question-attempts.ts` +
  `STORAGE_KEYS.questionAttempts`): records graded outcomes only and derives
  overall/domain/skill accuracy, repeated-error rate, recency, and average
  response time.
- **Error-driven remediation** in the study plan: recently-missed skills (from the
  attempt log) get a bounded priority boost, a targeted "practice N questions"
  action, and an explainable reason. Exam and diagnostic submits record attempts.
- **Exam results remediation block** — "What to focus on next" maps weak skills to
  topics and targeted practice; the simulator is now labeled a full-length
  **"53-Question CCDV-F Practice Simulation"**.

### Content

- **Bank rebalanced to blueprint targets.** Added original scenario questions
  (`q54`–`q56`) so under-supplied domains meet their weighted ideal (D1 6→8, D7
  3→4) and added a second multiple-response item. Bank is now **56 questions**; a
  full 53-item blueprint-weighted exam allocates every domain with 0 drift.
- **Full blueprint coverage.** Every one of the 29 blueprint skills now carries
  both learning content and assessment; `validate:content` reports 0 coverage
  warnings (was 7).
- Added topic **`18-agent-orchestration.mdx`** (Agent Orchestration & Hooks),
  covering the previously-uncovered `d1-orchestration` skill (manager/subagent
  orchestration, isolated context, distilled results, deterministic hooks).
- Expanded the practice bank to the **full official size: quiz 14 → 53 questions**
  (`q15`–`q53`) with a blueprint-weighted per-domain distribution, and
  **flashcards 32 → 57** so every blueprint skill has ≥2 cards. The exam
  simulator can now run full-length instead of scaled. New units use the
  evidence-inheritance model, so the `verified ⇒ sourced` rule holds without new
  unverified date stamps.

### Docs

- Reconciled `docs/FINAL_AUDIT.md` counts (18 topics / 57 flashcards /
  53 questions / 202 test cases) and added a dated content-expansion addendum.
- Added `docs/ACCESSIBILITY.md` — a WCAG 2.2 AA manual verification plan
  (screen-reader, keyboard, contrast, and reduced-motion checklists) to gate any
  future AA conformance claim.

## [0.1.0]

Initial development build of the interactive CCDV-F study platform.

### Application

- Next.js 15 App Router + React 19 + TypeScript + MDX; statically prerendered,
  client-side only (no backend/DB/auth).
- Topic pages, flashcards with a Leitner spaced-repetition scheduler, and a scored
  practice quiz (single + multiple response) with per-option explanations.
- **Diagnostic assessment**: per-skill and per-domain scoring, timing, a
  blueprint-weighted study-readiness estimate (explicitly not a pass prediction),
  ranked weaknesses, and recommendations; local attempt history.
- **Adaptive learning**: explainable per-skill mastery (accuracy, SRS strength,
  recency, difficulty — each with reasons) and a prioritized daily study plan.
- **Exam simulator**: separate timed simulation with seeded blueprint-weighted
  assembly, navigation, flagging, autosave/resume, timeout auto-submit, no in-exam
  feedback, and detailed post-exam analysis (clearly labeled as a scaled practice
  exam, not a real-exam prediction).
- Full-text search (Fuse.js over a build-time index), dark mode, responsive shell.
- **Accessibility (toward WCAG 2.2 AA)**: skip link, focusable `main`,
  `:focus-visible` ring, reduced-motion support, mobile drawer focus trap /
  Escape / focus restore, accessible search with a result-count live region, and
  results-focus + exam time announcements. (Manual AT testing still recommended
  before a conformance claim.)

### Content

- Structured exam **blueprint** with 8 official domains, weights, and stable skill
  IDs (`content/blueprint.ts`), sourced to the official exam guide.
- 17 topics, 32 flashcards, and 14 original practice questions, each mapped to
  blueprint skills with difficulty, cognitive level (questions), learning
  objectives, and sourced evidence.
- Model facts (Fable 5 / Mythos 5 / Opus 5 / Sonnet 5 / prompt-caching minimums /
  tokenizer behavior) verified against official Anthropic documentation; see
  `docs/phases/01-claims-ledger.md`.

### Tooling & quality

- Strict content validator (`bun run validate:content`) and `verify` script;
  CI runs typecheck, lint, validate:content, test, and build.
- Test suite: unit + component + integration coverage of the critical learner
  journeys. Performance audit in `docs/PERFORMANCE.md`.

### Blueprint

- `1.0` (effective `2026-07`), reflecting the official CCDV-F Exam Guide v1.0.
