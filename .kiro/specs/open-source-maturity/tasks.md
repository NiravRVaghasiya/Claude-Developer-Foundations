# Phase 09 — Open-Source Maturity: Tasks

- [x] 1. Author this spec (requirements/design/tasks); define the docs set + 3-track versioning; flag the content-license question.
  - _Requirements: all_

- [x] 2. Add `LICENSE` (MIT, with a content-licensing note); set `package.json` `license: "MIT"`.
  - _Requirements: R1_

- [x] 3. Write `CONTRIBUTING.md` (dev setup, gates, code workflow, CONTENT rules + submission checklist + validator, content-licensing note).
  - _Requirements: R2_

- [x] 4. Add `SECURITY.md` (private reporting + posture) + `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1).
  - _Requirements: R3_

- [x] 5. Add `.github/ISSUE_TEMPLATE/*` (bug, content-correction w/ source field, feature, config) + `.github/pull_request_template.md` (gate + integrity checklist).
  - _Requirements: R4_

- [x] 6. Add `docs/VERSIONING.md` (app/content/blueprint tracks + release process) + `CHANGELOG.md` (seeded 0.1.0).
  - _Requirements: R5_

- [x] 7. Update `README.md` (learner loop, refreshed features, governance links, license); ran gates.
  - _Requirements: R6_

## Result

- Governance docs added: `LICENSE` (MIT + content-license note), `CONTRIBUTING.md`,
  `SECURITY.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`, `docs/VERSIONING.md`, four
  `.github/ISSUE_TEMPLATE/*`, and a PR template.
- **Three-track versioning** documented: application (`package.json` semver),
  content (dated CHANGELOG entries + validator), blueprint (`blueprint.version` 1.0,
  pinned to the official exam-guide version; stable-skill-ID contract restated).
- **Content contribution rules** enforce the exam-integrity and content-quality
  contracts (original questions only, skill mapping, difficulty/cognitive level,
  per-option explanations, sourced evidence or `needs-review`, run
  `validate:content`), with a PR checklist that includes provenance/integrity boxes.
- **Content-licensing question flagged** for the maintainer (MIT for code; content
  may want CC BY-SA) rather than silently imposing one license.
- README refreshed (learner loop, accurate feature list, governance + license links).
  `package.json` gained `license: "MIT"`. CI (Phase 03) referenced, not duplicated.

### Gates (all green — docs-only, no regression)
- `validate:content`: pass. `typecheck`: clean. `lint`: clean.
- `test`: 194/194 across 28 files. `build`: compiles successfully, 103 kB, no warnings.

## Follow-ups
- Maintainer to confirm/add a **content license** (CC BY-SA 4.0 recommended if
  attribution/share-alike is desired).
- Automated release tooling (tags/changelog automation) deferred — manual process
  documented; add only if release cadence warrants it.
- Fill the SECURITY.md private-contact channel with the real maintainer address on publish.
