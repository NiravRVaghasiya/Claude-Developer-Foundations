# Mock Exams & Diagnostic

> These mock exams are delivered by the platform's **seeded, blueprint-weighted
> exam simulator** (`/exam`) rather than as static answer keys — that keeps every
> mock aligned to the official domain weights, prevents you from memorizing a fixed
> order, and reuses the same scoring engine the diagnostic uses. This page explains
> how to run three full, distinct mocks plus a shorter diagnostic, and how each maps
> back to objectives.

## Why simulator-delivered, not static

The exam engine (`src/lib/exam.ts`) assembles each exam by:

1. Mapping every question in the 163-item bank to its blueprint domain.
2. Allocating the 53 item slots across **all 8 domains by official weight**
   (largest-remainder), capped by availability — so a mock mirrors the real exam's
   D2 33.1% / D5 16.8% / … distribution.
3. Ordering questions and (optionally) options with a **seed**, so the *same seed
   reproduces the exact same exam* and a *different seed produces a distinct one*.

Correctness is **never revealed mid-exam** (mirroring real conditions); you get a
full per-domain, per-skill breakdown and every option's explanation **after** you
submit. Scoring for multiple-response items is **all-or-nothing** — your selected
set must exactly equal the correct set.

## The three mock exams

Run each as a **full-length, timed** sitting (53 items, ~120 minutes). Use these
distinct seeds so each mock draws a different blueprint-weighted sample:

| Mock | How to run | Seed |
|---|---|---|
| **Mock Exam 1** | `/exam` → start with seed below | `ccdv-mock-1` |
| **Mock Exam 2** | `/exam` → new seed | `ccdv-mock-2` |
| **Mock Exam 3** | `/exam` → new seed | `ccdv-mock-3` |

Each mock:
- Covers **all 8 domains** in official proportion (full blueprint distribution).
- Contains realistic distractors and scenario/"best answer"/"what first" styles.
- Provides **explanations for every option** after submission.
- Maps each question to its **skill(s)** so the results screen shows exactly which
  objectives to revisit.

> The pool is large enough (163 questions, weighted D2=53, D5=27, D1=24, D6=18,
> D8=17, D7=13, D3=6, D4=5) that the three seeds produce substantially different
> exams while each stays blueprint-accurate. Content validation hard-fails if the
> pool ever drops below a full 53-item weighted allocation, so a full-length mock is
> always assemblable.

## Diagnostic (shorter)

Before you study, run the **diagnostic** (`/diagnostic`). It is a shorter,
coverage-oriented set that produces:

- a **readiness index** (0–100, weight-renormalized over assessed domains — this is
  *not* a pass probability),
- ranked **weak skills**, and
- **recommended topics** to read next.

Feed those results into [`STUDY-PLAN.md`](../STUDY-PLAN.md); the `/plan` page turns
them into a prioritized daily queue (weight × weakness).

## How to review a mock (the part that actually moves your score)

1. **Every miss:** read the correct answer's explanation *and* why your chosen
   distractor was wrong — the distractor rationale is where the learning is.
2. **Tag the pattern:** was it API mechanics, an architecture choice, a security
   boundary, a layer-isolation call? Cross-reference
   [`what-the-exam-is-really-testing.md`](what-the-exam-is-really-testing.md).
3. **Update readiness:** adjust your [`READINESS-CHECKLIST.md`](../READINESS-CHECKLIST.md)
   scores for the affected objectives.
4. **Re-drill:** use flashcards for the weak skill, then re-take that domain's quiz.

## Practice vs. official scoring

- The simulator reports a **percent-correct** practice threshold (default 72%),
  clearly labeled practice-only.
- The **real** exam is criterion-referenced on a **scaled 100–1000** score with a
  **cut of 720**; per-domain percentages are informational.
- No mock here predicts your real result. See [`SOURCES.md`](../SOURCES.md).

> Questions are **original practice items**. None reproduce or reconstruct real exam
> questions, and none are claimed to have appeared on the exam.
