// Strict content validation runner. Executes the SAME pure validator used by the
// test suite (src/lib/content-validation.ts) over the real content, so the gate
// in `bun run validate:content` and `bun run test` can never drift.
//
// Run with bun (project runtime): it executes TypeScript natively and resolves
// the tsconfig path aliases (@/, @content/). Wired as the `validate:content`
// npm script.
import { blueprint } from "@content/blueprint";
import { getAllTopics } from "@/lib/content";
import { validateAll } from "@/lib/content-validation";
import type { Flashcard, QuizQuestion } from "@/lib/content-types";
import flashcardsJson from "@content/flashcards.json";
import quizJson from "@content/quiz.json";

const topics = getAllTopics();
const flashcards = flashcardsJson as Flashcard[];
const quiz = quizJson as QuizQuestion[];

const { errors, warnings } = validateAll({ blueprint, topics, flashcards, quiz });

for (const w of warnings) console.warn(`warning: ${w}`);

if (errors.length > 0) {
  for (const e of errors) console.error(`error: ${e}`);
  console.error(
    `\ncontent validation FAILED: ${errors.length} error(s), ${warnings.length} warning(s).`
  );
  process.exit(1);
}

console.log(
  `content validation passed: ${topics.length} topics, ${flashcards.length} flashcards, ${quiz.length} questions, ${blueprint.domains.length} domains. ${warnings.length} warning(s).`
);
