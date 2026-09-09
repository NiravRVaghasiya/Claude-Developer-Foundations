# Agents — Cheat Sheet

## What it is
- **Workflow**: a system where LLM steps are orchestrated along predefined, deterministic paths.
- **Agent**: the model dynamically directs its own process — deciding tool calls and looping until a goal is met.

## When to use it
- **Prefer a deterministic workflow** when the steps are known in advance — it is more predictable, testable, and cheaper.
- Use an **agent** only when the path can't be known ahead of time and open-ended decision-making is genuinely required.

## Key mechanics
- **Agent loop**: model calls tools → observes results → decides next action → repeats until a stopping condition.
- **Loop guards**: cap iterations / tokens / wall-clock time to prevent runaway loops.
- **Stopping conditions**: goal reached, no more tool calls (`end_turn`), max steps hit, or explicit success check.
- **Human-in-the-loop**: require human approval before high-risk or irreversible actions (spend, deletes, external side effects).
- Keep tools focused, well-described, and least-privilege; give the model clear success criteria.

## Common traps
- Reaching for an agent when a simple workflow would do — added cost, latency, and unpredictability.
- No loop guard → infinite/expensive loops.
- No clear stopping condition → the agent wanders or never terminates.
- Letting the agent take irreversible actions without human approval.
- Vague tool descriptions / overlapping tools → wrong or repeated calls.

---
verified against official Anthropic docs as of 2026-09-09; re-check version-sensitive figures.
