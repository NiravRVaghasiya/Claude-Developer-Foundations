import type { Blueprint } from "@content/blueprint";
import type {
  Evidence,
  Flashcard,
  QuizQuestion,
  Topic,
} from "@/lib/content-types";
import {
  allSkillIds,
  validateBlueprint,
  validateContentMappings,
} from "@/lib/blueprint";

/**
 * Strict, pure content validation for the whole content set. Runs in both the
 * Vitest suite (`tests/content.test.ts`) and the `validate:content` bun runner,
 * so one source of truth gates tests and CI. No I/O, no dependencies.
 */

export interface ValidationInputs {
  blueprint: Blueprint;
  topics: Topic[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

const DIFFICULTIES = new Set(["intro", "core", "advanced"]);
const COGNITIVE_LEVELS = new Set(["recall", "application", "analysis"]);
const STATUSES = new Set(["verified", "needs-review"]);

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/** Strict-enough ISO date guard (YYYY-MM-DD, real calendar date). */
export function isIsoDate(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

/** All content sources are official https docs; keep URL check dependency-free. */
export function isUrlish(v: unknown): v is string {
  return typeof v === "string" && /^https:\/\/[^\s]+$/.test(v);
}

/** Validate an evidence array for a unit; returns error strings. */
function checkEvidence(label: string, evidence: Evidence[] | undefined): string[] {
  const errors: string[] = [];
  if (!evidence) return errors;
  evidence.forEach((e, i) => {
    const at = `${label} evidence[${i}]`;
    if (!isNonEmptyString(e.source)) errors.push(`${at} has empty source`);
    if (!isUrlish(e.url)) errors.push(`${at} has non-https/invalid url: ${String(e.url)}`);
    if (!isIsoDate(e.verifiedOn)) errors.push(`${at} has invalid verifiedOn: ${String(e.verifiedOn)}`);
  });
  return errors;
}

/** Shared metadata checks (difficulty/cognitiveLevel/status/evidence + verified⇒evidence). */
function checkMetadata(
  label: string,
  unit: {
    difficulty?: string;
    cognitiveLevel?: string;
    status?: string;
    evidence?: Evidence[];
  },
  opts: { allowCognitive: boolean; evidenceInherited?: boolean }
): string[] {
  const errors: string[] = [];
  if (unit.difficulty !== undefined && !DIFFICULTIES.has(unit.difficulty)) {
    errors.push(`${label} has invalid difficulty: ${unit.difficulty}`);
  }
  if (unit.cognitiveLevel !== undefined) {
    if (!opts.allowCognitive) {
      errors.push(`${label} has cognitiveLevel but that field is not allowed here`);
    } else if (!COGNITIVE_LEVELS.has(unit.cognitiveLevel)) {
      errors.push(`${label} has invalid cognitiveLevel: ${unit.cognitiveLevel}`);
    }
  }
  if (unit.status !== undefined && !STATUSES.has(unit.status)) {
    errors.push(`${label} has invalid status: ${unit.status}`);
  }
  errors.push(...checkEvidence(label, unit.evidence));
  // Provenance rule: a "verified" unit must be sourced — either by carrying its
  // own evidence, or (for cards/questions) by inheriting it from its topic.
  const sourced = (unit.evidence?.length ?? 0) > 0 || opts.evidenceInherited === true;
  if (unit.status === "verified" && !sourced) {
    errors.push(`${label} is status:verified but has no evidence (self or inherited from topic)`);
  }
  return errors;
}

function checkDuplicateIds(kind: string, ids: string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) dupes.add(id);
    seen.add(id);
  }
  return [...dupes].map((id) => `duplicate ${kind} id: ${id}`);
}

function checkSkillIds(
  label: string,
  skillIds: string[] | undefined,
  valid: Set<string>
): string[] {
  const errors: string[] = [];
  const ids = skillIds ?? [];
  if (ids.length === 0) {
    errors.push(`${label} has no skillIds (orphan content)`);
  }
  for (const id of ids) {
    if (!valid.has(id)) errors.push(`${label} references unknown skillId: ${id}`);
  }
  return errors;
}

function checkTopics(topics: Topic[], validSkills: Set<string>): string[] {
  const errors: string[] = [];
  errors.push(...checkDuplicateIds("topic", topics.map((t) => t.id)));
  errors.push(...checkDuplicateIds("topic slug", topics.map((t) => t.slug)));
  errors.push(...checkDuplicateIds("topic file", topics.map((t) => t.file)));
  for (const t of topics) {
    const label = `topic ${t.id}`;
    if (!isNonEmptyString(t.title)) errors.push(`${label} has empty title`);
    if (!isNonEmptyString(t.slug)) errors.push(`${label} has empty slug`);
    if (!isNonEmptyString(t.file)) errors.push(`${label} has empty file`);
    errors.push(...checkSkillIds(label, t.skillIds, validSkills));
    errors.push(...checkMetadata(label, t, { allowCognitive: false }));
  }
  return errors;
}

function checkFlashcards(
  flashcards: Flashcard[],
  validSkills: Set<string>,
  topicsWithEvidence: Set<string>,
  topicIds: Set<string>
): string[] {
  const errors: string[] = [];
  errors.push(...checkDuplicateIds("flashcard", flashcards.map((c) => c.id)));
  for (const c of flashcards) {
    const label = `flashcard ${c.id}`;
    if (!isNonEmptyString(c.question)) errors.push(`${label} has empty question`);
    if (!isNonEmptyString(c.answer)) errors.push(`${label} has empty answer`);
    if (!topicIds.has(c.topicId)) errors.push(`${label} references unknown topicId: ${c.topicId}`);
    errors.push(...checkSkillIds(label, c.skillIds, validSkills));
    // A card inherits provenance from its parent topic; it's sourced if it
    // carries its own evidence OR its topic has evidence.
    const inherited = topicsWithEvidence.has(c.topicId);
    errors.push(
      ...checkMetadata(label, c, { allowCognitive: false, evidenceInherited: inherited })
    );
  }
  return errors;
}

function checkQuestions(
  quiz: QuizQuestion[],
  validSkills: Set<string>,
  topicsWithEvidence: Set<string>,
  topicIds: Set<string>
): string[] {
  const errors: string[] = [];
  errors.push(...checkDuplicateIds("question", quiz.map((q) => q.id)));
  for (const q of quiz) {
    const label = `question ${q.id}`;
    if (!isNonEmptyString(q.question)) errors.push(`${label} has empty question`);

    const optIds = q.options.map((o) => o.id);
    if (q.options.length < 2) errors.push(`${label} has fewer than 2 options`);
    errors.push(
      ...checkDuplicateIds(`${label} option`, optIds)
    );
    for (const o of q.options) {
      if (!isNonEmptyString(o.text)) errors.push(`${label} option ${o.id} has empty text`);
    }

    const optSet = new Set(optIds);
    if (q.correctIds.length === 0) errors.push(`${label} has no correctIds`);
    for (const cid of q.correctIds) {
      if (!optSet.has(cid)) errors.push(`${label} correctId ${cid} is not an option`);
    }

    // Every option must have a non-empty explanation.
    for (const id of optIds) {
      if (!isNonEmptyString(q.explanations?.[id])) {
        errors.push(`${label} is missing an explanation for option ${id}`);
      }
    }

    if (q.topicId !== undefined && !topicIds.has(q.topicId)) {
      errors.push(`${label} references unknown topicId: ${q.topicId}`);
    }
    errors.push(...checkSkillIds(label, q.skillIds, validSkills));
    const inherited = q.topicId !== undefined && topicsWithEvidence.has(q.topicId);
    errors.push(
      ...checkMetadata(label, q, { allowCognitive: true, evidenceInherited: inherited })
    );
  }
  return errors;
}

/** Validate the entire content set. Errors fail the gate; warnings are informational. */
export function validateAll(input: ValidationInputs): ValidationResult {
  const { blueprint, topics, flashcards, quiz } = input;
  const errors: string[] = [];

  // Blueprint structure + blank id/title checks.
  errors.push(...validateBlueprint(blueprint));
  for (const d of blueprint.domains) {
    if (!isNonEmptyString(d.id)) errors.push(`domain has empty id`);
    if (!isNonEmptyString(d.title)) errors.push(`domain ${d.id} has empty title`);
    for (const sk of d.skills) {
      if (!isNonEmptyString(sk.id)) errors.push(`skill in ${d.id} has empty id`);
      if (!isNonEmptyString(sk.title)) errors.push(`skill ${sk.id} has empty title`);
    }
  }

  const validSkills = allSkillIds(blueprint);
  const topicIds = new Set(topics.map((t) => t.id));
  // Topics that carry at least one evidence entry — cards/questions on these
  // topics inherit provenance.
  const topicsWithEvidence = new Set(
    topics.filter((t) => (t.evidence?.length ?? 0) > 0).map((t) => t.id)
  );

  errors.push(...checkTopics(topics, validSkills));
  errors.push(...checkFlashcards(flashcards, validSkills, topicsWithEvidence, topicIds));
  errors.push(...checkQuestions(quiz, validSkills, topicsWithEvidence, topicIds));

  // Coverage warnings from the blueprint mapping layer (non-fatal).
  const mapping = validateContentMappings({ bp: blueprint, topics, flashcards, quiz });
  const warnings = mapping.warnings;

  return { errors, warnings };
}
