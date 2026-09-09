# Phase 00 — Baseline Audit Report

> Read-only audit of the repository before feature work. This report records the
> current architecture, subsystems, content, tests, verification results, metrics,
> gaps, and risks. **No working architecture was redesigned.** The only code change
> was adding a missing `typecheck` npm script (see §8).

- **Date:** 2026-09-09
- **Git HEAD at audit:** `9dcdbb5`
- **Runtime:** `bun` (npm is not on PATH in this environment; `bun.lock` is present)
- **Verdict:** Baseline is healthy and green. Safe to proceed to Phase 01.

---

## 1. Verification results (evidence, not optimism)

All commands were run via `bun run <script>`.

| Gate | Command | Result |
|---|---|---|
| Unit + component tests | `bun run test` (`vitest run`) | **66 passed / 66**, 12 files, ~24s |
| Typecheck | `bun run typecheck` (`tsc --noEmit`) | **clean**, exit 0 |
| Lint | `bun run lint` (`next lint`) | **no warnings or errors** |
| Production build | `bun run build` (`next build`) | **success**, 20 static pages generated |

Notes:
- `next lint` prints a deprecation notice (removed in Next.js 16). Non-blocking; migration is a future maintenance item.
- The `navigation.test.tsx` run logs a benign jsdom `Not implemented: navigation` message; the test still passes (it exercises link semantics, not real navigation).
- Dependencies were already installed (`node_modules` present); `next` and `vitest` resolve correctly.

### Build output (First Load JS)

| Route | Size | First Load JS |
|---|---|---|
| `/` | 2.04 kB | 108 kB |
| `/_not-found` | 994 B | 104 kB |
| `/flashcards` | 3.04 kB | 106 kB |
| `/quiz` | 2.29 kB | 105 kB |
| `/topics` | 162 B | 106 kB |
| `/topics/[slug]` (×13, SSG) | 1.24 kB | 107 kB |
| Shared chunks | — | 103 kB |

All 13 topic pages are prerendered via `generateStaticParams` (SSG). No runtime server data, DB, or API routes.

---

## 2. Repository metrics

| Metric | Value |
|---|---|
| Topics (MDX) | 13 |
| Flashcards | 24 |
| Quiz questions | 10 |
| Test files | 12 |
| Non-test source TS/TSX files | 26 |
| Domain-logic modules (pure) | `srs`, `quiz`, `progress`, `search`, `flashcards` |
| Total First Load JS (shared) | ~103 kB |

Content-per-topic is thin (avg ~1.8 flashcards and <1 quiz question per topic), and the topic bodies range 40–134 lines. This is a volume gap, not a defect (see §6).

---

## 3. Current architecture (A)

- **Stack:** Next.js 15 (App Router) + React 19 + TypeScript (strict) + MDX. Tailwind CSS + `next-themes`. Fuse.js for search. Vitest + React Testing Library for tests.
- **Rendering model:** Server Components by default; all route pages are Server Components that load data at module scope and delegate interactivity to small client "islands." No `output: export` — standard server-rendered Next.js with heavy static prerendering. `vercel.json` uses the `nextjs` preset.
- **MDX:** compiled at **build time** via `@next/mdx` (`remark-gfm`, `rehype-slug`, `rehype-pretty-code` + Shiki). `/topics/[slug]` resolves a slug → file through the typed `content/topics.index.ts` and dynamically `import()`s the MDX module. `generateStaticParams` enumerates all slugs.
- **Client islands:** `AppShell`, `Sidebar`, `ThemeProvider`/`ThemeToggle`, `Dashboard`, `FlashcardDeck`, `QuizRunner`, `SearchBox`, `TopicViewTracker`, `RevealAnswer`.
- **Persistence:** centralized in `src/lib/useLocalStorage.ts` + `src/lib/storage-keys.ts`. SSR-safe (init with default, hydrate in effect, `hydrated` flag), cross-tab (`storage` event) and cross-instance (custom `local-storage` event) sync, all reads/writes wrapped in try/catch. The only storage outside this abstraction is theme (owned by `next-themes`).
- **Domain logic is pure and typed**, cleanly separated from UI — matches `.kiro/steering/architecture.md`.

This architecture is sound and should be **preserved**, per the architecture steering and the plan's dependency rules.

---

## 4. Current features (B)

- 13 MDX topic pages (syntax-highlighted code, tables, `Callout` trap/tip/pattern/note, `RevealAnswer` scenarios) with prev/next navigation.
- Flashcards: flip, filter by topic, mark known/still-learning.
- Spaced repetition: Leitner scheduler (`Again/Hard/Good/Easy`), due-first ordering, box intervals `[0,1,3,7,16,35]` days.
- Practice quiz: single- and multiple-response ("select all that apply"), exact-set scoring, per-option explanations, best-attempt-by-percentage persistence.
- Progress dashboard: reading coverage, flashcard mastery, best quiz score, one-click reset.
- Full-text search (Fuse.js over a build-time index), dark mode, responsive shell.
- No backend, no auth — all progress in `localStorage`.

### Subsystem notes (verified by reading source)

- **SRS (`src/lib/srs.ts`):** `applyRating` maps again→box 0, hard→−1, good→+1, easy→+2 (clamped 0..5); `again` stays due now; `orderByDue`/`countDue` are pure. Tested (9 tests).
- **Quiz (`src/lib/quiz.ts`):** `isQuestionCorrect` requires an **exact** set match (under/over-selection is wrong — correct for "select all"); `toggleSelection` replaces for single, add/remove for multi; `scoreVerdict` scales thresholds by count. Tested (7 tests).
- **Search (`src/lib/search.ts`):** Fuse weighted keys (title 3 / summary 2 / body 1), `threshold 0.35`, `ignoreLocation`, min 2 chars; `makeSnippet` builds context around the first body match, falls back to summary. Tested (5 tests).
- **Flashcards (`src/lib/flashcards.ts`):** pure `filterByTopic`, `deckStats`, `topicIdsInCards`. Tested (5 tests).
- **Persistence (`src/lib/useLocalStorage.ts`):** covered indirectly through Dashboard/FlashcardDeck/QuizRunner component tests (reset clears all keys; schedule persists on rating; best score persists).

---

## 5. Current content architecture (C)

- `content/topics.index.ts` — typed `Topic[]` registry (id, slug, title, summary, domain, file, source, order).
- `content/topics/*.mdx` — one file per topic (prose + code + `Callout`/`RevealAnswer`).
- `content/flashcards.json` — typed `Flashcard[]`.
- `content/quiz.json` — typed `QuizQuestion[]` with per-option `explanations`.
- `content/search-index.json` — **generated** at build/dev by `scripts/build-search-index.mjs` (git-ignored).
- Types live in `src/lib/content-types.ts`; access layer in `src/lib/content.ts`.

**Metadata depth is the key content limitation.** `Topic`, `Flashcard`, and `QuizQuestion` carry **no** skill/blueprint mapping, difficulty, cognitive level, learning objective, or evidence/source URL + verification date. This is required by `.kiro/steering/content-quality.md` and is the foundation Phases 1–3 must build. (Confirmed by grep: none of these fields exist in the index or JSON.)

---

## 6. Current testing / validation (D)

- **Framework:** Vitest (`jsdom`, globals) + RTL. Aliases `@`→`src`, `@content`→`content`.
- **Coverage of critical logic (per testing steering):**
  - SRS scheduling — ✅ `src/lib/srs.test.ts`
  - Quiz scoring / multiple-response — ✅ `src/lib/quiz.test.ts`
  - Progress persistence — ✅ via `Dashboard.test.tsx` + `progress.test.ts`
  - Search — ✅ `src/lib/search.test.ts`
  - Content integrity — ✅ `tests/content.test.ts` (topicId resolution, unique ids, options/explanations well-formed, MDX files exist, single vs multi classification)
  - Component interaction — ✅ FlashcardDeck, QuizRunner, SearchBox, navigation, MDX components
- **Gaps:**
  - No **mastery**, **diagnostic scoring**, or **recommendation** logic yet (features don't exist) — required by testing steering once built.
  - No **standalone content validator** (`validate:content`) — validation currently lives inside the Vitest suite.
  - No **CI workflow** and no **E2E** tests.
  - Accessibility is asserted at the markup level (roles, `aria-*`), not through full keyboard/focus interaction flows.

---

## 7. Current CCDV-F alignment (E)

- Topics are grouped by `TopicDomain`, and topic 13 asserts a "~60% of scored weight" mapping in prose.
- **No structured blueprint artifact exists** (`docs/phases/01-blueprint.md` describes the intent only). There is no traceable content→skill mapping and no coverage matrix, which the `blueprint-audit` skill expects.
- Provenance is prose-only ("derived from the two study-note files"); there is **no per-claim sourcing** or verification date.

---

## 8. Changes made in Phase 00

Minimal and non-architectural, limited to a clear existing tooling gap:

- **`package.json`** — added `"typecheck": "tsc --noEmit"`. The `.kiro/hooks/README.md` and every phase doc invoke `npm run typecheck`, but the script did not exist. Verified: `bun run typecheck` exits clean.

**Deliberately NOT changed:** I did **not** add a `validate:content` script stub. Content validation currently lives in `tests/content.test.ts`, and a real standalone validator requires the content schema that Phase 03 introduces. A stub would give false confidence and mask the gap. It is recorded below instead.

---

## 9. Major gaps (F)

1. **No blueprint + no skill mapping/provenance** on any content unit (blocks adaptive learning and the coverage matrix). *(P0)*
2. **Missing content metadata** — difficulty, cognitive level, objective, evidence, verification date. *(P0/P1)*
3. **Missing `validate:content` script + no CI**, both referenced by hooks/phase docs. *(P1)*
4. **No diagnostic assessment, adaptive engine, or exam simulator** (Phases 4–6). *(P1)*
5. **Thin content volume** — 13 topics / 24 cards / 10 questions. *(P2)*

---

## 10. Technical risks (G)

1. **HIGHEST — factual accuracy / exam integrity.** Content asserts model names/specs that appear speculative or invented: "Claude Fable 5", "Mythos", "Opus 5 / `claude-opus-5` / `claude-sonnet-5`", "Opus 4.7", "prefill removed on 4.6+", and the "+30% newer tokenizer" figure (see `content/topics/06,07,08,10,11.mdx` and `content/quiz.json` q1–q4). Under `content-quality.md` and `exam-integrity.md` ("Never invent undocumented Anthropic behavior"), each must be verified against official Anthropic docs or marked `needs-review`. Building later phases on unverified facts would teach wrong things. **This gates Phases 1–3.**
2. Dynamic `import()` of MDX by interpolated path — safe today because paths come from the typed index; must remain index-driven.
3. Unaudited security surface per `security.md`: MDX rendering, external links, `localStorage` JSON parsing, search input (currently low-risk, unaudited).
4. Runtime mismatch: docs/hooks assume `npm`; environment provides `bun`. Contributor workflows should standardize on one.
5. `next lint` deprecation (Next.js 16) — future maintenance.

---

## 11. Open questions / assumptions (I)

1. **Model facts:** Are Fable/Mythos/Opus 5/4.7/"4.6+ prefill removal"/"+30% tokenizer" intended as **real** Anthropic facts (verify + correct against official docs) or **fictional placeholders** (keep but clearly label as hypothetical)? *(Blocks Phases 1–3.)*
2. **Runtime:** Standardize on `bun`, or restore `npm` compatibility? *(Assumption: `bun`, given `bun.lock`.)*
3. **Blueprint source of truth:** Is there a canonical CCDV-F exam-guide URL, or do we derive domains from official Anthropic docs + the study notes?
4. **Scope of 10/10:** Target content volume and whether a full exam simulator + adaptive engine are in scope.

---

## 12. Recommended next phase (H)

**Phase 01 — Official blueprint + provenance**, preceded by a **source-verification sweep** (using the `source-verification` skill), because every later phase depends on a trustworthy blueprint and accurate content. Treat it as a Kiro Spec (requirements → design → tasks).

### Exact files to inspect / change in Phase 01

- **Verify / correct content:** `content/topics/05-model-selection.mdx`, `06-prompt-caching.mdx`, `07-token-counting.mdx`, `08-vision.mdx`, `10-agent-loop.mdx`, `11-model-migration.mdx`; `content/quiz.json` (q1–q4).
- **New artifact:** `content/blueprint.ts` (domains → stable skill IDs) + a provenance/evidence type.
- **Extend schema:** `src/lib/content-types.ts` (add `skillIds`, `difficulty`, `cognitiveLevel`, `objective`, `evidence[]`, `verifiedOn`), then thread through `content/topics.index.ts`, `content/flashcards.json`, `content/quiz.json`.
- **Validation:** new `scripts/validate-content.mjs` + `package.json` `validate:content`; extend `tests/content.test.ts`.
- **Governance to honor:** `.kiro/steering/content-quality.md`, `exam-integrity.md`; `.kiro/skills/source-verification/SKILL.md`, `blueprint-audit/SKILL.md`; `docs/phases/01-blueprint.md`.

---

## 13. Definition of done — 10/10 target (J)

- Every factual claim has an authoritative source URL + verification date, or is explicitly `needs-review`; no invented Anthropic behavior; zero fabricated model names/specs.
- A structured blueprint exists; every topic/flashcard/question maps to a stable skill ID; a coverage matrix shows no orphan content and no unassessed skills.
- Content schema enforces skill mapping, difficulty, cognitive level, objective, and evidence; `validate:content` + `typecheck` + tests + build all gate in CI and pass.
- Learner loop works end-to-end: diagnose → plan → learn → practice → review → simulate → readiness (no pass-probability guarantees).
- WCAG 2.2 AA verified through interaction tests (keyboard, focus, announcements), not just markup.
- Performance budgets hold; bundle stays lean.
- Docs let a new contributor build, validate, and add sourced content confidently.

---

**Baseline complete.** Verification is green (tests, typecheck, lint, build). The one code change was the `typecheck` script. The top blocker for feature work is resolving the model-facts question (§11.1) before Phase 01 content work begins.
