# CCDV-F Objective Coverage Matrix

> The single source of truth for **where a learner stands against every official
> CCDV-F objective**. Rows map 1:1 to the stable blueprint skill IDs in
> [`content/blueprint.ts`](content/blueprint.ts). Coverage is measured against
> real, verifiable content in this repository (topics, flashcards, quiz bank,
> mock exams), not aspiration.

## How to read this

- **Objective** — a blueprint skill (the smallest scored unit). The exam does not
  publish per-skill objective text; skills are Anthropic's stable handles, and the
  learning objective is authored on the mapped topic.
- **Weight** — the domain weight from the official CCDV-F Exam Guide v1.0
  (effective 2026-07). Skill-level weight is not published, so the matrix shows the
  domain weight the skill contributes to.
- **Coverage** — one of `COMPLETE`, `PARTIAL`, `MISSING`. There are **zero
  MISSING** objectives.
- **Questions** — count of quiz-bank questions tagged with this skill (the same
  `skillIds` the exam simulator and diagnostic score on).

## Blueprint at a glance

| Code | Domain | Weight | Skills | Standalone modules |
|---|---|---:|---:|---|
| D2 | Applications and Integration | 33.1% | 7 | Messages API, Structured Output, Streaming, Prompt Caching, Vision, Error Handling |
| D5 | Model Selection and Optimization | 16.8% | 4 | Model Selection, Token Counting, Model Migration |
| D1 | Agents and Workflows | 14.7% | 4 | Agent Loop, Agent Orchestration |
| D6 | Prompt and Context Engineering | 11.0% | 3 | Prompt & Context Engineering, Structured Output |
| D8 | Tools and MCPs | 10.6% | 3 | Tool Use, MCP & Tool Customization |
| D7 | Security and Safety | 8.1% | 3 | Security & Safety |
| D3 | Claude Code | 3.1% | 3 | Claude Code (dedicated), Claude Code & Debugging |
| D4 | Eval, Testing, and Debugging | 2.6% | 2 | Evaluation, Testing & Debugging (dedicated), Error Handling |
| | **Total** | **100.0%** | **29** | |

The two heaviest domains (D2 + D5) are **~50% of the scored exam** — the matrix and
study plan weight practice accordingly.

---

## D1 — Agents and Workflows (14.7%)

| Objective (skill) | Weight | Existing coverage | Gap | Material | Questions | Status |
|---|---:|---|---|---|---:|---|
| `d1-workflow-vs-agent` Choosing workflow vs. agent | 14.7% | Agent Loop, Agent Orchestration topics | none | Agent Loop, Orchestration, `agents` cheat sheet, workflow-vs-agent comparison table | see bank | COMPLETE |
| `d1-agent-loop` Custom agent loop / harness | 14.7% | Agent Loop topic + code | none | Agent Loop topic, agent-loop diagram | see bank | COMPLETE |
| `d1-agent-sdk` Claude Agent SDK | 14.7% | Claude Code & Debugging topic | none | Agent SDK cheat sheet, Claude Code module | see bank | COMPLETE |
| `d1-orchestration` Manager/subagent orchestration & hooks | 14.7% | Agent Orchestration topic | none | Orchestration topic, multi-agent diagram | see bank | COMPLETE |

## D2 — Applications and Integration (33.1%)

| Objective (skill) | Weight | Existing coverage | Gap | Material | Questions | Status |
|---|---:|---|---|---|---:|---|
| `d2-messages-api` Messages API mechanics | 33.1% | Messages API topic | none | Messages API topic, cheat sheet, diagram | see bank | COMPLETE |
| `d2-streaming` Streaming responses (SSE) | 33.1% | Streaming topic | none | Streaming topic, streaming vs non-streaming table | see bank | COMPLETE |
| `d2-vision` Vision / multimodal inputs | 33.1% | Vision topic (secondary-sourced figures flagged) | precise per-model visual-token figure remains `needs-review` | Vision topic | see bank | COMPLETE (one figure flagged) |
| `d2-prompt-caching` Prompt caching mechanics | 33.1% | Prompt Caching topic | none | Prompt Caching topic, cache cheat sheet, cache hit vs write table | see bank | COMPLETE |
| `d2-batch-vs-realtime` Realtime vs. Batch API | 33.1% | Streaming topic (bundled) | none | Streaming topic, streaming vs non-streaming table | see bank | COMPLETE |
| `d2-error-handling` API error handling & retries | 33.1% | Error Handling topic | none | Error Handling topic, error taxonomy | see bank | COMPLETE |
| `d2-config-management` Config mgmt & version pinning | 33.1% | Model Migration + Claude Code topics | none | Model Migration, Claude Code modules | see bank | COMPLETE |

## D3 — Claude Code (3.1%)

| Objective (skill) | Weight | Existing coverage | Gap | Material | Questions | Status |
|---|---:|---|---|---|---:|---|
| `d3-core-components` Rules, Skills, Commands, Agents, Memory | 3.1% | Claude Code & Debugging topic | filled by new dedicated Claude Code module | Claude Code module, CLAUDE.md-vs-Rules-vs-Skills table | see bank | COMPLETE |
| `d3-config-hierarchy` CLAUDE.md hierarchy & settings.json | 3.1% | Claude Code & Debugging topic | filled by new module | Claude Code module, Claude Code cheat sheet | see bank | COMPLETE |
| `d3-modes` Session management & headless/streaming modes | 3.1% | Claude Code & Debugging topic | filled by new module | Claude Code module | see bank | COMPLETE |

## D4 — Eval, Testing, and Debugging (2.6%)

| Objective (skill) | Weight | Existing coverage | Gap | Material | Questions | Status |
|---|---:|---|---|---|---:|---|
| `d4-error-identification` Error type identification & recovery | 2.6% | Error Handling topic (secondary) | filled by new dedicated Eval/Testing/Debugging module | Eval/Testing/Debugging module, debugging decision tree | see bank | COMPLETE |
| `d4-trace-analysis` Trace analysis: integration vs. model output | 2.6% | Claude Code & Debugging topic | filled by new module | Eval/Testing/Debugging module, unit-vs-integration-vs-eval table | see bank | COMPLETE |

## D5 — Model Selection and Optimization (16.8%)

| Objective (skill) | Weight | Existing coverage | Gap | Material | Questions | Status |
|---|---:|---|---|---|---:|---|
| `d5-llm-fundamentals` Tokens, context, sampling, non-determinism | 16.8% | Model Selection, Token Counting topics | none | Model Selection topic, model-selection cheat sheet | see bank | COMPLETE |
| `d5-model-tradeoffs` Opus/Sonnet/Haiku tradeoffs & tiers | 16.8% | Model Selection topic | none | Model Selection topic, model-selection-by-cost/latency/capability table | see bank | COMPLETE |
| `d5-token-cost` Token counting & cost management | 16.8% | Token Counting topic | none | Token Counting topic, cache cheat sheet | see bank | COMPLETE |
| `d5-model-migration` Model migration & version management | 16.8% | Model Migration topic | none | Model Migration topic | see bank | COMPLETE |

## D6 — Prompt and Context Engineering (11.0%)

| Objective (skill) | Weight | Existing coverage | Gap | Material | Questions | Status |
|---|---:|---|---|---|---:|---|
| `d6-context-management` Context/memory mgmt & drift prevention | 11.0% | Prompt & Context Engineering topic | none | P&C Engineering topic, prompt-vs-context table, context cheat sheet | see bank | COMPLETE |
| `d6-prompt-principles` Prompt engineering principles & placement | 11.0% | Prompt & Context Engineering topic | none | P&C Engineering topic, system-vs-user table | see bank | COMPLETE |
| `d6-structured-output` Structured output & defensive parsing | 11.0% | Structured Output topic | none | Structured Output topic, structured-output cheat sheet | see bank | COMPLETE |

## D7 — Security and Safety (8.1%)

| Objective (skill) | Weight | Existing coverage | Gap | Material | Questions | Status |
|---|---:|---|---|---|---:|---|
| `d7-prompt-injection` Prompt injection & untrusted input | 8.1% | Security & Safety topic | none | Security topic, trust-boundary diagram, security cheat sheet | see bank | COMPLETE |
| `d7-guardrails` Guardrails, least privilege & hooks | 8.1% | Security & Safety topic | none | Security topic, common-traps | see bank | COMPLETE |
| `d7-secrets` Identity, secrets & key management | 8.1% | Security & Safety topic | none | Security topic, security cheat sheet | see bank | COMPLETE |

## D8 — Tools and MCPs (10.6%)

| Objective (skill) | Weight | Existing coverage | Gap | Material | Questions | Status |
|---|---:|---|---|---|---:|---|
| `d8-tool-use` Tool implementation & function calling | 10.6% | Tool Use topic | none | Tool Use topic, tool-use lifecycle diagram, native-vs-MCP table | see bank | COMPLETE |
| `d8-mcp-servers` MCP server development | 10.6% | MCP & Tool Customization topic | none | MCP topic, MCP cheat sheet, MCP architecture diagram | see bank | COMPLETE |
| `d8-agentic-customization` Built-in vs custom tools vs Skills vs MCP | 10.6% | MCP & Tool Customization topic | none | MCP topic, native-vs-MCP table | see bank | COMPLETE |

---

## Objective status roll-up

- **29 / 29 objectives COMPLETE.**
- **0 objectives MISSING.**
- 1 objective (`d2-vision`) has a single figure (per-model visual-token cost) that
  remains honestly labeled `needs-review` because only a secondary source supports
  the precise number; the objective itself is otherwise fully covered.

The live **per-skill counts** (questions/flashcards tagged with each skill) are the
authoritative, always-current numbers — read them straight from the content via
`bun run validate:content`, or open `/plan` and `/diagnostic` in the app, which
compute mastery and readiness per skill from the same `skillIds`.

## Target question distribution (blueprint-weighted)

The quiz bank is sized so a **full-length 53-item exam** can be assembled with the
official domain weighting, with headroom for three distinct mock exams. Target
counts scale with domain weight:

| Domain | Weight | Target share of a 160-item bank |
|---|---:|---:|
| D2 Applications and Integration | 33.1% | ~53 |
| D5 Model Selection and Optimization | 16.8% | ~27 |
| D1 Agents and Workflows | 14.7% | ~24 |
| D6 Prompt and Context Engineering | 11.0% | ~18 |
| D8 Tools and MCPs | 10.6% | ~17 |
| D7 Security and Safety | 8.1% | ~13 |
| D3 Claude Code | 3.1% | ~5 |
| D4 Eval, Testing, and Debugging | 2.6% | ~4 |

> Source of the weights: **CCDV-F Exam Guide v1.0** (official, effective 2026-07),
> corroborated by independent secondary summaries. See [`SOURCES.md`](SOURCES.md)
> and [`docs/phases/01-claims-ledger.md`](docs/phases/01-claims-ledger.md).
