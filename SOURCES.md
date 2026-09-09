# Sources & Provenance

> Every version-sensitive claim in this repository is backed by an authoritative
> source with a verification date. Sources are prioritized: **official Anthropic
> certification → official API docs → official Claude Code docs → official MCP /
> Agent SDK docs → secondary/community** (used only to corroborate, never to
> override). Content was rephrased for compliance with source licensing
> restrictions.
>
> **Verification sweep date: 2026-09-09.** Version-sensitive facts should be
> re-checked against the live docs before an exam sitting, since model versions and
> pricing evolve.

## Provenance model (how this repo labels sources)

The content types carry a `sourceType` on every evidence entry:

- **official** — a first-party Anthropic doc or product page.
- **secondary** — a community/third-party source that cites or corroborates
  official material. **Never** labeled "official," even when it repeats official
  facts.
- **inferred** — a reasoned conclusion not stated verbatim by a single source.

The content-validation gate **errors** if an evidence entry claims `official` but
its URL is a known community host, and it requires every exam-critical (`verified`)
question to carry at least one citable (official or secondary) source. See
[`docs/phases/01-claims-ledger.md`](docs/phases/01-claims-ledger.md) for the full
claims ledger.

## 1. Certification (exam scope, format, weights)

- **Claude Certified Developer – Foundations Exam Guide v1.0** (official, effective
  July 2026). The authoritative source for the 8 domains, their weights, the
  53-item / 120-minute format, and the scaled 100–1000 / cut-720 scoring.
  - The official guide PDF is distributed via the Anthropic Partner Academy course
    delivery infrastructure and is not a stable public URL. The blueprint structure
    is therefore recorded as **derived/secondary-corroborated**, not independently
    verifiable from a stable official public link.
  - Corroborating secondary summaries (weights match exactly): the FlashGenius
    interactive guide and independent community write-ups. Labeled **secondary**.

> The repo's `content/blueprint.ts` encodes these figures with an honest
> `secondary`/`medium` provenance note rather than overclaiming an official URL.

## 2. Official API documentation (platform.claude.com)

| Topic | Source |
|---|---|
| Messages API (roles, `system`, `max_tokens`, `stop_reason`, content blocks) | `platform.claude.com/docs/en/api/messages` |
| Handling stop reasons | `platform.claude.com/docs/en/api/handling-stop-reasons` |
| Token counting (input only; no caching applied) | `platform.claude.com/docs/en/api/messages/count_tokens` |
| API errors (429 vs 529, retryable vs client errors) | `platform.claude.com/docs/en/api/errors` |
| Streaming Messages (SSE events) | `platform.claude.com/docs/en/build-with-claude/streaming` |
| Tool use / function calling | `platform.claude.com/docs/en/build-with-claude/tool-use` |
| Structured outputs | `platform.claude.com/docs/en/build-with-claude/structured-outputs` |
| Vision / multimodal | `platform.claude.com/docs/en/build-with-claude/vision` |
| Files API | `platform.claude.com/docs/en/build-with-claude/files` |
| Batch processing | `platform.claude.com/docs/en/build-with-claude/batch-processing` |
| Prompt caching (multipliers, TTL, breakpoints) | `platform.claude.com/docs/en/docs/build-with-claude/prompt-caching` |
| Models overview | `platform.claude.com/docs/en/docs/about-claude/models` |
| Evaluations / develop tests | `platform.claude.com/docs/en/test-and-evaluate/develop-tests` |
| Mitigate jailbreaks & prompt injections | `platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks` |
| Agent SDK overview | `platform.claude.com/docs/en/api/agent-sdk/overview` |

## 3. Official Claude Code documentation (code.claude.com)

| Topic | Source |
|---|---|
| Settings, permissions, CLAUDE.md hierarchy | `code.claude.com/docs/en/settings` |
| Headless / programmatic mode (exit codes) | `code.claude.com/docs/en/headless` |
| Agent SDK overview & MCP | `code.claude.com/docs/en/agent-sdk/overview`, `code.claude.com/docs/en/agent-sdk/mcp` |

## 4. Official MCP & Agent SDK

- **Model Context Protocol specification** — `modelcontextprotocol.io` (the
  authoritative protocol reference for hosts, clients, servers, tools, resources,
  prompts, transports).
- **Anthropic Agent SDK** — see the Agent SDK links above.

## 5. Anthropic engineering & research (first-party, non-API)

| Topic | Source |
|---|---|
| Building effective agents (workflow vs. agent; orchestrator/workers) | `anthropic.com/engineering/building-effective-agents` |
| Effective context engineering for AI agents | `anthropic.com/engineering/effective-context-engineering-for-ai-agents` |
| Mitigating prompt injections (research) | `anthropic.com/research/prompt-injection-defenses` |

## 6. Secondary sources (corroboration only — never authoritative)

Used only to corroborate figures that also appear in official docs, and labeled
`secondary` in the content:

- FlashGenius CCDV-F interactive guide (blueprint weights corroboration).
- Independent community write-ups on the newer-tokenizer token increase and
  pricing (e.g. HuggingFace blog). These stand alone only where explicitly marked
  `secondary`, and never override official documentation.

## Version-sensitive facts to re-verify before an exam sitting

These are true as of the **2026-09-09** sweep but are the most likely to drift:

- Prompt-cache pricing multipliers (5-min write 1.25x / read 0.1x; 1-hour write
  2.0x) and **per-model minimum cacheable lengths** (non-monotonic across models).
- Current model lineup and IDs (Fable 5 / Mythos 5 / Opus 5 / Sonnet 5 / Haiku 4.5)
  and any sampling-parameter or prefill behavior boundaries by version.
- The precise per-model **visual-token** cost figure (currently `needs-review` on
  the Vision topic; official Vision docs still show an approximation).
- Batch API discount (~50%) and request size limits.

## Compliance note

All external sources are cited inline. No source is reproduced beyond short factual
phrases; figures and behaviors are paraphrased, and community/secondary sources are
labeled as such. Content was rephrased for compliance with licensing restrictions.
