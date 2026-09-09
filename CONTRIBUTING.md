# Contributing to CCDV-F Study

Thanks for helping improve this interactive study platform for the **Claude
Certified Developer: Foundations (CCDV-F)** exam. This project optimizes for
**learner outcomes**: correctness, exam alignment, and learning effectiveness come
before feature count.

Please read this guide before opening a pull request. Content contributions have
extra rules (see [Contributing content](#contributing-content)) because the
educational material is treated as production data.

## Development setup

The project uses [Bun](https://bun.sh) as its runtime and package manager
(`bun.lock`). Node 18+ also works with your package manager of choice, but the
scripts below assume Bun.

```bash
bun install          # install dependencies
bun run dev          # start the dev server (http://localhost:3000)
bun run build        # production build (regenerates the search index first)
```

### Quality gates

Run the full local gate before opening a PR — it mirrors CI
(`.github/workflows/ci.yml`):

```bash
bun run verify       # typecheck + lint + validate:content + test
bun run build        # also run this for app changes
```

Individually:

| Command | What it checks |
|---|---|
| `bun run typecheck` | TypeScript (`tsc --noEmit`) |
| `bun run lint` | ESLint (`next lint`) |
| `bun run validate:content` | Blueprint + content schema/mapping/provenance |
| `bun run test` | Vitest unit + component + integration tests |
| `bun run build` | Production build (Next.js) |

**Do not weaken tests or validation to make a change pass.** Fix the root cause.

## Project shape

- **Content** lives in `content/` (blueprint, topics MDX, flashcards/quiz JSON),
  decoupled from the UI.
- **Pure domain logic** (scoring, SRS, mastery, diagnostic, exam) lives in
  `src/lib/` and is unit-tested.
- **UI** is Next.js App Router: server components load data; small client islands
  handle interactivity. Persistence goes only through `useLocalStorage` +
  `STORAGE_KEYS`.

See `docs/` for the phase specs and `docs/PERFORMANCE.md` for the performance
profile. Governance for the project lives in `.kiro/steering/` (product,
architecture, content-quality, exam-integrity, security, testing, accessibility).

## Contributing code

1. Fork and create a branch off `main`.
2. Keep changes small and focused; add tests with the change (see the testing
   contract in `.kiro/steering/testing.md`).
3. Prefer extending the existing architecture. Before adding a dependency, justify
   why existing ones can't solve it and note bundle/maintenance impact.
4. Run `bun run verify` (and `bun run build` for app changes).
5. Open a PR using the template and fill in the checklist.

## Contributing content

Educational content is production data. Every learning unit and question must be
**original, sourced, and mapped to the exam blueprint**.

### Certification integrity (required)

- Write **original** study material and **original** practice questions.
- **Never** reproduce or reconstruct real CCDV-F exam questions, claim a question
  appeared on the exam, or imply access to confidential exam content.
- Label generated assessments as a "practice question", "study question", or
  "original question".
- Prefer **official Anthropic documentation** for product/API facts. When a claim
  can't be verified, mark it `status: "needs-review"` instead of guessing.

### Metadata every unit needs

Types live in `src/lib/content-types.ts`; skills live in `content/blueprint.ts`.
`bun run validate:content` enforces these.

**Topic** (`content/topics.index.ts` + `content/topics/NN-*.mdx`):
- `skillIds` (resolve to the blueprint), `difficulty` (`intro|core|advanced`),
  `objective`, `evidence[]` (source + https `url` + ISO `verifiedOn`), `status`.

**Flashcard** (`content/flashcards.json`):
- `topicId` (resolves), `skillIds`, `difficulty`, non-empty Q/A, `status`.
  Provenance may be inherited from the parent topic's evidence.

**Quiz / practice question** (`content/quiz.json`):
- `skillIds`, `difficulty`, `cognitiveLevel` (`recall|application|analysis`),
  `options` (≥2, unique ids), `correctIds` (⊆ options), an **explanation for every
  option**, `evidence[]` (or inherited), `status`.

### Content submission checklist

- [ ] Original content; no real exam items reproduced or reconstructed.
- [ ] `skillIds` resolve to `content/blueprint.ts`.
- [ ] Difficulty (and cognitive level for questions) set honestly.
- [ ] Every question option has a non-empty explanation.
- [ ] Evidence has an official/authoritative source URL + `verifiedOn`, or the unit
      is marked `status: "needs-review"`.
- [ ] `bun run validate:content` passes.

### Content licensing

The source **code** is MIT (see `LICENSE`). The **educational content** under
`content/` is authored material; the maintainer may license it separately (e.g.
CC BY-SA 4.0). If you contribute content you agree it may be published under the
project's chosen content license. **Maintainer:** confirm the content license
before wide distribution.

## Versioning & changelog

This project tracks three things independently — application, content, and the
exam blueprint. See `docs/VERSIONING.md`. Update `CHANGELOG.md` for user-facing
changes.

## Reporting problems

- Bugs / features: use the GitHub issue templates.
- **Content inaccuracies:** use the "Content correction" template and include a
  source — accuracy is a top priority.
- Security: see `SECURITY.md` (report privately, do not open a public issue).
