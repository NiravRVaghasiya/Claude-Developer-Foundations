# Phase 07 — UX & Accessibility: Tasks

- [x] 1. Author this spec (requirements/design/tasks) with the audited issues by severity.
  - _Requirements: all_

- [x] 2. `globals.css`: `:focus-visible` ring + `prefers-reduced-motion` (disable smooth scroll & transitions) + skip-link styles.
  - _Requirements: R2, R3_

- [x] 3. Skip link + landmarks: skip link in `layout.tsx`; `<main id="main" tabIndex={-1}>` in `AppShell`.
  - _Requirements: R1, R6_

- [x] 4. Mobile drawer: focus trap, Escape close, initial focus, focus restore to toggle; `aria-expanded` on toggle; `aria-label` on dialog (AppShell).
  - _Requirements: R4_

- [x] 5. Accessible search: removed `outline-none`, added `role=combobox`/`aria-expanded`/`aria-controls`, `role=listbox`/`option`, and a polite result-count live region (SearchBox).
  - _Requirements: R2.2, R5_

- [x] 6. `src/lib/a11y.ts` (prefersReducedMotion, scrollToTop); results-heading focus + reduced-motion scroll in QuizRunner/DiagnosticRunner/ExamRunner; ExamRunner threshold-based time announcements (5m/1m/30s).
  - _Requirements: R3.2, R5_

- [x] 7. Tests: `AppShell.test.tsx` (main landmark, drawer focus-in/Escape/restore, aria-expanded), SearchBox (combobox/listbox + live-region announcement), QuizRunner (results-heading focus).
  - _Requirements: R1, R4, R5_

- [x] 8. Run `validate:content`, `typecheck`, `lint`, `test`, `build`; all green.
  - _Requirements: R7_

## Result

- Global: `:focus-visible` ring (keyboard-only), `prefers-reduced-motion` disables
  smooth scroll + near-zeroes transitions/animations, skip-link styling.
- Skip-to-content link (first focusable) → focusable `<main id="main">`.
- Mobile drawer is now a real modal dialog: focus moves in, Tab is trapped,
  Escape/backdrop close it, and focus returns to the toggle (which reports
  `aria-expanded`).
- Search: visible focus, combobox+listbox/option semantics, and a polite live
  region announcing the result count.
- Quiz/Diagnostic/Exam results move focus to the results heading on submit and
  scroll respecting reduced-motion (via shared `a11y.ts`). Exam announces time at
  5-minute / 1-minute / 30-second thresholds without per-second chatter.

### Gates (all green)
- `validate:content`: pass. `typecheck`: clean. `lint`: clean.
- `test`: **188/188 across 24 files** (was 181/23).
- `build`: green, 28 pages; shared JS still 103 kB.

## Unresolved / follow-ups (manual-AT caveat)
- **Automated checks are necessary but not sufficient.** Full WCAG 2.2 AA
  conformance still requires manual testing with real assistive technologies
  (screen readers: NVDA/VoiceOver), keyboard-only walkthroughs, and expert review —
  and a color-contrast pass on the brand palette in both themes. Recommended before
  any conformance claim.
- Search is not yet a full arrow-key combobox (results are reachable via Tab); a
  complete keyboard combobox model is a follow-up.
- Reduced-motion + focus-visible are verified by build/CSS + interaction tests, but
  visual focus-ring contrast should be confirmed manually.
