import { describe, it, expect } from "vitest";
import type { Blueprint } from "@content/blueprint";
import { blueprint } from "@content/blueprint";
import type { Flashcard, QuizQuestion, Topic } from "@/lib/content-types";
import {
  allSkillIds,
  validateBlueprint,
  validateContentMappings,
  coverageMatrix,
} from "@/lib/blueprint";

/** A minimal valid blueprint for isolated structural tests. */
function makeBlueprint(overrides?: Partial<Blueprint>): Blueprint {
  return {
    examCode: "CCDV-F",
    version: "1.0",
    effective: "2026-07",
    format: { items: 53, minutes: 120, scaleMin: 100, scaleMax: 1000, cutScore: 720 },
    source: { source: "test", url: "https://example.com", verifiedOn: "2026-09-09" },
    domains: [
      {
        id: "d-a",
        code: "DA",
        title: "A",
        weight: 60,
        skills: [{ id: "da-1", title: "A1", domainId: "d-a" }],
      },
      {
        id: "d-b",
        code: "DB",
        title: "B",
        weight: 40,
        skills: [{ id: "db-1", title: "B1", domainId: "d-b" }],
      },
    ],
    ...overrides,
  };
}

describe("validateBlueprint (structural)", () => {
  it("accepts a well-formed blueprint", () => {
    expect(validateBlueprint(makeBlueprint())).toEqual([]);
  });

  it("flags duplicate domain ids", () => {
    const bp = makeBlueprint();
    bp.domains[1].id = "d-a";
    expect(validateBlueprint(bp).some((e) => e.includes("duplicate domain id"))).toBe(true);
  });

  it("flags duplicate skill ids", () => {
    const bp = makeBlueprint();
    bp.domains[1].skills[0].id = "da-1";
    expect(validateBlueprint(bp).some((e) => e.includes("duplicate skill id"))).toBe(true);
  });

  it("flags a skill whose domainId does not match its domain", () => {
    const bp = makeBlueprint();
    bp.domains[0].skills[0].domainId = "d-b";
    expect(validateBlueprint(bp).some((e) => e.includes("declares domainId"))).toBe(true);
  });

  it("flags an empty domain", () => {
    const bp = makeBlueprint();
    bp.domains[0].skills = [];
    expect(validateBlueprint(bp).some((e) => e.includes("no skills"))).toBe(true);
  });

  it("flags weights that do not sum to ~100", () => {
    const bp = makeBlueprint();
    bp.domains[0].weight = 10; // 10 + 40 = 50
    expect(validateBlueprint(bp).some((e) => e.includes("sum to"))).toBe(true);
  });
});

describe("the real CCDV-F blueprint", () => {
  it("is structurally valid", () => {
    expect(validateBlueprint(blueprint)).toEqual([]);
  });

  it("has all 8 official domains", () => {
    expect(blueprint.domains.length).toBe(8);
  });

  it("weights sum to ~100%", () => {
    const sum = blueprint.domains.reduce((n, d) => n + d.weight, 0);
    expect(Math.abs(sum - 100)).toBeLessThanOrEqual(0.5);
  });
});

describe("validateContentMappings", () => {
  const bp = makeBlueprint();
  const topic = (id: string, skillIds?: string[]): Topic => ({
    id,
    slug: id,
    title: id,
    summary: "",
    domain: "Applications & Integration",
    file: `${id}.mdx`,
    source: "CCDV-F Study Notes.md",
    order: 1,
    skillIds,
  });
  const card = (id: string, skillIds?: string[]): Flashcard => ({
    id,
    topicId: "t",
    question: "q",
    answer: "a",
    skillIds,
  });
  const question = (id: string, skillIds?: string[]): QuizQuestion => ({
    id,
    question: "q",
    options: [{ id: "a", text: "a" }, { id: "b", text: "b" }],
    correctIds: ["a"],
    explanations: { a: "", b: "" },
    skillIds,
  });

  it("passes when every unit maps to a real skill", () => {
    const res = validateContentMappings({
      bp,
      topics: [topic("t1", ["da-1"])],
      flashcards: [card("c1", ["da-1"])],
      quiz: [question("q1", ["db-1"])],
    });
    expect(res.errors).toEqual([]);
  });

  it("errors on a dangling skillId", () => {
    const res = validateContentMappings({
      bp,
      topics: [topic("t1", ["nope"])],
      flashcards: [],
      quiz: [],
    });
    expect(res.errors.some((e) => e.includes("unknown skillId"))).toBe(true);
  });

  it("errors on a unit with no skillIds", () => {
    const res = validateContentMappings({
      bp,
      topics: [topic("t1")],
      flashcards: [],
      quiz: [],
    });
    expect(res.errors.some((e) => e.includes("has no skillIds"))).toBe(true);
  });

  it("warns about skills with no learning content and no assessment", () => {
    const res = validateContentMappings({
      bp,
      topics: [topic("t1", ["da-1"])],
      flashcards: [],
      quiz: [],
    });
    // db-1 has neither learning content nor assessment.
    expect(res.warnings.some((w) => w.includes("no learning content") && w.includes("db-1"))).toBe(true);
    expect(res.warnings.some((w) => w.includes("no assessment") && w.includes("db-1"))).toBe(true);
  });
});

describe("coverageMatrix", () => {
  it("counts topics, flashcards, and questions per skill", () => {
    const bp = makeBlueprint();
    const matrix = coverageMatrix({
      bp,
      topics: [
        { id: "t1", slug: "t1", title: "", summary: "", domain: "Applications & Integration", file: "t1.mdx", source: "CCDV-F Study Notes.md", order: 1, skillIds: ["da-1"] },
      ],
      flashcards: [{ id: "c1", topicId: "t", question: "q", answer: "a", skillIds: ["da-1"] }],
      quiz: [],
    });
    const da1 = matrix.find((m) => m.skillId === "da-1")!;
    expect(da1.topics).toBe(1);
    expect(da1.flashcards).toBe(1);
    expect(da1.questions).toBe(0);
  });
});
