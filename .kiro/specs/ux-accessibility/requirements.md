# Phase 07 — UX & Accessibility: Requirements

## Introduction

Bring the platform's core flows to **WCAG 2.2 AA**: keyboard operability, focus
management/visibility, semantic structure/landmarks, status announcements,
reduced-motion support, and mobile usability. The learning model is now correct
(Phases 01–06), so UI can be hardened without churn.

## Audit summary (severity → issue → fix)

| Sev | Issue (current) | Fix |
|---|---|---|
| High | No skip link; `<main>` has no id — keyboard users tab through the whole sidebar every page. | Add a skip-to-content link + `id="main"` focus target. |
| High | No global `:focus-visible` ring; search input uses `outline-none`. | Global focus-visible outline; remove reliance on `outline-none`. |
| High | `scroll-behavior: smooth` + `transition` everywhere, no motion-preference guard. | `@media (prefers-reduced-motion: reduce)` disables smooth scroll + transitions; guard programmatic `scrollTo`. |
| High | Mobile drawer sets `role=dialog aria-modal` but has no focus trap, Escape, initial focus, or focus restore. | Trap focus, close on Escape, focus first item on open, restore to trigger on close. |
| Medium | Search results not announced; no result-count live region. | Polite live region announcing result count; listbox/option semantics. |
| Medium | Quiz/diagnostic/exam submit doesn't move focus to results. | Focus the results heading on submit (respecting reduced motion for scroll). |
| Medium | Exam timer updates silently; no accessible time warnings. | Polite live-region announcements at time thresholds (e.g. 5 min, 1 min). |

## Requirements

### Requirement 1 — Keyboard operability & skip navigation
1. WHEN a page loads THEN a visible-on-focus "Skip to content" link SHALL be the first focusable element and SHALL move focus to the main content.
2. WHEN interactive controls are used THEN all SHALL be reachable and operable by keyboard (existing buttons/links/inputs remain native).

### Requirement 2 — Focus visibility
1. WHEN any element receives keyboard focus THEN a clearly visible focus indicator SHALL be shown (`:focus-visible`), meeting AA visibility.
2. WHEN the search input is focused THEN it SHALL show a visible focus indicator (no reliance on `outline-none` alone).

### Requirement 3 — Reduced motion
1. WHEN the user prefers reduced motion THEN smooth scrolling and non-essential transitions/animations SHALL be disabled or near-instant.
2. WHEN code scrolls programmatically THEN it SHALL use `auto` behavior under reduced-motion preference.

### Requirement 4 — Dialog (mobile drawer)
1. WHEN the mobile nav drawer opens THEN focus SHALL move into it and be **trapped** until it closes.
2. WHEN Escape is pressed OR the backdrop is activated THEN the drawer SHALL close and focus SHALL return to the toggle button.

### Requirement 5 — Status announcements & results focus
1. WHEN a quiz/diagnostic/exam is submitted THEN focus SHALL move to the results heading so screen-reader users are taken to the outcome.
2. WHEN the exam timer crosses a warning threshold THEN a polite live region SHALL announce the remaining time (without per-second chatter).

### Requirement 6 — Semantics & landmarks
1. WHEN pages render THEN there SHALL be appropriate landmarks (`main`, `nav`) and a single logical heading order (existing `h1`/`h2` structure preserved/verified).

### Requirement 7 — No regression
1. WHEN Phase 07 completes THEN `validate:content`, `typecheck`, `lint`, `test`, and `build` SHALL all pass, and existing behavior SHALL be unchanged aside from the accessibility improvements.
2. Automated checks are necessary but not sufficient: full WCAG 2.2 AA conformance also requires manual testing with assistive technologies and expert review (noted as a follow-up).
