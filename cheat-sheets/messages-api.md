# Messages API — Cheat Sheet

## What it is
- The core Anthropic endpoint for chat/completions with Claude.
- **Stateless**: the API keeps no server-side memory. You resend the full `messages[]` array every turn.
- Returns one `assistant` message per call.

## When to use it
- Any direct interaction with Claude: single-shot prompts, multi-turn chat, tool use, structured output, vision.
- Whenever you need full control over the transcript, system instructions, and sampling.

## Key mechanics
- **`messages[]`**: ordered array of turns. Each item is `{ "role": "user" | "assistant", "content": ... }`.
- **Roles alternate**: user → assistant → user → ... A conversation starts with `user`.
- **`system` is a top-level parameter** (string or array of text blocks), *not* a message. There is no `{"role": "system"}` entry.
- **`max_tokens` is required**: caps *output* tokens only. No default.
- **`content` is always an array of blocks**, even for plain text (e.g. `text`, `tool_use`). Never assume it is a string.
- **`stop_reason`** tells you why generation ended:
  - `end_turn` — Claude finished naturally.
  - `max_tokens` — hit the output cap → **response is truncated**.
  - `stop_sequence` — a configured stop string was produced.
  - `tool_use` — Claude wants you to run a tool and return results.
- **`usage`** reports `input_tokens` / `output_tokens` for cost and budgeting.
- Sampling controls: `temperature`, `top_p`, `stop_sequences` (all optional).

## Common traps
- Treating the API as stateful — it is not. Forgetting to replay prior turns loses all context.
- Putting the system prompt as a `{"role": "system"}` message — this is a validation error. Use the top-level `system` param.
- Non-alternating roles (two `user` messages in a row) — rejected.
- Assuming `content[0].text` always exists — a turn may contain `tool_use` blocks instead of / alongside text.
- Ignoring `stop_reason: max_tokens` and treating a truncated reply as complete.
- Forgetting `max_tokens` — the request fails.

---
verified against official Anthropic docs as of 2026-09-09; re-check version-sensitive figures.
