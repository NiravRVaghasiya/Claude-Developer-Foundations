/**
 * A lightweight Leitner-style spaced-repetition scheduler.
 *
 * Each card has a `box` (0..MAX) and a `due` timestamp (ms). Higher boxes wait
 * longer between reviews. Ratings move a card up or down the boxes:
 *   - "again" → reset to box 0 (see it very soon)
 *   - "hard"  → stay / drop one box, short interval
 *   - "good"  → advance one box
 *   - "easy"  → jump two boxes
 *
 * Intervals are in days, keyed by box index. All state is plain JSON so it
 * persists cleanly in localStorage.
 */

export type Rating = "again" | "hard" | "good" | "easy";

export interface CardSchedule {
  /** Leitner box index (0 = new/relearning). */
  box: number;
  /** Next-due timestamp in epoch ms. */
  due: number;
  /** Number of times this card has been reviewed. */
  reps: number;
}

export type ScheduleMap = Record<string, CardSchedule>;

/** Interval (in days) a card waits after landing in each box. */
export const BOX_INTERVALS_DAYS = [0, 1, 3, 7, 16, 35];
export const MAX_BOX = BOX_INTERVALS_DAYS.length - 1;

const DAY_MS = 24 * 60 * 60 * 1000;

function clampBox(box: number): number {
  return Math.max(0, Math.min(MAX_BOX, box));
}

/** The default schedule for a never-seen card (due immediately). */
export function newSchedule(now = Date.now()): CardSchedule {
  return { box: 0, due: now, reps: 0 };
}

/** Apply a rating to a card's schedule, returning the next schedule. */
export function applyRating(
  prev: CardSchedule | undefined,
  rating: Rating,
  now = Date.now()
): CardSchedule {
  const current = prev ?? newSchedule(now);
  let box = current.box;

  switch (rating) {
    case "again":
      box = 0;
      break;
    case "hard":
      box = clampBox(box - 1);
      break;
    case "good":
      box = clampBox(box + 1);
      break;
    case "easy":
      box = clampBox(box + 2);
      break;
  }

  const intervalDays = BOX_INTERVALS_DAYS[box];
  // "again" should resurface within the same session, so keep it due now.
  const due = rating === "again" ? now : now + intervalDays * DAY_MS;

  return { box, due, reps: current.reps + 1 };
}

/** True when a card is due for review at `now`. Unseen cards are always due. */
export function isDue(
  schedule: CardSchedule | undefined,
  now = Date.now()
): boolean {
  if (!schedule) return true;
  return schedule.due <= now;
}

/**
 * Order card ids for a study session: due cards first (soonest due first),
 * then not-yet-due cards by their due date. Ties keep the input order.
 */
export function orderByDue(
  ids: string[],
  schedule: ScheduleMap,
  now = Date.now()
): string[] {
  return [...ids].sort((a, b) => {
    const sa = schedule[a];
    const sb = schedule[b];
    const dueA = isDue(sa, now);
    const dueB = isDue(sb, now);
    if (dueA !== dueB) return dueA ? -1 : 1; // due cards first
    const da = sa?.due ?? 0;
    const db = sb?.due ?? 0;
    return da - db; // then by soonest due
  });
}

/** Count how many of the given card ids are due now. */
export function countDue(
  ids: string[],
  schedule: ScheduleMap,
  now = Date.now()
): number {
  return ids.filter((id) => isDue(schedule[id], now)).length;
}
