# Structured Output — Cheat Sheet

## What it is
- Techniques for getting Claude to return data in a predictable, machine-parseable shape (usually JSON).

## When to use it
- Feeding Claude's output into code, pipelines, or storage where shape/type matters.
- Extraction, classification, form-filling, API responses.

## Key mechanics (strongest → weakest guarantee)
- **Forced tool with `input_schema`** — the strongest guarantee.
  - Define a tool whose `input_schema` is your target shape; force it via `tool_choice` (named or `any`).
  - Claude emits a `tool_use` block whose `input` conforms to the schema — a parsed, validated object.
  - You never parse free text; you read `tool_use.input`.
- **Asking for JSON in the prompt** — weaker.
  - Claude returns text you must **parse defensively** (may include prose, markdown fences, or drift).
  - Always wrap in try/parse + validation; handle malformed output.
- **Prefill / `stop_sequences`** — constrain the shape.
  - Prefill the assistant turn (e.g. start with `{`) to force it into JSON.
  - Use a `stop_sequence` to cut generation at a boundary.

## Common traps
- Relying on "please return JSON" prompts for critical paths — no structural guarantee; parse and validate anyway.
- Forgetting that even forced-tool output should be validated against your schema on your side.
- Assuming markdown code fences won't appear — strip/parse defensively when using the prompt approach.
- Prefill left un-terminated (e.g. trailing `{`) can produce invalid JSON if the model stops early — combine with sane `max_tokens` and validation.

---
verified against official Anthropic docs as of 2026-09-09; re-check version-sensitive figures.
