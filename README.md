# CCDV-F Study

An interactive study website for the **Claude Certified Developer: Foundations (CCDV-F)** exam. It turns a set of study notes into a full learning platform: readable topic pages, active-recall flashcards (with spaced repetition), and a scored practice quiz — all running client-side with your progress saved in the browser.

Built with Next.js (App Router) and deployable to Vercel as static output.

## The learner loop

The platform supports a full study loop, all client-side:

1. **Diagnose** — take a diagnostic to see strengths and gaps by exam domain and skill.
2. **Plan** — get a prioritized, explainable daily study plan (weak + overdue skills first).
3. **Learn** — read verified, sourced topic pages mapped to the exam blueprint.
4. **Practice** — drill flashcards (spaced repetition) and a scored practice quiz.
5. **Review** — see per-option explanations and per-skill mastery with reasons.
6. **Simulate** — take a full-length, timed, no-feedback **53-question practice simulation** with post-exam analysis and actionable remediation.
7. **Remediate** — after any quiz, diagnostic, or exam, weak/recently-missed skills flow back into the study plan as targeted "read → practice" actions.
8. **Track readiness** — a study-readiness estimate (never a pass-probability claim).

## Features

- **Topic pages** rendered from MDX, with syntax-highlighted code, tables, trap/tip callouts, and collapsible "reveal answer" scenario challenges.
- **Flashcards** with **spaced repetition** — a Leitner-style scheduler (`Again / Hard / Good / Easy`) that resurfaces cards due-first.
- **Practice quiz** — single- and multiple-response questions, instant scoring, per-option explanations.
- **Diagnostic assessment** — per-domain/skill scoring, weaknesses, recommendations, and a study-readiness estimate.
- **Adaptive study plan** — explainable per-skill mastery and a prioritized daily plan.
- **Exam simulator** — a full-length **53-question CCDV-F practice simulation** whose questions are deterministically allocated across the 8 blueprint domains **by their official weights**, with navigation, flagging, autosave/resume, timeout auto-submit, detailed per-domain/skill analysis, and a "what to focus on next" remediation block. Explicitly a practice aid, not the real Anthropic exam.
- **Error-driven remediation** — a local, PII-free per-question attempt log feeds the study plan so recently-missed skills are surfaced with targeted practice.
- **Local performance analytics** — overall/domain/skill accuracy, repeated-error rate, recent performance, and average response time, derived entirely on-device.
- **Progress dashboard**, **full-text search**, **dark mode**, and a responsive, accessible layout.
- **No backend, no login, no analytics service** — all progress lives in `localStorage`; a single "Reset all progress" action clears every key, including the attempt log.

> Every topic, flashcard, and question maps to a structured, sourced exam
> **blueprint** (`content/blueprint.ts`). Content is original study material with
> traceable evidence — not reproduced exam content. See
> [`docs/phases/01-claims-ledger.md`](docs/phases/01-claims-ledger.md).

## Study & revision resources

Beyond the interactive app, the repo ships a complete, blueprint-mapped set of
revision documents. Every current CCDV-F objective is covered (**0 missing**), and
the question bank holds **163 original scenario questions** (~40% exam-level),
weighted to the official domain distribution.

| Resource | What it is |
|---|---|
| [`CCDV-F-OBJECTIVE-MATRIX.md`](./CCDV-F-OBJECTIVE-MATRIX.md) | Every one of the 29 objectives → domain, weight, coverage, material, status (0 MISSING) |
| [`STUDY-PLAN.md`](./STUDY-PLAN.md) | 7-day, 14-day, and 30-day plans prioritized by **exam weight × your weakness** |
| [`READINESS-CHECKLIST.md`](./READINESS-CHECKLIST.md) | 0–5 self-scorecard for all 29 objectives with a weighted readiness formula and bands (study heuristic, not a pass prediction) |
| [`SOURCES.md`](./SOURCES.md) | Tiered, dated source list (official → secondary) and the provenance model |
| [`cheat-sheets/`](./cheat-sheets/) | 13 one-to-two-page "what it is → when → key mechanics → traps" sheets, one per domain area |
| [`architecture-patterns/`](./architecture-patterns/) | Mermaid diagrams (Messages API, tool loop, agent loop, MCP, multi-agent, security trust boundary, escalation ladder) + 12 fast-revision comparison tables |
| [`common-traps/`](./common-traps/) | 59 verified certification traps + a **"What the exam is really testing"** reasoning guide |
| [`mock-exams/`](./mock-exams/) | Three seeded, full-length, blueprint-weighted mock exams (via the simulator) plus a diagnostic |

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Content | MDX (`@next/mdx`) for prose/code; typed JSON for flashcards & quiz |
| Markdown | `remark-gfm` (tables), `rehype-slug`, `rehype-pretty-code` + Shiki (highlighting) |
| Styling | Tailwind CSS + `next-themes` (dark mode) |
| Search | Fuse.js over a build-time content index |
| State | `localStorage` via a small `useLocalStorage` hook |
| Tests | Vitest + React Testing Library |

## Getting Started

You need Node.js 18+. Any package manager works (`npm`, `pnpm`, `yarn`, or `bun`).

```bash
# install dependencies
npm install

# start the dev server (http://localhost:3000)
npm run dev

# production build
npm run build

# run the test suite
npm run test

# type-check, lint, and validate content
npm run typecheck
npm run lint
npm run validate:content
```

> A search index (`content/search-index.json`) is generated automatically before `dev` and `build` by the `predev` / `prebuild` scripts. To regenerate it manually, run `npm run search-index`.

### Quality gates & CI

Content is treated as production data. `validate:content` runs a strict, pure
validator (`src/lib/content-validation.ts`) over the blueprint, topics,
flashcards, and questions — checking skill mappings, unique IDs, per-option
explanations, orphan content, metadata enums, and evidence/provenance. The same
validator is asserted inside the test suite, so tests and the CLI gate can't drift.

Every push and pull request runs `.github/workflows/ci.yml`, which executes
`typecheck`, `lint`, `validate:content`, `test`, and `build` (via Bun). Any error
fails the build.

> `validate:content` runs the TypeScript validator directly with **Bun**
> (`bun scripts/validate-content.ts`), which the project already uses as its
> runtime/lockfile (`bun.lock`). The runner also hard-fails if the shipped
> question bank cannot construct a full 53-item blueprint-weighted exam.

## Local data & privacy

All learner data is stored **only in your browser's `localStorage`** — there is
no backend, no account, and no third-party analytics. The per-question analytics
that power remediation record **only graded outcomes** (question id, correct/
incorrect, optional response time, and the mapped domain/skill) — no answer
text, no free input, and no personal information. The attempt log is capped in
size, and the dashboard's **"Reset all progress"** clears every stored key,
including the attempt log and any in-progress exam session.

## Project Structure

```
content/
  topics.index.ts        # ordered topic metadata (id, slug, title, domain, file)
  topics/*.mdx           # one MDX file per topic (prose, code, callouts)
  flashcards.json        # active-recall cards ([{ id, topicId, question, answer }])
  quiz.json              # quiz questions with options + per-option explanations
  search-index.json      # GENERATED at build time (git-ignored)
scripts/
  build-search-index.mjs # extracts searchable text from topics + MDX
src/
  app/                   # routes: / (dashboard), /topics, /topics/[slug], /flashcards, /quiz
  components/            # UI (AppShell, Sidebar, FlashcardDeck, QuizRunner, Dashboard, SearchBox, mdx/*)
  lib/                   # content loader + types, quiz/flashcards/srs/progress/search logic, useLocalStorage
mdx-components.tsx       # global MDX component map (styled HTML + Callout/RevealAnswer)

# Revision resources (Markdown; not part of the app build)
CCDV-F-OBJECTIVE-MATRIX.md # objective coverage matrix (29/29 objectives)
STUDY-PLAN.md              # 7 / 14 / 30-day plans
READINESS-CHECKLIST.md     # 0-5 readiness scorecard
SOURCES.md                 # tiered, dated sources + provenance model
cheat-sheets/              # per-domain quick-reference sheets
architecture-patterns/     # Mermaid diagrams + comparison tables
common-traps/              # 59 traps + "what the exam is really testing"
mock-exams/                # weighted mock-exam + diagnostic guide
```

## Editing the Content

The site's content is decoupled from the UI, so you can update it without touching React.

### Add or edit a topic

1. Create `content/topics/NN-my-topic.mdx` (prose, code fences, and the custom components below).
2. Register it in `content/topics.index.ts` with a unique `id`/`slug`, a `title`, `summary`, `domain`, the `file` name, and an `order`.

Custom MDX components available in any topic file:

```mdx
<Callout type="trap" title="Watch out">
Explain the trap here. `type` is one of: trap, tip, pattern, note.
</Callout>

<RevealAnswer title="Scenario 1" prompt="What happens if…?">
The hidden answer, shown after the reader clicks "Reveal answer".
</RevealAnswer>
```

> **MDX gotcha:** in prose, a bare `<` immediately followed by a letter or digit (e.g. `<1s`) is parsed as a JSX tag and breaks the build. Write it as words ("under 1s") or keep it inside a code fence.

### Add a flashcard

Append an entry to `content/flashcards.json`. `topicId` must match a topic `id`:

```json
{ "id": "fc-my-topic-1", "topicId": "my-topic", "question": "…", "answer": "…" }
```

### Add a quiz question

Append an entry to `content/quiz.json`. Provide `correctIds` (length > 1 makes it "select all that apply"), an explanation for every option, blueprint `skillIds`, `difficulty`, `cognitiveLevel`, and provenance (`status` + `evidence`, or inherited from the topic):

```json
{
  "id": "q57",
  "topicId": "my-topic",
  "skillIds": ["d2-messages-api"],
  "difficulty": "core",
  "cognitiveLevel": "application",
  "status": "verified",
  "evidence": [
    {
      "sourceType": "official",
      "confidence": "high",
      "source": "Anthropic — Messages API",
      "url": "https://platform.claude.com/docs/en/api/messages",
      "verifiedOn": "2026-09-09"
    }
  ],
  "question": "…",
  "options": [{ "id": "a", "text": "…" }, { "id": "b", "text": "…" }],
  "correctIds": ["b"],
  "explanations": { "a": "why it's wrong", "b": "why it's right" }
}
```

Every `evidence` entry declares a `sourceType` — **`official`** (a first-party
Anthropic doc), **`secondary`** (a community source that corroborates), or
**`inferred`** (a reasoned conclusion). A `status: "verified"` question that is
used in the graded simulation must carry at least one `official`/`secondary`
source (its own or inherited from its topic); validation refuses to let a
secondary/community host be labeled `official`, and refuses to ship a bank that
can't build a full 53-item blueprint-weighted exam.

The test suite (`npm run test`) validates content integrity — every flashcard/quiz `topicId` must resolve to a real topic, and every topic in the index must have a matching MDX file.

## Contributing & governance

Contributions are welcome — especially content corrections (accuracy is a top
priority). Please read:

- [CONTRIBUTING.md](./CONTRIBUTING.md) — dev setup, quality gates, and the
  **content contribution rules** (original questions only, skill mapping, sourced
  evidence).
- [SECURITY.md](./SECURITY.md) — how to report vulnerabilities and the security posture.
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- [docs/VERSIONING.md](./docs/VERSIONING.md) — the app / content / blueprint version tracks.
- [CHANGELOG.md](./CHANGELOG.md)

Before opening a PR: `bun run verify` (typecheck, lint, validate:content, test)
and `bun run build`. CI runs the same gates.

## License

Source code is licensed under the [MIT License](./LICENSE). The original
educational content under `content/` is authored material that the maintainer may
license separately — see the note in `LICENSE` and CONTRIBUTING.

## Deployment

See [DEPLOY.md](./DEPLOY.md) for step-by-step instructions to push to GitHub and deploy on Vercel.

## Source Notes

The topic content is derived from the two study-note files in the repository root (`CCDV-F Study Notes.md` and `CCDV-F Study Notes2.md`), which are kept as the source of record. This is original study material — not reproduced exam content.
