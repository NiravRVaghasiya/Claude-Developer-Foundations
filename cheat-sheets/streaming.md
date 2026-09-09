# Streaming — Cheat Sheet

## What it is
- Server-Sent Events (SSE) delivery of a response incrementally as it is generated, instead of one final payload.

## When to use it
- Interactive UIs (chat, typing effect) where you want output to appear as soon as possible.
- Long responses where waiting for the full result feels slow.

## Key mechanics
- Set `stream: true`; the API returns an SSE event stream.
- **Event sequence (typical)**:
  - `message_start` — metadata, empty message shell.
  - `content_block_start` — a new block begins.
  - `content_block_delta` — incremental pieces; for text these are `text_delta`.
  - `content_block_stop` — block complete.
  - `message_delta` — top-level updates (e.g. `stop_reason`, cumulative `usage`).
  - `message_stop` — stream complete.
- **Reconstruct** the full message by accumulating deltas in order (concatenate `text_delta` text, assemble blocks by index).
- **Latency**: streaming improves **perceived** latency (time to first byte / first token). It does **not** reduce total generation time.

## Common traps
- Believing streaming makes generation faster overall — it only surfaces tokens sooner.
- Reading only one event and treating it as the whole message — you must accumulate all deltas.
- Ignoring `message_delta` — that's where final `stop_reason` and usage totals arrive.
- Not handling stream interruptions/reconnects — partial output must be discarded or resumed cleanly.
- Assuming a single text block — multiple content blocks (e.g. `tool_use`) stream with their own indices.

---
verified against official Anthropic docs as of 2026-09-09; re-check version-sensitive figures.
