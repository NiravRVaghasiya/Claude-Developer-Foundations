# Phase 09 — Open-Source Maturity: Design

## Files added

```
LICENSE                                  # MIT (code)
CONTRIBUTING.md                          # dev + code + CONTENT rules
SECURITY.md                              # private reporting + posture
CODE_OF_CONDUCT.md                       # Contributor Covenant (concise)
CHANGELOG.md                             # Keep a Changelog style, seeded 0.1.0
docs/VERSIONING.md                       # 3-track versioning model
.github/ISSUE_TEMPLATE/bug_report.md
.github/ISSUE_TEMPLATE/content_correction.md
.github/ISSUE_TEMPLATE/feature_request.md
.github/ISSUE_TEMPLATE/config.yml        # disable blank issues, point to security
.github/pull_request_template.md
```

Edited: `package.json` (`license: "MIT"`), `README.md` (link governance docs + a
concise "learner loop" and contributing section).

## Three-track versioning (`docs/VERSIONING.md`)
- **Application** — `package.json` `version`, SemVer. UI/engine/behavior changes.
- **Content** — dated content releases; changes to topics/flashcards/questions are
  recorded in CHANGELOG under a "Content" heading. Content edits don't require an
  app version bump but must pass `validate:content`.
- **Blueprint** — `content/blueprint.ts` `version` (currently `1.0`, effective
  `2026-07`), pinned to the official CCDV-F Exam Guide version. A blueprint bump is
  a significant event (skills may change) and is called out separately because
  content/skill mappings depend on it.

Rationale: these change at different cadences and for different reasons; conflating
them would make it unclear whether a release changed the app, the study material,
or the exam mapping.

## CONTENT contribution rules (in CONTRIBUTING)
A step-by-step "add a question / flashcard / topic" guide that mirrors the schema
and the validator, with a required checklist:
- original content only (exam-integrity); wording drawn from official docs, cited.
- `skillIds` resolve to `content/blueprint.ts`; `difficulty`; questions add
  `cognitiveLevel`; every option has an explanation; `evidence[]` with source URL +
  `verifiedOn`, or `status: needs-review`.
- run `bun run validate:content` (and `bun run verify`) before opening a PR.

## PR template checklist
- [ ] `bun run verify` passes (typecheck, lint, validate:content, test)
- [ ] `bun run build` passes (for app changes)
- [ ] Content is original; no real exam items reproduced (exam-integrity)
- [ ] New/changed content has skill mapping + evidence (or needs-review)
- [ ] Docs/CHANGELOG updated if user-facing

## Decisions
- **MIT for code + documented content-license question** (per requirements) rather
  than imposing a single license on original educational material.
- **Reuse the existing CI** (`.github/workflows/ci.yml` from Phase 03); reference it
  from CONTRIBUTING rather than duplicating.
- **Concise, standard docs** (Contributor Covenant, Keep a Changelog) — recognizable
  to contributors, no bespoke process.

## Non-goals
- No automated release tooling (semantic-release, etc.) — documented manual process
  is sufficient; automation is a follow-up if the project grows.
- No application logic changes.
