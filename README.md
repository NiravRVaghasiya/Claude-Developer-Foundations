# CCDV-F Study

An interactive study website for the **Claude Certified Developer: Foundations (CCDV-F)** exam. It turns a set of study notes into a full learning platform: readable topic pages, active-recall flashcards (with spaced repetition), and a scored practice quiz — all running client-side with your progress saved in the browser.

Built with Next.js (App Router) and deployable to Vercel as static output.

## Features

- **13 topic pages** rendered from MDX, with syntax-highlighted code, tables, trap/tip callouts, and collapsible "reveal answer" scenario challenges.
- **Flashcards** — flip to reveal, filter by topic, and mark cards known / still-learning.
- **Spaced repetition** — a Leitner-style scheduler (`Again / Hard / Good / Easy`) that resurfaces cards due-first.
- **Practice quiz** — single- and multiple-response ("select all that apply") questions, instant scoring, and per-option explanations.
- **Progress dashboard** — reading coverage, flashcard mastery, and best quiz score, with a one-click reset.
- **Full-text search** across all topic content.
- **Dark mode** and a responsive, mobile-friendly layout.
- **No backend, no login** — all progress lives in `localStorage`.

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
```

> A search index (`content/search-index.json`) is generated automatically before `dev` and `build` by the `predev` / `prebuild` scripts. To regenerate it manually, run `npm run search-index`.

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

Append an entry to `content/quiz.json`. Provide `correctIds` (length > 1 makes it "select all that apply") and an explanation for every option:

```json
{
  "id": "q11",
  "topicId": "my-topic",
  "question": "…",
  "options": [{ "id": "a", "text": "…" }, { "id": "b", "text": "…" }],
  "correctIds": ["b"],
  "explanations": { "a": "why it's wrong", "b": "why it's right" }
}
```

The test suite (`npm run test`) validates content integrity — every flashcard/quiz `topicId` must resolve to a real topic, and every topic in the index must have a matching MDX file.

## Deployment

See [DEPLOY.md](./DEPLOY.md) for step-by-step instructions to push to GitHub and deploy on Vercel.

## Source Notes

The topic content is derived from the two study-note files in the repository root (`CCDV-F Study Notes.md` and `CCDV-F Study Notes2.md`), which are kept as the source of record. This is original study material — not reproduced exam content.
