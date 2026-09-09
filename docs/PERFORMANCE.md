# Performance Audit

> Measured from the production `next build` and the repository. Format per the
> performance-audit skill: **metric · baseline · issue · recommendation · impact**.
> Date: 2026-09-09. Runtime: Bun. Next.js 15 App Router.

## Summary

The app is lean and performs well. It's a statically prerendered App Router site
with small client "islands," build-time MDX + search indexing, and no runtime
backend. **No high-impact issues found.** Recommendations below are optional and
low-risk.

## Route sizes (production build)

| Route | Page size | First Load JS |
|---|---|---|
| `/` (dashboard) | 2.46 kB | 108 kB |
| `/diagnostic` | 2.8 kB | 112 kB |
| `/exam` | 4.95 kB | 114 kB |
| `/flashcards` | 3.13 kB | 106 kB |
| `/plan` | 5.7 kB | 112 kB |
| `/quiz` | 2.56 kB | 105 kB |
| `/topics` | 162 B | 106 kB |
| `/topics/[slug]` (×17, SSG) | 1.28 kB | 107 kB |
| **Shared by all** | — | **103 kB** |

All 27 pages prerender at build time (Static / SSG). The shared bundle is ~103 kB
and has stayed flat across Phases 04–08 even as the diagnostic, plan, and exam
engines were added — because those engines are imported only by their route's
client island, not the shared chunk.

## Findings

### 1. Client/server boundary
- **Metric:** client components (`"use client"`). **Baseline:** 13.
- **Issue:** none — each is genuinely interactive. Route **pages are all Server
  Components** (data loading + metadata); interactivity is isolated to islands:
  `AppShell`, `Sidebar` (uses `usePathname`), `ThemeProvider/ThemeToggle`,
  `Dashboard`, `FlashcardDeck`, `QuizRunner`, `DiagnosticRunner`, `StudyPlan`,
  `ExamRunner`, `SearchBox`, `TopicViewTracker`, `RevealAnswer`. The `Callout` MDX
  component is a Server Component.
- **Recommendation:** keep this discipline; add `"use client"` only for real state/effects.
- **Impact:** maintains the small shared bundle.

### 2. Bundle size
- **Metric:** First Load JS. **Baseline:** 103 kB shared; routes 105–114 kB.
- **Issue:** none material. Two shared chunks (~46 kB + ~54 kB) are the React/Next
  runtime baseline.
- **Recommendation:** no action. If the exam/plan islands grow, consider
  `next/dynamic` for the heaviest results views — not needed at current sizes.
- **Impact:** n/a (preventative note).

### 3. Hydration cost
- **Metric:** hydration surface. **Baseline:** small islands; SSR-safe storage hook
  with a `hydrated` gate; `suppressHydrationWarning` on `<html>`; `mounted` gate in
  `ThemeToggle`.
- **Issue:** none — no hydration mismatches; content-heavy topic pages hydrate only
  the tiny `RevealAnswer`/`TopicViewTracker` islands.
- **Recommendation:** none.
- **Impact:** low TTI on reading pages.

### 4. Search
- **Metric:** index size + runtime. **Baseline:** `content/search-index.json` ≈
  **60 kB** (17 topics, generated at build by `scripts/build-search-index.mjs`),
  Fuse.js index built once in the client via `useMemo`.
- **Issue:** the 60 kB index is bundled into the `SearchBox` island (it's `import`ed).
  Fine at this size.
- **Recommendation:** if the corpus grows large (hundreds of topics), consider
  lazy-loading the index (fetch on first focus) or trimming indexed `body` length.
- **Impact:** would keep `SearchBox` light as content scales; unnecessary now.

### 5. MDX rendering
- **Metric:** where MDX compiles. **Baseline:** **build-time** via `@next/mdx`
  (`remark-gfm`, `rehype-slug`, `rehype-pretty-code` + Shiki). Syntax highlighting
  is applied at build; **no client-side highlighter ships**.
- **Issue:** none.
- **Recommendation:** none.
- **Impact:** topic pages are static HTML + minimal JS.

### 6. Persistence
- **Metric:** localStorage access pattern. **Baseline:** centralized `useLocalStorage`
  + `STORAGE_KEYS`; JSON serialize on write; cross-instance/tab sync via a custom
  event + the native `storage` event; all reads/writes try/catch-guarded.
- **Issue:** none — access is O(feature), values are small (marks/schedule/history
  are capped or bounded).
- **Recommendation:** the diagnostic history is capped (20) and the exam session is
  a single record; keep new persisted structures bounded.
- **Impact:** avoids unbounded storage growth.

### 7. Re-renders
- **Metric:** expensive recomputation. **Baseline:** mastery/plan/diagnostic derive
  via `useMemo`; scoring engines are pure and cheap over the current pool sizes.
- **Issue:** none at current scale.
- **Recommendation:** none.
- **Impact:** n/a.

## Fix applied during this audit
- Removed a `react-hooks/exhaustive-deps` warning in `AppShell` (Phase 07 drawer
  effect) by capturing the toggle ref inside the effect for cleanup. Lint is clean.

## Follow-ups (optional)
- Lazy-load the search index if the topic corpus grows large.
- Consider `next/dynamic` for the exam/plan results views only if those islands grow.
- Real-device Lighthouse/field metrics (LCP/CLS/INP) require a deployed environment;
  recommended before a production launch to confirm these static-analysis findings.
