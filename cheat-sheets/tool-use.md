# Tool Use — Cheat Sheet

## What it is
- A protocol where Claude can request that *your* code run a function, then use the result.
- Claude never executes anything. It emits a `tool_use` request; **your application executes** and returns a `tool_result`.

## When to use it
- Fetching live/external data (APIs, DBs), performing actions, calculations, or anything outside the model's knowledge.
- Building agents and workflows that interact with real systems.

## Key mechanics
- **Define tools** in the request: each has `name`, `description`, and `input_schema` (JSON Schema for arguments).
- **Flow per turn**:
  1. You send messages + tool definitions.
  2. Claude replies with `stop_reason: tool_use` and one or more `tool_use` blocks (each has `id`, `name`, `input`).
  3. Your code runs the tool(s).
  4. You send back a `user` message containing `tool_result` block(s), each keyed by **`tool_use_id`** matching the request.
  5. Claude continues, using the results.
- **Errors**: return the `tool_result` with `"is_error": true` and an error message so Claude can react/retry.
- **`tool_choice`**:
  - `auto` — Claude decides whether to call a tool (default when tools present).
  - `any` — Claude must call some tool.
  - `tool` (named) — force a specific tool.
  - `none` — disable tool calls.
- **Parallel tool use**: Claude may emit multiple `tool_use` blocks in one turn. Return **all** results in a **single** `user` message with multiple `tool_result` blocks.

## Common traps
- Expecting Claude to execute the tool. It only *requests*; you run it.
- Mismatched or missing `tool_use_id` on `tool_result` — results won't bind to the request.
- Splitting parallel results across multiple messages instead of one user message.
- Swallowing failures instead of returning `is_error: true` — Claude can't adapt to what it can't see.
- **`input_schema` is validation, not authorization.** A schema does not enforce permissions — check auth/allowlists server-side before acting on `input`.
- Trusting `input` values blindly (e.g. URLs, file paths) — validate server-side (SSRF, injection).

---
verified against official Anthropic docs as of 2026-09-09; re-check version-sensitive figures.
