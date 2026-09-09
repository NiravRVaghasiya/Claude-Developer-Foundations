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
    skillIds: ["d2-messages-api"],
    difficulty: "core",
    objective:
      "Use the stateless Messages API correctly: system as a top-level param, alternating roles, required max_tokens, and stop_reason handling.",
    status: "verified",
    evidence: [
      {
        source: "Anthropic — Messages API",
        url: "https://platform.claude.com/docs/en/api/messages",
        verifiedOn: "2026-09-09",
      },
    ],
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
    skillIds: ["d8-tool-use", "d1-agent-loop"],
    difficulty: "core",
    objective:
      "Implement the tool_use → tool_result handshake, parallel calls, tool_choice, and graceful tool-error handling.",
    status: "verified",
    evidence: [
      {
        source: "Anthropic — Tool use (function calling)",
        url: "https://platform.claude.com/docs/en/build-with-claude/tool-use",
        verifiedOn: "2026-09-09",
      },
    ],
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
    skillIds: ["d6-structured-output"],
    difficulty: "core",
    objective:
      "Produce reliable machine-parseable output via tool input_schema, structured outputs, and enum-constrained classification.",
    status: "verified",
    evidence: [
      {
        source: "Anthropic — Increasing output consistency (structured output)",
        url: "https://platform.claude.com/docs/en/build-with-claude/structured-outputs",
        verifiedOn: "2026-09-09",
      },
    ],
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
    skillIds: ["d2-streaming", "d2-batch-vs-realtime"],
    difficulty: "core",
    objective:
      "Consume Server-Sent Events, accumulate deltas, reason about perceived latency (TTFB), and know when to use the Batch API instead.",
    status: "verified",
    evidence: [
      {
        source: "Anthropic — Streaming Messages",
        url: "https://platform.claude.com/docs/en/build-with-claude/streaming",
        verifiedOn: "2026-09-09",
      },
    ],
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
    skillIds: ["d5-model-tradeoffs", "d5-llm-fundamentals"],
    difficulty: "core",
    objective:
      "Weigh Haiku vs. Sonnet vs. Opus tradeoffs, set key sampling parameters, and choose version pinning over floating aliases.",
    status: "verified",
    evidence: [
      {
        source: "Anthropic — Models overview",
        url: "https://platform.claude.com/docs/en/docs/about-claude/models",
        verifiedOn: "2026-09-09",
      },
    ],
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
    skillIds: ["d2-prompt-caching", "d5-token-cost"],
    difficulty: "advanced",
    objective:
      "Cache a stable prefix to cut cost: reason about write vs. read multipliers, breakpoint placement, TTL tiers, per-model minimums, and the timestamp trap.",
    status: "verified",
    evidence: [
      {
        source: "Anthropic — Prompt caching",
        url: "https://platform.claude.com/docs/en/docs/build-with-claude/prompt-caching",
        verifiedOn: "2026-09-09",
      },
      {
        source: "Anthropic — What's new in Claude Opus 5 (512-token cache minimum)",
        url: "https://platform.claude.com/docs/en/about-claude/models/whats-new-opus-5",
        verifiedOn: "2026-09-09",
        note: "Per-model minimums are non-monotonic; the topic now presents a precise table.",
      },
    ],
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
    skillIds: ["d5-token-cost", "d5-llm-fundamentals"],
    difficulty: "core",
    objective:
      "Use the count_tokens endpoint (input only, no caching) for pre-flight budgeting, account for the newer-tokenizer increase, and truncate safely.",
    status: "verified",
    evidence: [
      {
        source: "Anthropic — Token counting",
        url: "https://platform.claude.com/docs/en/api/messages/count_tokens",
        verifiedOn: "2026-09-09",
      },
      {
        source: "Claude Fable 5 technical harness report (~30% more tokens)",
        url: "https://huggingface.co/blog/Svngoku/claude-fable-5-technical-harness-report",
        verifiedOn: "2026-09-09",
        note: "Secondary source corroborating the newer-tokenizer token increase.",
      },
    ],
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
    skillIds: ["d2-vision"],
    difficulty: "core",
    objective:
      "Send image blocks (base64/URL/file_id), reason about visual-token cost and size limits, and use the Files API in agent loops.",
    // The 28x28 visual-token patch formula and the 32 MB request cap are
    // secondary-sourced; official Vision docs still show a ~w*h/750 approximation.
    // Marked needs-review until the per-model figure is confirmed (claims ledger, Phase 10).
    status: "needs-review",
    evidence: [
      {
        source: "Anthropic — Vision",
        url: "https://platform.claude.com/docs/en/build-with-claude/vision",
        verifiedOn: "2026-09-09",
        note: "Confirms image blocks / Files API. The 28x28 patch formula & 32 MB cap are secondary-sourced — see claims ledger Phase 10 addendum.",
      },
    ],
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
    skillIds: ["d2-error-handling", "d4-error-identification"],
    difficulty: "core",
    objective:
      "Distinguish 429 vs. 529, apply exponential backoff with jitter, handle the spend-cap 429, and use idempotency.",
    status: "verified",
    evidence: [
      {
        source: "Anthropic — Errors",
        url: "https://platform.claude.com/docs/en/api/errors",
        verifiedOn: "2026-09-09",
      },
    ],
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
    skillIds: ["d1-agent-loop", "d1-workflow-vs-agent"],
    difficulty: "advanced",
    objective:
      "Implement the call → tool_use → execute → tool_result cycle with stop_reason handling, parallel-call pairing, and loop guards.",
    status: "verified",
    evidence: [
      {
        source: "Anthropic — Agent SDK / building agents",
        url: "https://platform.claude.com/docs/en/api/agent-sdk/overview",
        verifiedOn: "2026-09-09",
      },
    ],
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
    skillIds: ["d5-model-migration", "d5-model-tradeoffs"],
    difficulty: "advanced",
    objective:
      "Run a compatibility checklist, roll out via shadow/canary, pin versions, adapt to prefill removal on newer models, and define rollback triggers.",
    status: "verified",
    evidence: [
      {
        source: "Anthropic — Migrating to Claude Fable 5.1 / Mythos 5.1 (prefill 400)",
        url: "https://platform.claude.com/docs/en/models/fable-5-1/migration-guide",
        verifiedOn: "2026-09-09",
      },
    ],
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
    // Meta/strategy topic: it reinforces the two highest-weight domains it
    // spends most time on rather than introducing a distinct blueprint skill.
    skillIds: ["d2-messages-api", "d5-model-tradeoffs"],
    difficulty: "intro",
    objective:
      "Apply time management, elimination heuristics, distractor-pattern awareness, and a last-24-hour review checklist.",
    status: "verified",
    evidence: [
      {
        source:
          "CCDV-F Exam Guide v1.0 (official) — via FlashGenius interactive guide (secondary)",
        url: "https://flashgenius.net/guides/claude-certified-developer-foundations-ccdv-f-2026-interactive-guide",
        verifiedOn: "2026-09-09",
        note: "Exam format, scoring, and preparation guidance; linked URL is a secondary community guide citing the official exam guide (see claims ledger).",
      },
    ],
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
    // Overview/orientation topic mapped to the two heaviest exam domains.
    skillIds: ["d2-messages-api", "d5-model-tradeoffs"],
    difficulty: "intro",
    objective:
      "Understand the exam format, domain weights, and how the study topics map to the scored blueprint.",
    status: "verified",
    evidence: [
      {
        source:
          "CCDV-F Exam Guide v1.0 (official) — via FlashGenius interactive guide (secondary)",
        url: "https://flashgenius.net/guides/claude-certified-developer-foundations-ccdv-f-2026-interactive-guide",
        verifiedOn: "2026-09-09",
        note: "Official domain weights and exam format; linked URL is a secondary community guide citing the official exam guide (see claims ledger).",
      },
    ],
  },
  {
    id: "prompt-context-engineering",
    slug: "prompt-context-engineering",
    title: "Prompt & Context Engineering",
    summary:
      "Instruction placement (system vs. user vs. tool), curating the context window, and the agent lifecycle: compaction, tool-result clearing, and memory.",
    domain: "Prompt & Context Engineering",
    file: "14-prompt-context-engineering.mdx",
    source: "CCDV-F Study Notes2.md",
    order: 14,
    skillIds: ["d6-context-management", "d6-prompt-principles"],
    difficulty: "core",
    objective:
      "Place instructions where they're followed reliably and manage the context window over a long agent session.",
    status: "verified",
    evidence: [
      {
        source: "Anthropic — Effective context engineering for AI agents",
        url: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents",
        verifiedOn: "2026-09-09",
      },
      {
        source: "Anthropic — Context engineering: memory, compaction, and tool clearing (cookbook)",
        url: "https://platform.claude.com/cookbook/tool-use-context-engineering-context-engineering-tools",
        verifiedOn: "2026-09-09",
      },
    ],
  },
  {
    id: "security-safety",
    slug: "security-safety",
    title: "Security & Safety",
    summary:
      "Prompt injection (direct & indirect), structural isolation of untrusted content, least-privilege tools, human approval for high-risk actions, and secrets handling.",
    domain: "Security & Safety",
    file: "15-security-safety.mdx",
    source: "CCDV-F Study Notes2.md",
    order: 15,
    skillIds: ["d7-prompt-injection", "d7-guardrails", "d7-secrets"],
    difficulty: "core",
    objective:
      "Defend an LLM app in depth: isolate untrusted input, enforce least privilege, gate risky actions, and protect secrets.",
    status: "verified",
    evidence: [
      {
        source: "Anthropic — Mitigate jailbreaks and prompt injections",
        url: "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks",
        verifiedOn: "2026-09-09",
      },
      {
        source: "Anthropic — Mitigating prompt injections (research)",
        url: "https://www.anthropic.com/research/prompt-injection-defenses",
        verifiedOn: "2026-09-09",
      },
    ],
  },
  {
    id: "mcp-and-tools",
    slug: "mcp-and-tools",
    title: "MCP & Tool Customization",
    summary:
      "MCP primitives (tools/resources/prompts) over stdio/HTTP, and choosing among built-in tools, custom tools, Skills, and MCP servers by reusability.",
    domain: "Tools & MCPs",
    file: "16-mcp-and-tools.mdx",
    source: "CCDV-F Study Notes2.md",
    order: 16,
    skillIds: ["d8-mcp-servers", "d8-agentic-customization"],
    difficulty: "core",
    objective:
      "Build/consume an MCP server and pick the right customization mechanism for a given capability.",
    status: "verified",
    evidence: [
      {
        source: "Anthropic — Connect to external tools with MCP",
        url: "https://code.claude.com/docs/en/agent-sdk/mcp",
        verifiedOn: "2026-09-09",
      },
      {
        source: "Model Context Protocol — specification",
        url: "https://modelcontextprotocol.io",
        verifiedOn: "2026-09-09",
      },
    ],
  },
  {
    id: "claude-code-debugging",
    slug: "claude-code-debugging",
    title: "Claude Code & Debugging",
    summary:
      "Claude Code config (CLAUDE.md hierarchy, settings.json, hooks, Skills/Commands/Agents, memory), headless mode exit codes, and integration-vs-model-output debugging.",
    domain: "Claude Code & Ops",
    file: "17-claude-code-debugging.mdx",
    source: "CCDV-F Study Notes2.md",
    order: 17,
    skillIds: [
      "d3-core-components",
      "d3-config-hierarchy",
      "d3-modes",
      "d4-trace-analysis",
      "d1-agent-sdk",
      "d2-config-management",
    ],
    difficulty: "core",
    objective:
      "Configure and operate Claude Code, and isolate whether a failure is in the integration layer or the model output.",
    status: "verified",
    evidence: [
      {
        source: "Anthropic — Run Claude Code programmatically (headless)",
        url: "https://code.claude.com/docs/en/headless",
        verifiedOn: "2026-09-09",
      },
    ],
  },
  {
    id: "agent-orchestration",
    slug: "agent-orchestration",
    title: "Agent Orchestration & Hooks",
    summary:
      "Manager/subagent orchestration with isolated context windows, distilled results, deterministic hooks at lifecycle points, and loop guards on fan-out.",
    domain: "Agents & Workflows",
    file: "18-agent-orchestration.mdx",
    source: "CCDV-F Study Notes2.md",
    order: 18,
    skillIds: ["d1-orchestration", "d1-workflow-vs-agent"],
    difficulty: "advanced",
    objective:
      "Design manager/subagent orchestration that isolates subagent context and returns distilled results, and use hooks to enforce checks deterministically.",
    status: "verified",
    evidence: [
      {
        source: "Anthropic — Building effective agents (orchestrator/workers)",
        url: "https://www.anthropic.com/engineering/building-effective-agents",
        verifiedOn: "2026-09-09",
        note: "Manager/subagent (orchestrator/workers) pattern and workflow-vs-agent guidance.",
      },
      {
        source: "Anthropic — Agent SDK / building agents",
        url: "https://platform.claude.com/docs/en/api/agent-sdk/overview",
        verifiedOn: "2026-09-09",
        note: "Subagents, hooks, and orchestration primitives.",
      },
    ],
  },
  {
    id: "evaluation-testing-debugging",
    slug: "evaluation-testing-debugging",
    title: "Evaluation, Testing & Debugging",
    summary:
      "Evals and golden datasets, unit vs. integration vs. eval, grading methods (exact/assertion/model-graded), reproducibility under non-determinism, and the integration-vs-model-output debugging decision tree.",
    domain: "Claude Code & Ops",
    file: "19-evaluation-testing-debugging.mdx",
    source: "CCDV-F Study Notes2.md",
    order: 19,
    skillIds: ["d4-error-identification", "d4-trace-analysis"],
    difficulty: "core",
    objective:
      "Build and run regression evals, pick the right test type (unit/integration/eval) and grading method, reason about reproducibility, and isolate whether a failure is in the integration layer or the model output.",
    status: "verified",
    evidence: [
      {
        source: "Anthropic — Create strong empirical evaluations",
        url: "https://platform.claude.com/docs/en/test-and-evaluate/develop-tests",
        verifiedOn: "2026-09-09",
        note: "Eval datasets, grading methods (code / model-graded), and regression testing.",
      },
      {
        source: "Anthropic — Reducing latency & non-determinism / temperature",
        url: "https://platform.claude.com/docs/en/api/messages",
        verifiedOn: "2026-09-09",
        note: "temperature and non-determinism behavior for reproducibility.",
      },
    ],
  },
  {
    id: "claude-code",
    slug: "claude-code",
    title: "Claude Code (Config & Modes)",
    summary:
      "The Claude Code component model — CLAUDE.md hierarchy, Rules, Skills, Commands, Agents, Hooks — plus settings.json permissions, session/headless/streaming modes, and MCP integration.",
    domain: "Claude Code & Ops",
    file: "20-claude-code.mdx",
    source: "CCDV-F Study Notes2.md",
    order: 20,
    skillIds: ["d3-core-components", "d3-config-hierarchy", "d3-modes"],
    difficulty: "core",
    objective:
      "Distinguish CLAUDE.md, Rules, Skills, Commands, Agents, and Hooks by their trigger, configure least-privilege permissions in settings.json, and operate interactive vs. headless vs. streaming modes.",
    status: "verified",
    evidence: [
      {
        source: "Anthropic — Claude Code settings & memory (CLAUDE.md hierarchy)",
        url: "https://code.claude.com/docs/en/settings",
        verifiedOn: "2026-09-09",
        note: "CLAUDE.md hierarchy, settings.json permissions, and configuration model.",
      },
      {
        source: "Anthropic — Run Claude Code programmatically (headless)",
        url: "https://code.claude.com/docs/en/headless",
        verifiedOn: "2026-09-09",
        note: "Headless mode, exit codes, and output formats.",
      },
    ],
  },
];

export default topics;
