# CCDV-F Cheat Sheets

Concise, exam-focused reference sheets for the Claude Developer Foundations (CCDV-F) topics. Each follows the same shape: **What it is → When to use it → Key mechanics → Common traps.**

## Index

- [Messages API](./messages-api.md) — the stateless core endpoint: `messages[]`, top-level `system`, `max_tokens`, and `stop_reason`.
- [Tool Use](./tool-use.md) — Claude requests tools, your code executes and returns `tool_result`; `tool_choice`, parallel calls, errors.
- [Structured Output](./structured-output.md) — reliably getting JSON: forced tools with `input_schema` vs. defensive parsing.
- [Streaming](./streaming.md) — SSE events and deltas; improves perceived latency, not total time.
- [Model Selection](./model-selection.md) — Haiku/Sonnet/Opus trade-offs, sampling, version pinning, and migration.
- [Prompt Caching](./prompt-caching.md) — cache a stable prefix to cut cost/latency; TTLs, multipliers, and cache-busting traps.
- [Agents](./agents.md) — workflow vs. agent, the agent loop, loop guards, stopping conditions, human-in-the-loop.
- [Agent SDK](./agent-sdk.md) — programmatic harness for loop, tools, context, MCP, subagents, and hooks.
- [MCP](./mcp.md) — open protocol connecting hosts/clients to servers exposing tools, resources, and prompts.
- [Context Engineering](./context-engineering.md) — curating the whole context window: bloat, drift, and mitigations.
- [Security](./security.md) — prompt injection (direct & indirect), untrusted content, least privilege, secrets.
- [Claude Code](./claude-code.md) — CLAUDE.md, Rules, Skills, Commands, Agents, Hooks, and headless mode.
- [Evaluation & Debugging](./evaluation-debugging.md) — golden datasets, grading methods, reproducibility, and isolating bugs.

---
verified against official Anthropic docs as of 2026-09-09; re-check version-sensitive figures.
