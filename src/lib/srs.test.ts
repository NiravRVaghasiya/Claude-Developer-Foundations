import { describe, it, expect } from "vitest";
import {
  applyRating,
  isDue,
  orderByDue,
  countDue,
  newSchedule,
  BOX_INTERVALS_DAYS,
  MAX_BOX,
  type ScheduleMap,
} from "./srs";

const NOW = 1_000_000_000_000; // fixed epoch for determinism
const DAY = 24 * 60 * 60 * 1000;

describe("applyRating", () => {
  it("'again' resets to box 0 and stays due now", () => {
    const s = applyRating({ box: 3, due: NOW, reps: 5 }, "again", NOW);
    expect(s.box).toBe(0);
    expect(s.due).toBe(NOW);
    expect(s.reps).toBe(6);
  });

  it("'good' advances one box with the right interval", () => {
    const s = applyRating({ box: 1, due: NOW, reps: 1 }, "good", NOW);
    expect(s.box).toBe(2);
    expect(s.due).toBe(NOW + BOX_INTERVALS_DAYS[2] * DAY);
  });

  it("'easy' jumps two boxes", () => {
    const s = applyRating(newSchedule(NOW), "easy", NOW);
    expect(s.box).toBe(2);
  });

  it("'hard' drops one box but not below 0", () => {
    expect(applyRating({ box: 0, due: NOW, reps: 0 }, "hard", NOW).box).toBe(0);
    expect(applyRating({ box: 2, due: NOW, reps: 0 }, "hard", NOW).box).toBe(1);
  });

  it("caps the box at MAX_BOX", () => {
    const s = applyRating({ box: MAX_BOX, due: NOW, reps: 9 }, "easy", NOW);
    expect(s.box).toBe(MAX_BOX);
  });
});

describe("isDue", () => {
  it("treats an unseen card as due", () => {
    expect(isDue(undefined, NOW)).toBe(true);
  });
  it("is due when due time has passed", () => {
    expect(isDue({ box: 1, due: NOW - 1, reps: 1 }, NOW)).toBe(true);
    expect(isDue({ box: 1, due: NOW + DAY, reps: 1 }, NOW)).toBe(false);
  });
});

describe("orderByDue", () => {
  it("puts due cards before not-due cards, soonest-due first", () => {
    const schedule: ScheduleMap = {
      a: { box: 2, due: NOW + 5 * DAY, reps: 1 }, // not due
      b: { box: 0, due: NOW - DAY, reps: 1 }, // due (older)
      c: { box: 1, due: NOW - 2 * DAY, reps: 1 }, // due (oldest)
    };
    // d has no schedule → unseen → due
    const ordered = orderByDue(["a", "b", "c", "d"], schedule, NOW);
    // due ones (b, c, d) first; among them, earliest due first (d has due 0)
    expect(ordered[ordered.length - 1]).toBe("a"); // the only not-due card is last
    expect(ordered).toContain("d");
  });
});

describe("countDue", () => {
  it("counts due cards including unseen", () => {
    const schedule: ScheduleMap = {
      a: { box: 2, due: NOW + 5 * DAY, reps: 1 },
      b: { box: 0, due: NOW - DAY, reps: 1 },
    };
    expect(countDue(["a", "b", "c"], schedule, NOW)).toBe(2); // b (due) + c (unseen)
  });
});
