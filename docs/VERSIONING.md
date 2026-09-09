# Versioning

This project versions **three things independently**, because they change at
different cadences and for different reasons. Conflating them would make it unclear
whether a release changed the app, the study material, or the exam mapping.

## 1. Application version

- **Source of truth:** `version` in `package.json` (currently `0.1.0`).
- **Scheme:** [Semantic Versioning](https://semver.org) — MAJOR.MINOR.PATCH.
  - MAJOR: breaking UX/behavior or removed features.
  - MINOR: new features (a new study mode, engine, or route).
  - PATCH: bug fixes and small improvements.
- **When to bump:** any change to UI, engines (`src/lib/*`), or app behavior.

## 2. Content version

- **Source of truth:** dated entries under the **Content** heading in
  `CHANGELOG.md`.
- **Scope:** topics (`content/topics/**`), flashcards (`content/flashcards.json`),
  and practice questions (`content/quiz.json`).
- **Rules:** content edits must pass `bun run validate:content` (skill mapping,
  metadata, provenance). Adding or correcting content does **not** require an
  application version bump, but should be recorded in the changelog with the date
  and the source/evidence for any factual change.

## 3. Blueprint version

- **Source of truth:** `blueprint.version` + `blueprint.effective` in
  `content/blueprint.ts` (currently **`1.0`**, effective **`2026-07`**).
- **Meaning:** pinned to the version of the official CCDV-F Exam Guide the
  blueprint reflects. The blueprint defines the domains, weights, and **stable
  skill IDs** that all content maps to.
- **Why separate:** a blueprint change is a significant event — skills may be
  added, weights may shift, and content mappings depend on it. Skill IDs are a
  **stable contract**: never renumber or repurpose an existing id; to rename, add a
  new id and deprecate the old one. Record any blueprint change prominently in
  `CHANGELOG.md` under a **Blueprint** heading, with the source exam-guide version
  and date.

## Release process (manual)

1. Ensure `bun run verify` and `bun run build` pass.
2. Update `CHANGELOG.md` (App / Content / Blueprint sections as applicable).
3. Bump `package.json` `version` for application changes.
4. Tag the release (`vMAJOR.MINOR.PATCH`) and push.

Automated release tooling is intentionally not used yet; add it only if the
project's release cadence warrants it.
