import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  getAllTopics,
  getTopicBySlug,
  getAllTopicSlugs,
  getAdjacentTopics,
  getTopicsByDomain,
} from "@/lib/content";
import { isMultiResponse } from "@/lib/content-types";
import type { Flashcard, QuizQuestion } from "@/lib/content-types";
import { blueprint } from "@content/blueprint";
import { allSkillIds, validateContentMappings } from "@/lib/blueprint";
import { validateAll } from "@/lib/content-validation";
import flashcards from "@content/flashcards.json";
import quiz from "@content/quiz.json";

const cards = flashcards as Flashcard[];
const questions = quiz as QuizQuestion[];

describe("topic loader", () => {
  it("returns topics sorted by order", () => {
    const all = getAllTopics();
    expect(all.length).toBeGreaterThan(0);
    const orders = all.map((t) => t.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it("has unique topic ids and slugs", () => {
    const all = getAllTopics();
    const ids = new Set(all.map((t) => t.id));
    const slugs = new Set(all.map((t) => t.slug));
    expect(ids.size).toBe(all.length);
    expect(slugs.size).toBe(all.length);
  });

  it("looks up a topic by slug", () => {
    const t = getTopicBySlug("messages-api");
    expect(t).toBeDefined();
    expect(t?.title).toMatch(/Messages API/);
  });

  it("computes adjacent topics", () => {
    const slugs = getAllTopicSlugs();
    const { prev, next } = getAdjacentTopics(slugs[1]);
    expect(prev?.slug).toBe(slugs[0]);
    expect(next?.slug).toBe(slugs[2]);
    // first topic has no prev
    expect(getAdjacentTopics(slugs[0]).prev).toBeUndefined();
  });

  it("groups topics by domain without dropping any", () => {
    const grouped = getTopicsByDomain();
    const total = grouped.reduce((n, g) => n + g.topics.length, 0);
    expect(total).toBe(getAllTopics().length);
  });

  it("every indexed topic has a matching MDX file on disk", () => {
    for (const t of getAllTopics()) {
      const path = resolve(__dirname, "..", "content", "topics", t.file);
      expect(existsSync(path), `missing MDX file: ${t.file}`).toBe(true);
    }
  });
});

describe("flashcards.json integrity", () => {
  const topicIds = new Set(getAllTopics().map((t) => t.id));

  it("has unique flashcard ids", () => {
    const ids = new Set(cards.map((c) => c.id));
    expect(ids.size).toBe(cards.length);
  });

  it("every flashcard references a valid topic and has Q/A", () => {
    for (const c of cards) {
      expect(topicIds.has(c.topicId), `bad topicId: ${c.topicId}`).toBe(true);
      expect(c.question.length).toBeGreaterThan(0);
      expect(c.answer.length).toBeGreaterThan(0);
    }
  });
});

describe("quiz.json integrity", () => {
  const topicIds = new Set(getAllTopics().map((t) => t.id));

  it("has unique question ids", () => {
    const ids = new Set(questions.map((q) => q.id));
    expect(ids.size).toBe(questions.length);
  });

  it("each question is well-formed", () => {
    for (const q of questions) {
      // options non-empty and uniquely identified
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      const optIds = q.options.map((o) => o.id);
      expect(new Set(optIds).size).toBe(optIds.length);

      // correctIds reference real options and are non-empty
      expect(q.correctIds.length).toBeGreaterThanOrEqual(1);
      for (const cid of q.correctIds) {
        expect(optIds.includes(cid), `bad correctId ${cid} in ${q.id}`).toBe(
          true
        );
      }

      // every option has an explanation
      for (const oid of optIds) {
        expect(
          typeof q.explanations[oid] === "string" &&
            q.explanations[oid].length > 0,
          `missing explanation for ${q.id}.${oid}`
        ).toBe(true);
      }

      // optional topic association must be valid when present
      if (q.topicId) {
        expect(topicIds.has(q.topicId), `bad quiz topicId: ${q.topicId}`).toBe(
          true
        );
      }
    }
  });

  it("classifies single vs multi response", () => {
    for (const q of questions) {
      expect(isMultiResponse(q)).toBe(q.correctIds.length > 1);
    }
  });
});

describe("blueprint mapping integrity", () => {
  it("every topic maps to at least one real blueprint skill", () => {
    const valid = allSkillIds(blueprint);
    for (const t of getAllTopics()) {
      expect((t.skillIds ?? []).length, `topic ${t.id} has no skillIds`).toBeGreaterThan(0);
      for (const id of t.skillIds ?? []) {
        expect(valid.has(id), `topic ${t.id} bad skillId ${id}`).toBe(true);
      }
    }
  });

  it("every flashcard and question maps to real blueprint skills", () => {
    const valid = allSkillIds(blueprint);
    for (const c of cards) {
      expect((c.skillIds ?? []).length, `card ${c.id} has no skillIds`).toBeGreaterThan(0);
      for (const id of c.skillIds ?? []) {
        expect(valid.has(id), `card ${c.id} bad skillId ${id}`).toBe(true);
      }
    }
    for (const q of questions) {
      expect((q.skillIds ?? []).length, `question ${q.id} has no skillIds`).toBeGreaterThan(0);
      for (const id of q.skillIds ?? []) {
        expect(valid.has(id), `question ${q.id} bad skillId ${id}`).toBe(true);
      }
    }
  });

  it("has no dangling references or unmapped units (validateContentMappings)", () => {
    const { errors } = validateContentMappings({
      bp: blueprint,
      topics: getAllTopics(),
      flashcards: cards,
      quiz: questions,
    });
    expect(errors).toEqual([]);
  });
});

describe("strict content validation (validateAll)", () => {
  it("the real content set has zero validation errors", () => {
    const { errors } = validateAll({
      blueprint,
      topics: getAllTopics(),
      flashcards: cards,
      quiz: questions,
    });
    // Surface the actual errors in the assertion message if any appear.
    expect(errors, errors.join("\n")).toEqual([]);
  });
});
