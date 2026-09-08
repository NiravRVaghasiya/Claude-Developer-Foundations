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
  | "Tools & MCPs"
  | "Exam Strategy";

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
}

/** True when a quiz question expects more than one selected answer. */
export function isMultiResponse(q: QuizQuestion): boolean {
  return q.correctIds.length > 1;
}
