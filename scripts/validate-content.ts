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
import { planExamAllocation } from "@/lib/exam";
import type { Flashcard, QuizQuestion } from "@/lib/content-types";
import flashcardsJson from "@content/flashcards.json";
import quizJson from "@content/quiz.json";

const topics = getAllTopics();
const flashcards = flashcardsJson as Flashcard[];
const quiz = quizJson as QuizQuestion[];

const { errors, warnings } = validateAll({ blueprint, topics, flashcards, quiz });

// Hard gate for the SHIPPED bank: a full-length blueprint-weighted exam of the
// official item count must be constructible. (validateAll only warns on this so
// the reusable validator stays usable with small fixtures; here we enforce it.)
const itemCount = blueprint.format.items;
const plan = planExamAllocation(quiz, blueprint, itemCount);
if (plan.totalAvailable < itemCount) {
  errors.push(
    `shipped bank cannot build a full ${itemCount}-item exam: only ${plan.totalAvailable} questions available`
  );
}
if (plan.totalAvailable >= itemCount && plan.allocatedTotal < itemCount) {
  errors.push(
    `shipped bank exam allocation only filled ${plan.allocatedTotal}/${itemCount} slots`
  );
}

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
