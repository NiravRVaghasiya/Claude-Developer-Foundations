import type { Evidence } from "@/lib/content-types";

/**
 * Structured, sourced CCDV-F exam blueprint.
 *
 * Source of truth: the official "Claude Certified Developer – Foundations"
 * Exam Guide v1.0 (effective July 2026). Domain titles and weights are the
 * official figures; skills below are a stable decomposition used by this
 * platform to map learning content and assessments to the blueprint.
 *
 * STABLE-ID CONTRACT: `ExamDomain.id` and `ExamSkill.id` are permanent handles
 * referenced by topics, flashcards, and quiz questions (and, later, by the
 * diagnostic/adaptive engine). Never renumber or repurpose an id. To rename,
 * add a new id and deprecate the old one.
 */

/** A single testable skill inside a domain. */
export interface ExamSkill {
  /** Stable id, domain-prefixed (e.g. "d2-messages-api"). Never reused. */
  id: string;
  /** Human-readable skill title. */
  title: string;
  /** Owning domain id (FK -> ExamDomain.id). */
  domainId: string;
}

/** An official exam domain with its scored weight. */
export interface ExamDomain {
  /** Stable id (e.g. "applications-integration"). */
  id: string;
  /** Official display code (e.g. "D2"). */
  code: string;
  /** Official domain title. */
  title: string;
  /** Official scored weight as a percentage (e.g. 33.1). */
  weight: number;
  /** Skills belonging to this domain. */
  skills: ExamSkill[];
}

/** The full exam blueprint. */
export interface Blueprint {
  examCode: "CCDV-F";
  version: string;
  /** Effective period, e.g. "2026-07". */
  effective: string;
  format: {
    items: number;
    minutes: number;
    scaleMin: number;
    scaleMax: number;
    cutScore: number;
  };
  /** Provenance for the blueprint structure itself. */
  source: Evidence;
  domains: ExamDomain[];
}

const s = (domainId: string, id: string, title: string): ExamSkill => ({
  id,
  title,
  domainId,
});

export const blueprint: Blueprint = {
  examCode: "CCDV-F",
  version: "1.0",
  effective: "2026-07",
  format: {
    items: 53,
    minutes: 120,
    scaleMin: 100,
    scaleMax: 1000,
    cutScore: 720,
  },
  source: {
    source:
      "CCDV-F Exam Guide v1.0 (official, effective 2026-07) — corroborated via FlashGenius interactive guide (secondary)",
    url: "https://flashgenius.net/guides/claude-certified-developer-foundations-ccdv-f-2026-interactive-guide",
    verifiedOn: "2026-09-09",
    note: "Domain titles/weights and format (53 items, 120 min, cut 720) are from the official Anthropic CCDV-F Exam Guide v1.0; the linked URL is a SECONDARY community guide that cites the official guide (the official PDF is not a stable public URL). See docs/phases/01-claims-ledger.md.",
  },
  domains: [
    {
      id: "agents-workflows",
      code: "D1",
      title: "Agents and Workflows",
      weight: 14.7,
      skills: [
        s("agents-workflows", "d1-workflow-vs-agent", "Choosing workflow vs. agent"),
        s("agents-workflows", "d1-agent-loop", "Building a custom agent loop / harness"),
        s("agents-workflows", "d1-agent-sdk", "Agent construction with the Claude Agent SDK"),
        s("agents-workflows", "d1-orchestration", "Manager/subagent orchestration & hooks"),
      ],
    },
    {
      id: "applications-integration",
      code: "D2",
      title: "Applications and Integration",
      weight: 33.1,
      skills: [
        s("applications-integration", "d2-messages-api", "Messages API mechanics"),
        s("applications-integration", "d2-streaming", "Streaming responses (SSE)"),
        s("applications-integration", "d2-vision", "Vision / multimodal inputs"),
        s("applications-integration", "d2-prompt-caching", "Prompt caching mechanics"),
        s("applications-integration", "d2-batch-vs-realtime", "Realtime vs. Batch API tradeoffs"),
        s("applications-integration", "d2-error-handling", "API error handling & retries"),
        s("applications-integration", "d2-config-management", "Configuration management & version pinning"),
      ],
    },
    {
      id: "claude-code",
      code: "D3",
      title: "Claude Code",
      weight: 3.1,
      skills: [
        s("claude-code", "d3-core-components", "Rules, Skills, Commands, Agents, Memory"),
        s("claude-code", "d3-config-hierarchy", "CLAUDE.md hierarchy & settings.json"),
        s("claude-code", "d3-modes", "Session management & headless/streaming modes"),
      ],
    },
    {
      id: "eval-testing-debugging",
      code: "D4",
      title: "Eval, Testing, and Debugging",
      weight: 2.6,
      skills: [
        s("eval-testing-debugging", "d4-error-identification", "Error type identification & recovery"),
        s("eval-testing-debugging", "d4-trace-analysis", "Trace analysis: integration-layer vs. model output"),
      ],
    },
    {
      id: "model-selection-optimization",
      code: "D5",
      title: "Model Selection and Optimization",
      weight: 16.8,
      skills: [
        s("model-selection-optimization", "d5-llm-fundamentals", "Tokens, context windows, sampling, non-determinism"),
        s("model-selection-optimization", "d5-model-tradeoffs", "Opus/Sonnet/Haiku tradeoffs & tiers"),
        s("model-selection-optimization", "d5-token-cost", "Token counting & cost management"),
        s("model-selection-optimization", "d5-model-migration", "Model migration & version management"),
      ],
    },
    {
      id: "prompt-context-engineering",
      code: "D6",
      title: "Prompt and Context Engineering",
      weight: 11.0,
      skills: [
        s("prompt-context-engineering", "d6-context-management", "Context/memory management & drift prevention"),
        s("prompt-context-engineering", "d6-prompt-principles", "Prompt engineering principles & placement"),
        s("prompt-context-engineering", "d6-structured-output", "Structured output & defensive parsing"),
      ],
    },
    {
      id: "security-safety",
      code: "D7",
      title: "Security and Safety",
      weight: 8.1,
      skills: [
        s("security-safety", "d7-prompt-injection", "Prompt injection & untrusted input handling"),
        s("security-safety", "d7-guardrails", "Guardrails, least privilege & hooks"),
        s("security-safety", "d7-secrets", "Identity, secrets & key management"),
      ],
    },
    {
      id: "tools-mcps",
      code: "D8",
      title: "Tools and MCPs",
      weight: 10.6,
      skills: [
        s("tools-mcps", "d8-tool-use", "Tool implementation & function calling"),
        s("tools-mcps", "d8-mcp-servers", "MCP server development"),
        s("tools-mcps", "d8-agentic-customization", "Choosing built-in tools vs. custom tools vs. Skills vs. MCP"),
      ],
    },
  ],
};

export default blueprint;
