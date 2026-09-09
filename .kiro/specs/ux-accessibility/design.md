# Phase 07 — UX & Accessibility: Design

## Changes by file

### `src/app/globals.css`
- Add `:focus-visible` ring (2px brand outline + offset) applied to interactive elements.
- Add `@media (prefers-reduced-motion: reduce)`:
  - `html { scroll-behavior: auto; }`
  - a global rule cutting `transition`/`animation` durations to ~0 and disabling `scroll-behavior`.
- Add `.sr-only` utility + `.sr-only:focus`/skip-link reveal styles (Tailwind has `sr-only`, but the skip link needs a focus-reveal variant — use utility classes on the element instead).

### `src/app/layout.tsx`
- Render a **skip link** (`<a href="#main" class="skip-link">Skip to content</a>`) as the first body child.
- Keep `AppShell` wrapping children; the `<main>` (in AppShell) gets `id="main"` and `tabIndex={-1}`.

### `src/components/AppShell.tsx`
- `<main id="main" tabIndex={-1}>`.
- Drawer: a small `useEffect`-based focus manager:
  - on open: remember `document.activeElement`, focus the drawer's first focusable node.
  - `keydown`: Escape → close; Tab/Shift+Tab → wrap focus within the drawer (trap).
  - on close: restore focus to the hamburger button (ref).
- Hamburger button gets a ref for focus restore.

### `src/components/SearchBox.tsx`
- Remove sole reliance on `outline-none` (focus-visible ring covers it; keep border emphasis).
- Add a visually-hidden polite live region announcing "N results for '…'" / "No results".
- Add listbox/option roles: results container `role="listbox"`, each result link wrapped/annotated with `role="option"`. Keep it minimal (no full arrow-key combobox this phase; documented as follow-up) — announcement + semantics are the AA-relevant wins.

### Results focus + reduced-motion scroll (shared helper)
- Add `src/lib/a11y.ts`:
  - `prefersReducedMotion(): boolean` (guards `window.matchMedia`).
  - `scrollToTop()` using `behavior: prefersReducedMotion() ? "auto" : "smooth"`.
- `QuizRunner`, `DiagnosticRunner`, `ExamRunner`: on submit, focus the results
  heading (add `tabIndex={-1}` + a ref, `.focus()` in an effect/callback) and use
  `scrollToTop()` instead of the inline smooth scroll.

### `src/components/ExamRunner.tsx`
- Add a polite live region; announce remaining time when it first crosses
  thresholds (300s, 60s, 30s) — track the last announced threshold to avoid
  repeats/per-second chatter. Keep the visible `role="timer"` display.

## Testing
- `AppShell.test.tsx` (new): drawer opens → focus moves in; Escape closes → focus
  returns to toggle; Tab wraps (focus trap).
- `SearchBox.test.tsx`: assert the live region announces a result count.
- Extend results tests where cheap: results heading is focused after submit
  (Quiz/Diagnostic/Exam) — assert the heading has focus or `tabindex=-1` target exists.
- Skip link: layout is a server component; assert presence via a small render where
  feasible, else rely on the AppShell/globals changes (documented).

## Decisions / tradeoffs
- **Focus-visible over focus**: avoids rings on mouse click, shows them on keyboard —
  the AA-correct behavior.
- **Minimal ARIA**: use native semantics; add listbox/option only where it improves
  the search experience; do NOT build a full combobox keyboard model this phase
  (documented follow-up) to keep the change reviewable and low-risk.
- **Shared `a11y.ts` helper** keeps reduced-motion logic DRY across runners.
- **Threshold-based timer announcements** avoid a live region that would otherwise
  read every second (which would be worse than silence).

## Non-goals
- No visual redesign; no new content. No dependency added.
- Full arrow-key search combobox navigation (follow-up).
- Automated a11y conformance claim — manual AT testing remains required.
