import type { Topic } from "@/lib/content-types";

/**
 * Ordered registry of every study topic. The `file` must exist under
 * content/topics/. Order drives sidebar and next/prev navigation.
 *
 * Topics 1-5 + Exam Strategy come from "CCDV-F Study Notes.md".
 * Topics 6-13 come from "CCDV-F Study Notes2.md".
 */
export const topics: Topic[] = [
  {
    id: "messages-api",
    slug: "messages-api",
    title: "Messages API Mastery",
    summary:
      "The stateless Messages endpoint: system as a top-level param, alternating roles, required max_tokens, and stop_reason literacy.",
    domain: "Applications & Integration",
    file: "01-messages-api.mdx",
    source: "CCDV-F Study Notes.md",
    order: 1,
  },
  {
    id: "tool-use",
    slug: "tool-use",
    title: "Tool Use / Function Calling",
    summary:
      "The tool_use -> tool_result handshake, parallel calls, tool_choice, and graceful tool-error handling.",
    domain: "Tools & MCPs",
    file: "02-tool-use.mdx",
    source: "CCDV-F Study Notes.md",
    order: 2,
  },
  {
    id: "structured-output",
    slug: "structured-output",
    title: "Structured Output",
    summary:
      "Reliable machine-parseable output via tool input_schema, prefill, and enum-constrained classification.",
    domain: "Applications & Integration",
    file: "03-structured-output.mdx",
    source: "CCDV-F Study Notes.md",
    order: 3,
  },
  {
    id: "streaming",
    slug: "streaming",
    title: "Streaming",
    summary:
      "Server-Sent Events, delta accumulation, perceived latency (TTFB), and when to use batch instead.",
    domain: "Applications & Integration",
    file: "04-streaming.mdx",
    source: "CCDV-F Study Notes.md",
    order: 4,
  },
  {
    id: "model-selection",
    slug: "model-selection",
    title: "Model Selection in Code",
    summary:
      "Haiku vs Sonnet vs Opus trade-offs, key sampling parameters, and version pinning vs floating aliases.",
    domain: "Model Selection & Optimization",
    file: "05-model-selection.mdx",
    source: "CCDV-F Study Notes.md",
    order: 5,
  },
  {
    id: "prompt-caching",
    slug: "prompt-caching",
    title: "Prompt Caching",
    summary:
      "Cache a stable prefix to cut cost: write vs read multipliers, breakpoint placement, TTL tiers, and the timestamp trap.",
    domain: "Applications & Integration",
    file: "06-prompt-caching.mdx",
    source: "CCDV-F Study Notes2.md",
    order: 6,
  },
  {
    id: "token-counting",
    slug: "token-counting",
    title: "Token Counting & Cost Control",
    summary:
      "The count_tokens endpoint (input only, no caching), the +30% newer-tokenizer trap, and truncation strategy.",
    domain: "Model Selection & Optimization",
    file: "07-token-counting.mdx",
    source: "CCDV-F Study Notes2.md",
    order: 7,
  },
  {
    id: "vision",
    slug: "vision",
    title: "Vision / Multimodal Inputs",
    summary:
      "Image blocks (base64/URL/file_id), 28x28 visual-token patches, size limits, and the Files API in agent loops.",
    domain: "Applications & Integration",
    file: "08-vision.mdx",
    source: "CCDV-F Study Notes2.md",
    order: 8,
  },
  {
    id: "error-handling",
    slug: "error-handling",
    title: "Error Handling & Retries",
    summary:
      "429 vs 529, exponential backoff with jitter, the spend-cap 429 (no retry-after), and idempotency.",
    domain: "Applications & Integration",
    file: "09-error-handling.mdx",
    source: "CCDV-F Study Notes2.md",
    order: 9,
  },
  {
    id: "agent-loop",
    slug: "agent-loop",
    title: "Basic Agent Loop in Code",
    summary:
      "The call -> tool_use -> execute -> tool_result cycle, stop_reason handling, parallel-call pairing, and loop guards.",
    domain: "Agents & Workflows",
    file: "10-agent-loop.mdx",
    source: "CCDV-F Study Notes2.md",
    order: 10,
  },
  {
    id: "model-migration",
    slug: "model-migration",
    title: "Model Migration",
    summary:
      "Compatibility checklist, shadow/canary rollout, version pinning, prefill removal on 4.6+, and rollback triggers.",
    domain: "Model Selection & Optimization",
    file: "11-model-migration.mdx",
    source: "CCDV-F Study Notes2.md",
    order: 11,
  },
  {
    id: "exam-strategy",
    slug: "exam-strategy",
    title: "Exam Strategy & Meta-Tips",
    summary:
      "Time management, elimination heuristics, distractor patterns, and the last-24-hour review checklist.",
    domain: "Exam Strategy",
    file: "12-exam-strategy.mdx",
    source: "CCDV-F Study Notes2.md",
    order: 12,
  },
  {
    id: "exam-overview",
    slug: "exam-overview",
    title: "Master Exam Overview",
    summary:
      "Format, domain weights, and how the topics map to the ~60% of scored weight they cover.",
    domain: "Exam Strategy",
    file: "13-exam-overview.mdx",
    source: "CCDV-F Study Notes.md",
    order: 13,
  },
];

export default topics;
