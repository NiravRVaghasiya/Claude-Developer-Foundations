# Phase 09 — Open-Source Maturity: Requirements

## Introduction

Make the project safe and pleasant to contribute to and to release: licensing,
contribution guidance (code **and** content), a security policy, a code of
conduct, issue/PR templates, a changelog, and a **three-track versioning model**
that separates the application, the content, and the exam blueprint.

This phase is documentation/governance. It changes no application logic; it must
keep every existing gate green. It reinforces (not restates) the existing steering
contracts (exam-integrity, content-quality, security).

## Licensing decision (flag for maintainer)

The repo mixes **code** and **original educational content**. Recommended split:
- **Code** → MIT (permissive, standard for OSS tooling).
- **Educational content** (`content/**`, study notes) → the maintainer may prefer
  a content license (e.g. CC BY-SA 4.0) to require attribution/share-alike.

This phase ships **MIT** as the repository LICENSE and **documents the content
question explicitly** in CONTRIBUTING so the maintainer can confirm or add a
content license. It does not silently impose one license on the educational
material.

## Requirements

### Requirement 1 — Licensing
1. WHEN the repo is published THEN it SHALL include a `LICENSE` file and `package.json` SHALL declare a matching `license` field.
2. WHEN licensing is documented THEN the code-vs-content distinction SHALL be stated, with the content-license choice flagged for the maintainer.

### Requirement 2 — Contribution guidance
1. WHEN a contributor reads `CONTRIBUTING.md` THEN it SHALL cover: dev setup (bun), the quality gates (`verify` / CI: typecheck, lint, validate:content, test, build), branch/PR workflow, and how to run everything locally.
2. WHEN a contributor adds/edits **content** THEN CONTRIBUTING SHALL give explicit rules enforcing:
   - **Exam integrity:** original questions only; never reproduce/reconstruct real exam items; use "practice/study/original question".
   - **Content quality:** every unit needs skill mapping, difficulty, (questions: cognitive level), a valid answer mapping, per-option explanations, and sourced `evidence` (or `status: needs-review`).
   - Running `validate:content` before submitting.

### Requirement 3 — Security & conduct
1. WHEN a security issue is found THEN `SECURITY.md` SHALL state how to report it privately and the support scope.
2. WHEN `SECURITY.md` is read THEN it SHALL restate the project's security posture: no secrets in the repo; treat external content, `localStorage` data, MDX, URLs, and search input as untrusted; MCP least-privilege.
3. WHEN the repo is public THEN it SHALL include a `CODE_OF_CONDUCT.md`.

### Requirement 4 — Templates
1. WHEN an issue is opened THEN templates SHALL exist for: bug report, **content correction** (with a source/evidence field), and feature request.
2. WHEN a PR is opened THEN a template SHALL include a gate checklist and provenance/exam-integrity confirmation checkboxes.

### Requirement 5 — Versioning & changelog
1. WHEN releases happen THEN `docs/VERSIONING.md` SHALL define three independent tracks: **application** (`package.json` semver), **content** (dated content releases / notes), and **blueprint** (`blueprint.version`, currently 1.0, tied to the official exam-guide version).
2. WHEN a change ships THEN `CHANGELOG.md` SHALL record it (seeded with the work delivered in Phases 00–09).

### Requirement 6 — No regression
1. WHEN Phase 09 completes THEN `validate:content`, `typecheck`, `lint`, `test`, and `build` SHALL all pass unchanged.
