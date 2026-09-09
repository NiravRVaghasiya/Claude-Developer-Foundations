# Context Engineering — Cheat Sheet

## What it is
- Curating the **entire context window** over the course of a task so the model always has the right information and nothing that derails it.
- Broader than **prompt engineering** (crafting a single prompt): context engineering manages the whole evolving window across many turns/tool calls.

## When to use it
- Long-running agents and multi-turn tasks where context accumulates (tool output, history, retrieved docs).
- Any workflow where the window fills up or the model starts losing the thread.

## Key mechanics
- **Problems to manage**:
  - **Context bloat** — window fills with low-value content, raising cost and burying signal.
  - **Context drift** — accumulated noise pulls the model off-task.
- **Mitigations**:
  - **Prune tool output** — trim large/irrelevant results before they re-enter context.
  - **Summarization / compaction** — condense history when it grows.
  - **Retrieval** — pull in only the relevant chunks on demand rather than holding everything.
  - **Subagent isolation** — delegate sub-tasks to agents with separate context; only the result returns.
  - **Memory** — persist durable facts outside the window and reload selectively.

## Common traps
- Confusing prompt engineering (one prompt) with context engineering (the whole window over time).
- Dumping full tool output into context unpruned → bloat and cost.
- Never summarizing → drift and window overflow on long tasks.
- Keeping everything "just in case" instead of retrieving on demand.
- Running one monolithic agent instead of isolating sub-tasks in subagents.

---
verified against official Anthropic docs as of 2026-09-09; re-check version-sensitive figures.
