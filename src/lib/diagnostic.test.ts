import { describe, it, expect } from "vitest";
import type { Blueprint } from "@content/blueprint";
import type { QuizQuestion, Topic } from "@/lib/content-types";
import {
  scoreBySkill,
  scoreByDomain,
  summarizeTiming,
  computeReadiness,
  rankWeaknesses,
  recommendTopics,
  runDiagnostic,
  type AnsweredQuestion,
} from "@/lib/diagnostic";

/** Two-domain blueprint: D-A (weight 80) with a1/a2; D-B (weight 20) with b1. */
function bp(): Blueprint {
  return {
    examCode: "CCDV-F",
    version: "1.0",
    effective: "2026-07",
    format: { items: 10, minutes: 30, scaleMin: 100, scaleMax: 1000, cutScore: 720 },
    source: { source: "t", url: "https://x", verifiedOn: "2026-09-09" },
    domains: [
      {
        id: "d-a",
        code: "DA",
        title: "A",
        weight: 80,
        skills: [
          { id: "a1", title: "A1", domainId: "d-a" },
          { id: "a2", title: "A2", domainId: "d-a" },
        ],
      },
      {
        id: "d-b",
        code: "DB",
        title: "B",
        weight: 20,
        skills: [{ id: "b1", title: "B1", domainId: "d-b" }],
      },
    ],
  };
}

function q(id: string, skillIds: string[], correctIds = ["a"]): QuizQuestion {
  return {
    id,
    question: id,
    options: [
      { id: "a", text: "a" },
      { id: "b", text: "b" },
    ],
    correctIds,
    explanations: { a: "", b: "" },
    skillIds,
  };
}

describe("scoreBySkill", () => {
  const questions = [q("q1", ["a1"]), q("q2", ["a2"]), q("q3", ["b1"])];

  it("scores per skill from answers", () => {
    const answers = new Map([
      ["q1", ["a"]], // correct
      ["q2", ["b"]], // wrong
      ["q3", ["a"]], // correct
    ]);
    const s = scoreBySkill(questions, answers, bp());
    const a1 = s.find((x) => x.skillId === "a1")!;
    const a2 = s.find((x) => x.skillId === "a2")!;
    const b1 = s.find((x) => x.skillId === "b1")!;
    expect(a1).toMatchObject({ correct: 1, total: 1, pct: 100 });
    expect(a2).toMatchObject({ correct: 0, total: 1, pct: 0 });
    expect(b1).toMatchObject({ correct: 1, total: 1, pct: 100 });
  });

  it("counts a multi-skill question toward each skill", () => {
    const qs = [q("qx", ["a1", "b1"])];
    const s = scoreBySkill(qs, new Map([["qx", ["a"]]]), bp());
    expect(s.find((x) => x.skillId === "a1")!.correct).toBe(1);
    expect(s.find((x) => x.skillId === "b1")!.correct).toBe(1);
  });

  it("reports unassessed skills as null pct, not 0", () => {
    const s = scoreBySkill(questions, new Map([["q1", ["a"]]]), bp());
    expect(s.find((x) => x.skillId === "a2")!.pct).toBeNull();
    expect(s.find((x) => x.skillId === "a2")!.total).toBe(0);
  });

  it("uses exact-match scoring for multi-response", () => {
    const qs = [q("qm", ["a1"], ["a", "b"])];
    const partial = scoreBySkill(qs, new Map([["qm", ["a"]]]), bp());
    expect(partial.find((x) => x.skillId === "a1")!.correct).toBe(0); // under-selected
    const full = scoreBySkill(qs, new Map([["qm", ["a", "b"]]]), bp());
    expect(full.find((x) => x.skillId === "a1")!.correct).toBe(1);
  });
});

describe("scoreByDomain", () => {
  it("aggregates a domain's skills", () => {
    const questions = [q("q1", ["a1"]), q("q2", ["a2"]), q("q3", ["b1"])];
    const answers = new Map([
      ["q1", ["a"]],
      ["q2", ["a"]],
      ["q3", ["b"]],
    ]);
    const domains = scoreByDomain(scoreBySkill(questions, answers, bp()), bp());
    const dA = domains.find((d) => d.domainId === "d-a")!;
    expect(dA).toMatchObject({ correct: 2, total: 2, pct: 100 });
    expect(domains.find((d) => d.domainId === "d-b")!).toMatchObject({
      correct: 0,
      total: 1,
      pct: 0,
    });
  });
});

describe("summarizeTiming", () => {
  it("sums and averages elapsed times", () => {
    const answers: AnsweredQuestion[] = [
      { questionId: "q1", selected: ["a"], elapsedMs: 1000 },
      { questionId: "q2", selected: ["a"], elapsedMs: 3000 },
    ];
    expect(summarizeTiming(answers)).toEqual({ totalMs: 4000, answered: 2, avgMs: 2000 });
  });
  it("treats missing timings as 0 and never throws", () => {
    const answers: AnsweredQuestion[] = [
      { questionId: "q1", selected: ["a"] },
      { questionId: "q2", selected: ["a"], elapsedMs: 2000 },
    ];
    expect(summarizeTiming(answers)).toEqual({ totalMs: 2000, answered: 2, avgMs: 1000 });
  });
  it("returns null avg for no answers", () => {
    expect(summarizeTiming([])).toEqual({ totalMs: 0, answered: 0, avgMs: null });
  });
});

describe("computeReadiness", () => {
  it("is weight-renormalized over assessed domains and never claims pass probability", () => {
    // D-A 100% (weight 80), D-B 0% (weight 20) => (80*100 + 20*0)/100 = 80
    const domains = scoreByDomain(
      scoreBySkill(
        [q("q1", ["a1"]), q("q3", ["b1"])],
        new Map([
          ["q1", ["a"]], // A correct
          ["q3", ["b"]], // B wrong
        ]),
        bp()
      ),
      bp()
    );
    const r = computeReadiness(domains);
    expect(r.index).toBe(80);
    expect(r.band).toBe("solid");
    expect(r.disclaimer.toLowerCase()).toContain("not a prediction");
  });

  it("renormalizes when only one domain is assessed", () => {
    // Only D-B assessed at 100% => index 100 despite its 20 weight.
    const domains = scoreByDomain(
      scoreBySkill([q("q3", ["b1"])], new Map([["q3", ["a"]]]), bp()),
      bp()
    );
    const r = computeReadiness(domains);
    expect(r.index).toBe(100);
    expect(r.band).toBe("strong");
  });

  it("returns unavailable when nothing is assessed", () => {
    const domains = scoreByDomain(scoreBySkill([], new Map(), bp()), bp());
    const r = computeReadiness(domains);
    expect(r.index).toBeNull();
    expect(r.band).toBe("unavailable");
  });

  it("keeps the index within 0–100", () => {
    const domains = scoreByDomain(
      scoreBySkill(
        [q("q1", ["a1"]), q("q3", ["b1"])],
        new Map([
          ["q1", ["b"]],
          ["q3", ["b"]],
        ]),
        bp()
      ),
      bp()
    );
    const r = computeReadiness(domains);
    expect(r.index).toBe(0);
    expect(r.band).toBe("low");
  });
});

describe("rankWeaknesses", () => {
  it("orders weakest first with deterministic tie-breaking", () => {
    const questions = [q("q1", ["a1"]), q("q2", ["a2"]), q("q3", ["b1"])];
    // a1 0%, a2 0%, b1 100%. a1/a2 tie on pct; same domain weight; skillId asc => a1 before a2.
    const answers = new Map([
      ["q1", ["b"]],
      ["q2", ["b"]],
      ["q3", ["a"]],
    ]);
    const ranked = rankWeaknesses(scoreBySkill(questions, answers, bp()), bp());
    expect(ranked.map((s) => s.skillId)).toEqual(["a1", "a2", "b1"]);
  });

  it("excludes unassessed skills", () => {
    const ranked = rankWeaknesses(
      scoreBySkill([q("q1", ["a1"])], new Map([["q1", ["b"]]]), bp()),
      bp()
    );
    expect(ranked.every((s) => s.total > 0)).toBe(true);
  });
});

describe("recommendTopics", () => {
  const topics: Topic[] = [
    {
      id: "t-a1",
      slug: "t-a1",
      title: "Teaches A1",
      summary: "",
      domain: "Applications & Integration",
      file: "t-a1.mdx",
      source: "CCDV-F Study Notes.md",
      order: 1,
      skillIds: ["a1"],
    },
  ];

  it("maps a weak skill to its teaching topics", () => {
    const recs = recommendTopics(
      [{ skillId: "a1", title: "A1", domainId: "d-a", correct: 0, total: 1, pct: 0 }],
      topics
    );
    expect(recs[0].topicSlugs).toEqual(["t-a1"]);
    expect(recs[0].note).toBeUndefined();
  });

  it("notes when a skill has no topic", () => {
    const recs = recommendTopics(
      [{ skillId: "b1", title: "B1", domainId: "d-b", correct: 0, total: 1, pct: 0 }],
      topics
    );
    expect(recs[0].topicSlugs).toEqual([]);
    expect(recs[0].note).toMatch(/no study topic/i);
  });
});

describe("runDiagnostic (integration)", () => {
  it("produces a full result and limits recommendations", () => {
    const questions = [q("q1", ["a1"]), q("q2", ["a2"]), q("q3", ["b1"])];
    const answers: AnsweredQuestion[] = [
      { questionId: "q1", selected: ["a"], elapsedMs: 1000 },
      { questionId: "q2", selected: ["b"], elapsedMs: 2000 },
      { questionId: "q3", selected: ["b"], elapsedMs: 3000 },
    ];
    const result = runDiagnostic({
      questions,
      answers,
      blueprint: bp(),
      topics: [],
      recommendCount: 2,
    });
    expect(result.correct).toBe(1);
    expect(result.total).toBe(3);
    expect(result.timing.totalMs).toBe(6000);
    expect(result.readiness.index).not.toBeNull();
    expect(result.recommendations.length).toBeLessThanOrEqual(2);
    expect(result.weaknesses[0].pct).toBeLessThanOrEqual(
      result.weaknesses[result.weaknesses.length - 1].pct as number
    );
  });
});
