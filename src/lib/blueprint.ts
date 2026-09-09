import type { Blueprint, ExamSkill } from "@content/blueprint";
import type { Flashcard, QuizQuestion, Topic } from "@/lib/content-types";

/** Sum-of-weights tolerance (official figures round to ~100.0). */
export const WEIGHT_TOLERANCE = 0.5;

/** Every skill id declared anywhere in the blueprint. */
export function allSkillIds(bp: Blueprint): Set<string> {
  const ids = new Set<string>();
  for (const d of bp.domains) for (const sk of d.skills) ids.add(sk.id);
  return ids;
}

/** Flatten all skills with their domain attached. */
export function allSkills(bp: Blueprint): ExamSkill[] {
  return bp.domains.flatMap((d) => d.skills);
}

/**
 * Structural validation of the blueprint itself: unique ids, non-empty domains,
 * weight sum within tolerance, and skills that reference their owning domain.
 * Returns a list of human-readable error strings (empty = valid).
 */
export function validateBlueprint(bp: Blueprint): string[] {
  const errors: string[] = [];

  const domainIds = new Set<string>();
  for (const d of bp.domains) {
    if (domainIds.has(d.id)) errors.push(`duplicate domain id: ${d.id}`);
    domainIds.add(d.id);
    if (d.skills.length === 0) errors.push(`domain has no skills: ${d.id}`);
  }

  const skillIds = new Set<string>();
  for (const d of bp.domains) {
    for (const sk of d.skills) {
      if (skillIds.has(sk.id)) errors.push(`duplicate skill id: ${sk.id}`);
      skillIds.add(sk.id);
      if (sk.domainId !== d.id) {
        errors.push(
          `skill ${sk.id} declares domainId ${sk.domainId} but lives in ${d.id}`
        );
      }
    }
  }

  const weightSum = bp.domains.reduce((n, d) => n + d.weight, 0);
  if (Math.abs(weightSum - 100) > WEIGHT_TOLERANCE) {
    errors.push(
      `domain weights sum to ${weightSum.toFixed(1)}%, outside ±${WEIGHT_TOLERANCE} of 100%`
    );
  }

  return errors;
}

/** A content unit that carries skill mappings (topic/flashcard/question). */
interface Mappable {
  id: string;
  skillIds?: string[];
}

interface ContentInputs {
  bp: Blueprint;
  topics: Topic[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
}

export interface ContentValidationResult {
  errors: string[];
  warnings: string[];
}

function checkMappings(
  kind: string,
  units: Mappable[],
  valid: Set<string>,
  errors: string[]
): void {
  for (const u of units) {
    const ids = u.skillIds ?? [];
    if (ids.length === 0) {
      errors.push(`${kind} ${u.id} has no skillIds`);
      continue;
    }
    for (const id of ids) {
      if (!valid.has(id)) {
        errors.push(`${kind} ${u.id} references unknown skillId: ${id}`);
      }
    }
  }
}

/**
 * Validate content ↔ blueprint mappings.
 * - errors: dangling skill references, and content units with no skillIds.
 * - warnings: coverage gaps — skills with no learning content, or no assessment.
 */
export function validateContentMappings(
  input: ContentInputs
): ContentValidationResult {
  const { bp, topics, flashcards, quiz } = input;
  const valid = allSkillIds(bp);
  const errors: string[] = [];

  checkMappings("topic", topics, valid, errors);
  checkMappings("flashcard", flashcards, valid, errors);
  checkMappings("question", quiz, valid, errors);

  // Coverage warnings.
  const learningSkills = new Set<string>();
  for (const t of topics) for (const id of t.skillIds ?? []) learningSkills.add(id);

  const assessmentSkills = new Set<string>();
  for (const c of flashcards) for (const id of c.skillIds ?? []) assessmentSkills.add(id);
  for (const q of quiz) for (const id of q.skillIds ?? []) assessmentSkills.add(id);

  const warnings: string[] = [];
  for (const sk of allSkills(bp)) {
    if (!learningSkills.has(sk.id)) {
      warnings.push(`skill has no learning content: ${sk.id} (${sk.title})`);
    }
    if (!assessmentSkills.has(sk.id)) {
      warnings.push(`skill has no assessment: ${sk.id} (${sk.title})`);
    }
  }

  return { errors, warnings };
}

export interface SkillCoverage {
  skillId: string;
  title: string;
  domainId: string;
  topics: number;
  flashcards: number;
  questions: number;
}

/** Per-skill coverage counts, for the blueprint-audit matrix and later phases. */
export function coverageMatrix(input: ContentInputs): SkillCoverage[] {
  const { bp, topics, flashcards, quiz } = input;
  const count = (units: Mappable[], skillId: string) =>
    units.filter((u) => (u.skillIds ?? []).includes(skillId)).length;

  return allSkills(bp).map((sk) => ({
    skillId: sk.id,
    title: sk.title,
    domainId: sk.domainId,
    topics: count(topics, sk.id),
    flashcards: count(flashcards, sk.id),
    questions: count(quiz, sk.id),
  }));
}
