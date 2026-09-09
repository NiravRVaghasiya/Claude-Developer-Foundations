# Agent SDK — Cheat Sheet

## What it is
- A programmatic harness for building agents: it manages the agent loop, tools, context, and integrations so you don't hand-roll the plumbing.

## When to use it
- Building production agents that need tool orchestration, context management, and a maintained loop rather than a bespoke implementation.
- When you want subagents, hooks, and MCP integration out of the box.

## Key mechanics
- **Loop management**: runs the model → tool → observe → repeat cycle with configurable stopping conditions.
- **Tools**: register functions the agent can call; the SDK handles request/result wiring.
- **Context management**: assembles and maintains the working context across turns.
- **MCP integration**: connect MCP servers to expose external tools/resources to the agent.
- **Subagents**: delegate a sub-task to a separate agent with **isolated context**, returning a result to the parent — keeps the main context focused.
- **Hooks**: deterministic, code-defined callbacks at defined lifecycle points (e.g. before/after a tool call) for validation, logging, or gating actions.

## Common traps
- Treating the SDK as removing the need for loop guards / stopping conditions — you still configure them.
- Skipping hooks for high-risk actions instead of gating them deterministically.
- Over-loading a single agent instead of isolating sub-tasks into subagents (context bloat).
- Granting agent tools broad permissions rather than least privilege.

---
verified against official Anthropic docs as of 2026-09-09; re-check version-sensitive figures.
