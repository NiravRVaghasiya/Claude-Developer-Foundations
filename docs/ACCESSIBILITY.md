# Accessibility — WCAG 2.2 AA Verification Plan

> **Status:** Automated checks and interaction tests pass. This document is the
> **manual verification gate** that must be completed before the project makes a
> public **WCAG 2.2 Level AA conformance claim**. Until every "Required for AA
> claim" item below is checked and dated, the product may only state that it was
> **built toward** WCAG 2.2 AA (as the README/CHANGELOG currently do).

The accessibility contract lives in [`.kiro/steering/accessibility.md`](../.kiro/steering/accessibility.md).
This plan operationalizes it into a repeatable checklist.

---

## What is already implemented (verified by tests)

These are covered by component/interaction tests and the shared helpers in
[`src/lib/a11y.ts`](../src/lib/a11y.ts); they are the baseline the manual pass builds on:

- **Skip link** to a focusable `<main>`.
- **Visible focus** via `:focus-visible` ring (`src/app/globals.css`).
- **Reduced motion** — `prefersReducedMotion()` gates smooth-scroll/animation.
- **Mobile drawer** — focus trap, `Escape` to close, focus restore on close.
- **Search** — accessible name + result-count live region.
- **Live announcements** — results-focus and exam time announcements.

Automated coverage is necessary but **not sufficient** for AA: automated tooling
detects roughly 30–40% of WCAG issues. The items below require a human.

---

## Test matrix

Run the full checklist against each primary surface, at **two viewports**
(desktop ≥1280px and mobile ≤390px) and in **both themes** (light/dark):

| Surface | Route |
|---|---|
| Dashboard | `/` |
| Topic list | `/topics` |
| Topic page (MDX, callouts, reveal) | `/topics/[slug]` |
| Flashcards | `/flashcards` |
| Quiz | `/quiz` |
| Diagnostic | `/diagnostic` |
| Study plan | `/plan` |
| Exam simulator | `/exam` |

---

## 1. Keyboard-only (Required for AA)

Unplug the mouse. For every surface:

- [ ] All interactive elements are reachable with `Tab` / `Shift+Tab` in a logical order.
- [ ] The **skip link** is the first focusable element and jumps to `main`.
- [ ] No **keyboard trap** — focus can always move on (WCAG 2.1.2).
- [ ] Buttons/links activate with `Enter` / `Space` as expected.
- [ ] Flashcard flip, quiz option select/submit, and exam navigation/flag all work by keyboard.
- [ ] Mobile drawer: opens, traps focus while open, closes on `Escape`, and **restores focus** to the trigger (WCAG 2.4.3).
- [ ] Focus is **always visible** and never obscured by sticky headers/footers (WCAG 2.4.11/2.4.12 — new in 2.2).
- [ ] No functionality requires a drag gesture without a single-pointer alternative (WCAG 2.5.7 — new in 2.2).

## 2. Screen reader (Required for AA)

Test with **NVDA + Firefox** (Windows), **VoiceOver + Safari** (macOS/iOS), and spot-check **TalkBack** (Android):

- [ ] Page has a descriptive, unique `<title>` and a single `<h1>`; heading levels don't skip (WCAG 1.3.1, 2.4.6).
- [ ] Landmarks (`main`, `nav`) are announced; skip link works with the SR virtual cursor.
- [ ] All controls have an **accessible name** (buttons, links, search input, theme toggle) (WCAG 4.1.2).
- [ ] **Live regions** announce: search result counts, quiz/diagnostic scoring, and the exam timer / time-remaining warnings — without spamming (WCAG 4.1.3).
- [ ] Reveal-answer / callout content is announced when expanded; expanded/collapsed state is conveyed.
- [ ] Quiz "select all that apply" is announced as multi-select; correct/incorrect and per-option explanations are readable after submit.
- [ ] Images/icons are either described or correctly hidden as decorative (WCAG 1.1.1).

## 3. Contrast & visual (Required for AA)

- [ ] Text contrast ≥ **4.5:1** (normal) / **3:1** (large) in **both** themes (WCAG 1.4.3).
- [ ] UI component & focus-indicator contrast ≥ **3:1** (WCAG 1.4.11).
- [ ] Trap/tip/pattern/note **callouts** don't rely on color alone — they carry a text label/icon (WCAG 1.4.1).
- [ ] Correct/incorrect quiz states are distinguishable without color (icon/text, not just red/green).
- [ ] Reflow at **400% zoom** / 320 CSS px with no loss of content or horizontal scroll (WCAG 1.4.10).
- [ ] Text spacing override (line-height 1.5, etc.) doesn't clip content (WCAG 1.4.12).

## 4. Motion, timing & input

- [ ] With OS "reduce motion" on, smooth-scroll and transitions are suppressed (WCAG 2.3.3).
- [ ] **Exam timer:** the timed simulation is the one place with a time limit — verify the countdown is announced, a warning precedes timeout, and autosave/resume means a timeout never loses work. Document this as a deliberate, exam-integrity time limit (WCAG 2.2.1 exception rationale).
- [ ] Target size ≥ **24×24 px** (or adequate spacing) for touch controls (WCAG 2.5.8 — new in 2.2).
- [ ] No **redundant re-entry** of information within a flow (WCAG 3.3.7 — new in 2.2).

## 5. Forms & errors

- [ ] Any input with a validation state has a programmatic label and error text (WCAG 3.3.1/3.3.2).
- [ ] Focus moves to (or announces) the first error on invalid submit.

---

## Tooling (supporting, not sufficient)

Run as a pre-screen before the manual pass; **zero critical violations** is a
prerequisite, not proof of conformance:

- [ ] **axe DevTools** / `@axe-core` on every route (both themes).
- [ ] **Lighthouse** accessibility audit ≥ 95 on a deployed build.
- [ ] Consider adding `@axe-core/playwright` to a future E2E suite (Browser E2E is
      currently deferred — see `docs/FINAL_AUDIT.md`).

---

## Sign-off

A WCAG 2.2 AA conformance claim may be published **only** after all "Required for
AA" sections are checked, on the versions and dates recorded below.

| Item | Tester | Date | Result / notes |
|---|---|---|---|
| Keyboard-only pass | | | |
| Screen reader (NVDA) | | | |
| Screen reader (VoiceOver) | | | |
| Contrast (light + dark) | | | |
| Reflow / zoom / spacing | | | |
| Motion & timing | | | |
| axe / Lighthouse pre-screen | | | |

**Conformance decision:** ☐ Claim AA ☐ Claim "built toward AA" — _reviewer:_ ______  _date:_ ______

> Record the app version, commit SHA, and the AT + browser versions used, so the
> claim is reproducible and can be re-validated when the UI changes.
