# Comparison Tables — Exam Revision

Small, high-contrast tables for fast recall. Each has a one-line intro, then the table.

---

## Workflow vs Agent

A workflow follows predefined, code-controlled steps; an agent lets the model decide the path dynamically.

| Aspect | Workflow | Agent |
| --- | --- | --- |
| Control flow | Fixed, defined in code | Model decides next step |
| Predictability | High | Lower |
| Cost / latency | Lower, bounded | Higher, variable |
| Best for | Known, repeatable tasks | Open-ended tasks needing judgment |

---

## API call vs Tool use vs Agent

Increasing autonomy: a single call, a call plus client-side tools, or a self-directed loop.

| Aspect | API call | Tool use | Agent |
| --- | --- | --- | --- |
| Loop | None | Usually one round-trip | Multi-step loop |
| Who decides steps | You | You + model | Model |
| External actions | No | Yes (client-side) | Yes, repeatedly |
| Use for | Q&A, generation | Fetch data, act once | Multi-step goals |

---

## Native tool use vs MCP

Native tools are defined per request in your code; MCP is a reusable server protocol that exposes capabilities to any host.

| Aspect | Native tool use | MCP |
| --- | --- | --- |
| Definition | Inline `tools[]` per request | Server exposes Tools/Resources/Prompts |
| Reuse | Per-app | Shared across hosts |
| Transport | Your app code | stdio or HTTP |
| Best for | App-specific tools | Reusable, portable integrations |

---

## Subagent vs Parallel tool calls

Subagents isolate context and return distilled results; parallel tool calls run multiple tools in one turn within the same context.

| Aspect | Subagent | Parallel tool calls |
| --- | --- | --- |
| Context | Isolated per subagent | Shared, single context |
| Returns | Distilled summary | Raw tool_results |
| Overhead | Higher | Lower |
| Best for | Large/complex subtasks | Independent fetches at once |

---

## System prompt vs User prompt

The system prompt sets role and durable instructions; the user prompt carries the specific request for the turn.

| Aspect | System prompt | User prompt |
| --- | --- | --- |
| Role | Persona, rules, constraints | The actual task/question |
| Lifespan | Stable across turns | Varies per turn |
| Cache fit | Good (stable prefix) | Usually not |

---

## Prompt engineering vs Context engineering

Prompt engineering crafts the wording of instructions; context engineering curates what information enters the window.

| Aspect | Prompt engineering | Context engineering |
| --- | --- | --- |
| Focus | How you ask | What the model can see |
| Levers | Wording, examples, format | Retrieval, selection, compaction |
| Goal | Better instruction-following | Right info, minimal noise |

---

## Cache hit (read) vs Cache write

Writing a cache costs a premium once; reading it is heavily discounted on every reuse.

| Aspect | Cache write | Cache read (hit) |
| --- | --- | --- |
| 5-min TTL cost | 1.25x base input | 0.1x base input |
| 1-hour TTL cost | 2x base input | 0.1x base input |
| When | First time prefix is cached | Every subsequent reuse |
| Note | Single unreused write costs more than no cache | Same 0.1x regardless of tier written |

---

## Streaming vs Non-streaming

Streaming improves perceived latency (time to first token); it does not reduce total generation time.

| Aspect | Streaming | Non-streaming |
| --- | --- | --- |
| Delivery | Incremental tokens (SSE) | Full response at once |
| Perceived latency (TTFB) | Lower | Higher |
| Total time | Same | Same |
| Best for | Chat UX, long outputs | Batch, simple calls |

---

## Unit test vs Integration test vs Eval

Unit tests check pure logic deterministically; integration tests check workflows; evals measure model output quality, which is non-deterministic.

| Aspect | Unit test | Integration test | Eval |
| --- | --- | --- | --- |
| Scope | Single function | Multiple components | Model behavior/quality |
| Determinism | Deterministic | Mostly deterministic | Probabilistic |
| Asserts | Exact values | Workflow outcomes | Graded criteria / rubric |
| Example | Scoring math | Quiz submit flow | Answer relevance |

---

## Model selection — cost / latency / capability

Pick the smallest model that meets the quality bar; escalate for harder reasoning.

| Priority | Haiku (4.5) | Sonnet (5) | Opus (5) |
| --- | --- | --- | --- |
| Cost | Lowest | Mid | Highest |
| Latency | Fastest | Mid | Slowest |
| Capability | Good, high-volume | Balanced default | Deepest reasoning |
| Use for | Classification, routing, high throughput | General app workloads | Complex, multi-step reasoning |

Note: Fable 5 is the most capable generally available model; Mythos 5 is limited availability (Project Glasswing). Confirm exact tier names/pricing against docs before relying on them.

---

## CLAUDE.md vs Rules vs Skills vs Commands vs Agents vs Hooks

Different mechanisms for shaping agent behavior, distinguished by trigger, what they are, and use.

| Mechanism | Trigger | What it is | Use it for |
| --- | --- | --- | --- |
| CLAUDE.md | Loaded automatically at session start | Persistent project memory/context file | Standing project facts, conventions |
| Rules | Always / condition-matched | Constraints applied to the agent's work | Guardrails, standards to enforce |
| Skills | Model invokes when relevant | Packaged capability + instructions | Specialized, reusable know-how |
| Commands | User invokes explicitly (e.g. slash) | Predefined prompt/action | On-demand repeatable actions |
| Agents | Delegated to for a task | Configured specialized agent | Isolated subtasks, focused roles |
| Hooks | Fires on an event (tool/file/session) | Automation on lifecycle events | Lint on save, gate risky actions |

---

## 429 vs 529 error handling

A 429 is your account hitting a limit; a 529 is Anthropic's service being overloaded across users.

| Aspect | 429 rate_limit_error | 529 overloaded_error |
| --- | --- | --- |
| Cause | Your org exceeded RPM/ITPM/OTPM or spend cap | Anthropic infra at capacity (all users) |
| Scope | Account-specific | Service-wide |
| Retry-after header | Usually present (honor it) | Not account-specific |
| Fix | Exponential backoff + jitter, respect retry-after, cache prompts, ramp traffic | Exponential backoff + jitter, retry later, consider fallback |

---

## Extra recall facts

- Batch (Message Batches) API: asynchronous, ~50% cheaper, results within 24h (often under 1h).
- Multiple-response scoring: all-or-nothing (must select every correct option and no incorrect ones).

---

_Facts verified against official Anthropic docs as of 2026-09-09. Re-check version-sensitive figures (model lineup, pricing multipliers, error-code behavior) before relying on them._
