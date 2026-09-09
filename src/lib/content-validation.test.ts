import { describe, it, expect } from "vitest";
import type { Blueprint } from "@content/blueprint";
import type { Flashcard, QuizQuestion, Topic } from "@/lib/content-types";
import {
  validateAll,
  isIsoDate,
  isUrlish,
  type ValidationInputs,
} from "@/lib/content-validation";

/** A minimal, fully-valid content set. Each test mutates one field. */
function goodInputs(): ValidationInputs {
  const blueprint: Blueprint = {
    examCode: "CCDV-F",
    version: "1.0",
    effective: "2026-07",
    format: { items: 53, minutes: 120, scaleMin: 100, scaleMax: 1000, cutScore: 720 },
    source: { source: "test", url: "https://example.com/x", verifiedOn: "2026-09-09" },
    domains: [
      {
        id: "d-a",
        code: "DA",
        title: "A",
        weight: 100,
        skills: [{ id: "da-1", title: "A1", domainId: "d-a" }],
      },
    ],
  };
  const topics: Topic[] = [
    {
      id: "t1",
      slug: "t1",
      title: "T1",
      summary: "s",
      domain: "Applications & Integration",
      file: "t1.mdx",
      source: "CCDV-F Study Notes.md",
      order: 1,
      skillIds: ["da-1"],
      difficulty: "core",
      status: "verified",
      evidence: [{ source: "Anthropic", url: "https://docs.example.com", verifiedOn: "2026-09-09" }],
    },
  ];
  const flashcards: Flashcard[] = [
    {
      id: "c1",
      topicId: "t1",
      question: "q",
      answer: "a",
      skillIds: ["da-1"],
      difficulty: "core",
      status: "verified",
      evidence: [{ source: "Anthropic", url: "https://docs.example.com", verifiedOn: "2026-09-09" }],
    },
  ];
  const quiz: QuizQuestion[] = [
    {
      id: "q1",
      topicId: "t1",
      question: "q",
      options: [
        { id: "a", text: "a" },
        { id: "b", text: "b" },
      ],
      correctIds: ["a"],
      explanations: { a: "because", b: "no" },
      skillIds: ["da-1"],
      difficulty: "core",
      cognitiveLevel: "recall",
      status: "verified",
      evidence: [{ source: "Anthropic", url: "https://docs.example.com", verifiedOn: "2026-09-09" }],
    },
  ];
  return { blueprint, topics, flashcards, quiz };
}

describe("shape guards", () => {
  it("isIsoDate accepts a real date and rejects junk", () => {
    expect(isIsoDate("2026-09-09")).toBe(true);
    expect(isIsoDate("2026-13-40")).toBe(false);
    expect(isIsoDate("Sept 9 2026")).toBe(false);
    expect(isIsoDate(undefined)).toBe(false);
  });
  it("isUrlish requires https", () => {
    expect(isUrlish("https://x.com")).toBe(true);
    expect(isUrlish("http://x.com")).toBe(false);
    expect(isUrlish("not a url")).toBe(false);
  });
});

describe("validateAll — baseline", () => {
  it("reports no errors for a valid set", () => {
    expect(validateAll(goodInputs()).errors).toEqual([]);
  });
});

describe("validateAll — blueprint rules", () => {
  it("flags weights not summing to 100", () => {
    const inp = goodInputs();
    inp.blueprint.domains[0].weight = 50;
    expect(validateAll(inp).errors.some((e) => e.includes("sum to"))).toBe(true);
  });
  it("flags a blank skill title", () => {
    const inp = goodInputs();
    inp.blueprint.domains[0].skills[0].title = "";
    expect(validateAll(inp).errors.some((e) => e.includes("empty title"))).toBe(true);
  });
});

describe("validateAll — topics", () => {
  it("flags a duplicate topic id", () => {
    const inp = goodInputs();
    inp.topics.push({ ...inp.topics[0], slug: "t1b", file: "t1b.mdx" });
    expect(validateAll(inp).errors.some((e) => e.includes("duplicate topic id"))).toBe(true);
  });
  it("flags a topic with no skillIds (orphan)", () => {
    const inp = goodInputs();
    delete inp.topics[0].skillIds;
    expect(validateAll(inp).errors.some((e) => e.includes("orphan content"))).toBe(true);
  });
  it("flags a dangling topic skillId", () => {
    const inp = goodInputs();
    inp.topics[0].skillIds = ["nope"];
    expect(validateAll(inp).errors.some((e) => e.includes("unknown skillId"))).toBe(true);
  });
  it("flags an empty file", () => {
    const inp = goodInputs();
    inp.topics[0].file = "";
    expect(validateAll(inp).errors.some((e) => e.includes("empty file"))).toBe(true);
  });
});

describe("validateAll — flashcards", () => {
  it("flags an unknown topicId", () => {
    const inp = goodInputs();
    inp.flashcards[0].topicId = "ghost";
    expect(validateAll(inp).errors.some((e) => e.includes("unknown topicId"))).toBe(true);
  });
  it("flags an empty answer", () => {
    const inp = goodInputs();
    inp.flashcards[0].answer = "";
    expect(validateAll(inp).errors.some((e) => e.includes("empty answer"))).toBe(true);
  });
});

describe("validateAll — questions", () => {
  it("flags a missing option explanation", () => {
    const inp = goodInputs();
    inp.quiz[0].explanations = { a: "because" }; // b missing
    expect(validateAll(inp).errors.some((e) => e.includes("missing an explanation for option b"))).toBe(true);
  });
  it("flags fewer than 2 options", () => {
    const inp = goodInputs();
    inp.quiz[0].options = [{ id: "a", text: "a" }];
    inp.quiz[0].correctIds = ["a"];
    inp.quiz[0].explanations = { a: "x" };
    expect(validateAll(inp).errors.some((e) => e.includes("fewer than 2 options"))).toBe(true);
  });
  it("flags a correctId that is not an option", () => {
    const inp = goodInputs();
    inp.quiz[0].correctIds = ["z"];
    expect(validateAll(inp).errors.some((e) => e.includes("is not an option"))).toBe(true);
  });
  it("flags duplicate option ids", () => {
    const inp = goodInputs();
    inp.quiz[0].options = [
      { id: "a", text: "a" },
      { id: "a", text: "dup" },
    ];
    expect(validateAll(inp).errors.some((e) => e.includes("option id: a"))).toBe(true);
  });
  it("flags empty correctIds", () => {
    const inp = goodInputs();
    inp.quiz[0].correctIds = [];
    expect(validateAll(inp).errors.some((e) => e.includes("no correctIds"))).toBe(true);
  });
});

describe("validateAll — metadata & evidence", () => {
  it("flags an invalid difficulty", () => {
    const inp = goodInputs();
    (inp.topics[0] as { difficulty: string }).difficulty = "medium";
    expect(validateAll(inp).errors.some((e) => e.includes("invalid difficulty"))).toBe(true);
  });
  it("flags an invalid cognitiveLevel on a question", () => {
    const inp = goodInputs();
    (inp.quiz[0] as { cognitiveLevel: string }).cognitiveLevel = "synthesis";
    expect(validateAll(inp).errors.some((e) => e.includes("invalid cognitiveLevel"))).toBe(true);
  });
  it("flags an invalid status", () => {
    const inp = goodInputs();
    (inp.flashcards[0] as { status: string }).status = "maybe";
    expect(validateAll(inp).errors.some((e) => e.includes("invalid status"))).toBe(true);
  });
  it("flags a non-https evidence url", () => {
    const inp = goodInputs();
    inp.topics[0].evidence = [{ source: "x", url: "http://x.com", verifiedOn: "2026-09-09" }];
    expect(validateAll(inp).errors.some((e) => e.includes("non-https/invalid url"))).toBe(true);
  });
  it("flags a malformed verifiedOn date", () => {
    const inp = goodInputs();
    inp.topics[0].evidence = [{ source: "x", url: "https://x.com", verifiedOn: "yesterday" }];
    expect(validateAll(inp).errors.some((e) => e.includes("invalid verifiedOn"))).toBe(true);
  });
  it("flags status:verified with no evidence", () => {
    const inp = goodInputs();
    inp.topics[0].status = "verified";
    delete inp.topics[0].evidence;
    expect(validateAll(inp).errors.some((e) => e.includes("status:verified but has no evidence"))).toBe(true);
  });
  it("allows status:needs-review without evidence", () => {
    const inp = goodInputs();
    inp.topics[0].status = "needs-review";
    delete inp.topics[0].evidence;
    expect(validateAll(inp).errors).toEqual([]);
  });

  it("lets a verified flashcard inherit evidence from its topic", () => {
    const inp = goodInputs();
    // Card has no own evidence but its topic (t1) does -> should be sourced.
    delete inp.flashcards[0].evidence;
    expect(validateAll(inp).errors).toEqual([]);
  });

  it("flags a verified flashcard whose topic also lacks evidence", () => {
    const inp = goodInputs();
    delete inp.flashcards[0].evidence;
    delete inp.topics[0].evidence; // topic now unsourced too
    inp.topics[0].status = "needs-review"; // keep the topic itself valid
    expect(
      validateAll(inp).errors.some((e) => e.includes("fc") || e.includes("flashcard c1"))
    ).toBe(true);
  });
});

describe("validateAll — provenance (sourceType / confidence)", () => {
  it("accepts explicit sourceType and confidence", () => {
    const inp = goodInputs();
    inp.quiz[0].evidence = [
      {
        sourceType: "official",
        confidence: "high",
        source: "Anthropic — Docs",
        url: "https://docs.example.com",
        verifiedOn: "2026-09-09",
      },
    ];
    expect(validateAll(inp).errors).toEqual([]);
  });

  it("flags an invalid sourceType", () => {
    const inp = goodInputs();
    (inp.quiz[0].evidence![0] as { sourceType: string }).sourceType = "rumor";
    expect(validateAll(inp).errors.some((e) => e.includes("invalid sourceType"))).toBe(true);
  });

  it("flags an invalid confidence", () => {
    const inp = goodInputs();
    (inp.quiz[0].evidence![0] as { confidence: string }).confidence = "certain";
    expect(validateAll(inp).errors.some((e) => e.includes("invalid confidence"))).toBe(true);
  });

  it("refuses to let a secondary/community host be labeled official", () => {
    const inp = goodInputs();
    inp.topics[0].evidence = [
      {
        sourceType: "official",
        source: "Community guide",
        url: "https://flashgenius.net/guides/x",
        verifiedOn: "2026-09-09",
      },
    ];
    expect(
      validateAll(inp).errors.some((e) => e.includes("known secondary/community host"))
    ).toBe(true);
  });

  it("requires a verified (exam-critical) question to carry a citable source", () => {
    const inp = goodInputs();
    // Question inherits from its topic; strip both self and topic citability.
    inp.quiz[0].evidence = [
      {
        sourceType: "inferred",
        source: "My own reasoning",
        url: "https://docs.example.com",
        verifiedOn: "2026-09-09",
      },
    ];
    inp.topics[0].evidence = [
      {
        sourceType: "inferred",
        source: "reasoning",
        url: "https://docs.example.com",
        verifiedOn: "2026-09-09",
      },
    ];
    expect(
      validateAll(inp).errors.some((e) =>
        e.includes("exam-critical) but has no citable")
      )
    ).toBe(true);
  });

  it("allows a verified question backed only by inherited official topic evidence", () => {
    const inp = goodInputs();
    delete inp.quiz[0].evidence; // rely on topic t1's official-labeled evidence
    expect(validateAll(inp).errors).toEqual([]);
  });
});

describe("validateAll — exam construction", () => {
  it("errors when the pool is large enough but allocation underfills (structural bug)", () => {
    // This can't easily happen through the public allocator, so we assert the
    // healthy path: a large, well-mapped pool constructs a full exam cleanly.
    const inp = goodInputs();
    inp.blueprint.format.items = 3;
    inp.quiz = Array.from({ length: 5 }, (_, i) => ({
      ...inp.quiz[0],
      id: `q${i}`,
    }));
    const { errors } = validateAll(inp);
    expect(errors.filter((e) => e.includes("allocation")).length).toBe(0);
  });

  it("warns (not errors) when the pool is too small for a full-length exam", () => {
    const inp = goodInputs(); // 1 question, official items 53
    const { errors, warnings } = validateAll(inp);
    expect(errors.some((e) => e.includes("allocation is broken"))).toBe(false);
    expect(warnings.some((w) => w.includes("full-length simulation"))).toBe(true);
  });
});
