# Phase 05 — Adaptive Learning: Design

## Architecture

Two pure engines + a thin client, reusing existing state. SRS is read-only here.

```
src/lib/mastery.ts          # pure: per-skill explainable mastery
src/lib/mastery.test.ts
src/lib/study-plan.ts       # pure: prioritized daily plan (uses mastery + SRS + weight)
src/lib/study-plan.test.ts
src/components/StudyPlan.tsx # client: renders plan + mastery with reasons
src/components/StudyPlan.test.tsx
src/app/plan/page.tsx       # server route: loads blueprint/topics/flashcards
```

Reads: diagnostic `SkillScore[]` (from `diagnostic.ts` run over saved answers or
the latest attempt's per-skill data), flashcard `ScheduleMap` + `FlashcardMarks`
(existing storage), `blueprint`, topics, flashcards. No new persistence key
required (mastery/plan are derived on the fly from existing state).

## Mastery model (`mastery.ts`) — explainable & deterministic

For each blueprint skill we gather **evidence**:
- `assessment`: correct/total across questions mapped to the skill (from diagnostic scoring).
- `cards`: the flashcards mapped to the skill, each with its SRS `CardSchedule` (box/reps/due) and mark.
- `now`: passed in (determinism).

### Factors (each 0..1, with a reason string)

1. **Accuracy** (weight 0.45) — `correct/total` on assessments. Reason names the ratio. If no assessment, factor is omitted and confidence drops.
2. **SRS strength** (weight 0.30) — mean of each card's `box / MAX_BOX` (reuses `srs.ts` `MAX_BOX`). Higher boxes = stronger retention. Reason names avg box.
3. **Recency** (weight 0.10) — decays with time since the most recent evidence (assessment time or card due-derived last-seen). Fresh = 1.0, older decays toward a floor. Reason: "reviewed recently" / "not reviewed in a while". `now` passed in.
4. **Difficulty bonus** (weight 0.15) — success on `advanced`/`core` content counts more than on `intro`. Computed as accuracy weighted by the difficulty of the items answered. Reason notes when harder items were handled well (or that only easy items were seen).

Score = round(100 × Σ(weightᵢ × factorᵢ) / Σ(active weightᵢ)) — only **active**
factors (those with evidence) are included, then renormalized, so a skill with
only assessment data isn't dragged down by "no SRS" — it's just less confident.

### Confidence & exposure
- `exposure` = number of distinct evidence items (questions answered + cards seen).
- `confidence`: `low` (<2), `medium` (<5), `high` (≥5). Shown alongside the score.
- **No data** → level `unknown`, score `null`, confidence `low`, reason "No practice yet".

### Levels (bands)
`unknown` (no data) · `beginning` (<40) · `developing` (<60) · `proficient` (<80) · `mastered` (≥80). Bands are study signals, not exam predictions.

### Types
```ts
export type MasteryLevel = "unknown"|"beginning"|"developing"|"proficient"|"mastered";
export interface MasteryFactor { key: string; value: number; weight: number; reason: string; }
export interface SkillMastery {
  skillId: string; title: string; domainId: string;
  score: number | null; level: MasteryLevel;
  confidence: "low"|"medium"|"high"; exposure: number;
  factors: MasteryFactor[]; reasons: string[];
}
export function computeSkillMastery(input): SkillMastery;
export function computeAllMastery(input): SkillMastery[];
```

## Study plan (`study-plan.ts`) — prioritized & explainable

Inputs: `SkillMastery[]`, per-skill **overdue card count** (from `srs.ts`
`countDue` over the skill's cards), blueprint (weights), topics (for links),
`now`.

### Priority score (higher = study sooner)
`priority = wGap·(1 - masteryFraction) + wOverdue·overdueSignal + wWeight·examWeightNorm`
- `masteryFraction` = score/100 (unknown treated as 0 → studied early, with reason "not practiced yet").
- `overdueSignal` = min(1, overdueCount / 5) (cap so a huge backlog doesn't dominate).
- `examWeightNorm` = domain weight / maxDomainWeight.
- Weights: gap 0.55, overdue 0.30, examWeight 0.15. Constants documented.

### Item action selection
- If mastery is unknown/low AND a topic teaches the skill → **read topic** action.
- If the skill has due cards → **drill N due cards** action.
- If both → the item lists both actions (primary = whichever the reason emphasizes: overdue cards if any are due, else read).
- If neither content exists → item notes "content pending" (no crash).

### Ordering & cap
Sort by `priority` desc; tie-break: higher exam weight, then lower mastery, then
skillId asc (deterministic). Cap to `PLAN_SIZE = 6` items. Skills already
`mastered` with no due cards are excluded (nothing to do). If the plan is empty →
return an explicit "all caught up" state.

### Types
```ts
export type PlanAction = { kind: "read"; topicSlug: string; topicTitle: string }
                       | { kind: "drill"; dueCount: number };
export interface PlanItem {
  skillId: string; title: string; domainId: string;
  priority: number; mastery: SkillMastery; actions: PlanAction[]; reason: string;
}
export interface StudyPlan { items: PlanItem[]; allCaughtUp: boolean; }
export function buildStudyPlan(input): StudyPlan;
```

## UI (`StudyPlan.tsx`, client) + `/plan` route
- Server route loads `blueprint`, `getAllTopics()`, `flashcards.json`; client
  reads SRS schedule + marks + latest diagnostic from storage, computes mastery +
  plan, renders:
  - "Today's plan" list: each item shows priority rank, the skill, actions (links
    to `/topics/[slug]` or `/flashcards`), and the reason.
  - "Skill mastery" list: score, level, confidence, and expandable factor reasons.
  - Empty state when all caught up.
- Accessibility: semantic lists/headings, links, progressbar for mastery.
- Nav: add "Study Plan" to sidebar; add a dashboard entry point.

## Decisions / tradeoffs
- **Renormalized active-factor weighting** so partial evidence yields a fair score
  with honest confidence, instead of penalizing missing signals.
- **`now` injected** everywhere for deterministic tests (no real clock in engines).
- **SRS untouched**: mastery/plan read `CardSchedule`/`countDue`; scheduling stays
  exactly as-is (requirement + steering).
- **No new storage key**: derived state; avoids migration and stays DRY.
- **Diagnostic linkage**: the plan uses the latest saved diagnostic's per-skill
  scores when present; when absent, mastery relies on SRS/marks + any quiz data and
  says confidence is low.

## Non-goals
- No change to SRS intervals/box logic. No exam simulator (Phase 06). No backend.
- No auto-generation of new questions/cards (content backlog is separate).
