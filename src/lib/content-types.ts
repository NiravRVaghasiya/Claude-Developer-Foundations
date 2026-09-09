/**
 * Core content model for the CCDV-F study site.
 *
 * - Topic metadata lives in `content/topics.index.ts` (typed against `Topic`).
 * - Topic prose/code lives in `content/topics/<file>.mdx`.
 * - Flashcards live in `content/flashcards.json` (typed against `Flashcard`).
 * - Quiz questions live in `content/quiz.json` (typed against `QuizQuestion`).
 */

/** Which source file / exam grouping a topic belongs to. */
export type TopicDomain =
  | "Applications & Integration"
  | "Model Selection & Optimization"
  | "Agents & Workflows"
  | "Prompt & Context Engineering"
  | "Security & Safety"
  | "Tools & MCPs"
  | "Claude Code & Ops"
  | "Exam Strategy";

/**
 * Provenance/verification status for a factual content unit.
 * - "verified": every claim has a sourced entry in `evidence`.
 * - "needs-review": a claim is unsourced/ambiguous and must not be treated as fact yet.
 */
export type ContentStatus = "verified" | "needs-review";

/** Relative difficulty of a learning unit or question. */
export type Difficulty = "intro" | "core" | "advanced";

/** Bloom-style cognitive level a question exercises. */
export type CognitiveLevel = "recall" | "application" | "analysis";

/**
 * A single sourced evidence entry backing a factual claim. Provenance is
 * mandatory for the platform's trustworthiness; see the Phase 01 claims ledger.
 */
/**
 * How authoritative a source is, for honest provenance labeling:
 * - "official": a first-party Anthropic doc / product page.
 * - "secondary": a community/third-party source that cites or corroborates.
 * - "inferred": a reasoned conclusion not directly stated by a single source.
 * NEVER label a secondary/community source "official".
 */
export type SourceType = "official" | "secondary" | "inferred";

/** How confident we are that the cited source supports the claim. */
export type SourceConfidence = "high" | "medium" | "low";

export interface Evidence {
  /**
   * Provenance tier. Optional for back-compat; when omitted it is treated as
   * "official" for legacy entries whose `source` begins with "Anthropic —".
   * Prefer setting it explicitly.
   */
  sourceType?: SourceType;
  /** Human-readable source label, e.g. "Anthropic — Prompt caching". */
  source: string;
  /** Canonical URL of the authoritative source. */
  url: string;
  /** ISO date (YYYY-MM-DD) the claim was verified against the source. */
  verifiedOn: string;
  /** Confidence that the source actually supports the claim. */
  confidence?: SourceConfidence;
  /** Optional clarifying note (e.g. which figure/behavior this supports). */
  note?: string;
}

/** Ordered metadata describing a single study topic. */
export interface Topic {
  /** Stable identifier, referenced by flashcards/quiz (e.g. "messages-api"). */
  id: string;
  /** URL slug used at /topics/[slug]. Usually equal to `id`. */
  slug: string;
  /** Human-readable title. */
  title: string;
  /** One-line summary shown in lists and search results. */
  summary: string;
  /** Exam domain / grouping for sidebar organization. */
  domain: TopicDomain;
  /** MDX filename inside content/topics (e.g. "01-messages-api.mdx"). */
  file: string;
  /** Which source note the topic was derived from. */
  source: "CCDV-F Study Notes.md" | "CCDV-F Study Notes2.md";
  /** Display order across the whole site. */
  order: number;

  // --- Phase 01 blueprint/provenance metadata (optional at the type level;
  //     completeness is enforced by content validation, not the compiler). ---
  /** Blueprint skill ids this topic teaches; must resolve to `content/blueprint.ts`. */
  skillIds?: string[];
  /** Relative difficulty of the topic. */
  difficulty?: Difficulty;
  /** One-line learning objective ("After this topic, a learner can…"). */
  objective?: string;
  /** Sourced evidence backing the topic's factual claims. */
  evidence?: Evidence[];
  /** Verification status; "needs-review" when a claim is not yet fully sourced. */
  status?: ContentStatus;
}

/** A single Q/A flashcard for active recall. */
export interface Flashcard {
  /** Stable identifier (e.g. "fc-messages-api-1"). */
  id: string;
  /** Topic this card belongs to; must match a Topic.id. */
  topicId: string;
  /** The prompt shown on the front of the card. */
  question: string;
  /** The answer revealed on the back of the card. */
  answer: string;

  // --- Phase 01 blueprint/provenance metadata (optional; validated for completeness). ---
  /** Blueprint skill ids this card drills; must resolve to `content/blueprint.ts`. */
  skillIds?: string[];
  /** Relative difficulty of the card. */
  difficulty?: Difficulty;
  /** Sourced evidence backing the card's answer. */
  evidence?: Evidence[];
  /** Verification status; "needs-review" when a claim is not yet fully sourced. */
  status?: ContentStatus;
}

/** A single selectable option in a quiz question. */
export interface QuizOption {
  /** Option identifier, unique within its question (e.g. "a", "b"). */
  id: string;
  /** Option text shown to the user. */
  text: string;
}

/** A single quiz question. Supports single- and multiple-response. */
export interface QuizQuestion {
  /** Stable identifier (e.g. "q1"). */
  id: string;
  /** Optional topic association; must match a Topic.id when present. */
  topicId?: string;
  /** The question prompt. */
  question: string;
  /** Selectable options. */
  options: QuizOption[];
  /**
   * IDs of the correct option(s). Length > 1 => "select all that apply"
   * (multiple-response); length === 1 => single-choice.
   */
  correctIds: string[];
  /**
   * Per-option explanation keyed by option id. Explains why an option is
   * right or wrong (mirrors the notes' answer-key rationale).
   */
  explanations: Record<string, string>;

  // --- Phase 01 blueprint/provenance metadata (optional; validated for completeness). ---
  /** Blueprint skill ids this question assesses; must resolve to `content/blueprint.ts`. */
  skillIds?: string[];
  /** Relative difficulty of the question. */
  difficulty?: Difficulty;
  /** Cognitive level the question exercises (recall/application/analysis). */
  cognitiveLevel?: CognitiveLevel;
  /** Sourced evidence backing the correct answer / explanations. */
  evidence?: Evidence[];
  /** Verification status; "needs-review" when a claim is not yet fully sourced. */
  status?: ContentStatus;
}

/** True when a quiz question expects more than one selected answer. */
export function isMultiResponse(q: QuizQuestion): boolean {
  return q.correctIds.length > 1;
}
