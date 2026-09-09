# Prompt Caching — Cheat Sheet

## What it is
- A feature that caches a stable **prefix** of your prompt so repeated requests reuse it instead of reprocessing, cutting cost and latency.

## When to use it
- Large, stable content reused across many calls: long system prompts, tool definitions, documents, few-shot examples.
- High call volume against the same prefix.

## Key mechanics
- You mark a **cache breakpoint** after the stable content; everything up to it becomes the cached prefix.
- Place cacheable, unchanging content **first**; put variable content (the user's latest input) **after** the breakpoint.
- **Pricing multipliers (relative to base input tokens)**:
  - 5-minute TTL: **write 1.25x**, **read 0.1x**.
  - 1-hour TTL: **write 2.0x** (read still cheap).
- Reads are dramatically cheaper than reprocessing, so caching pays off when the prefix is reused enough within the TTL.
- **Per-model minimum cacheable length varies** — a prefix shorter than the minimum won't cache.

## Common traps
- **Timestamp / dynamic value inside the cached block** — any change (e.g. "current time: ...") busts the cache every call. Keep cached content byte-stable.
- Putting variable content before stable content — nothing gets reused.
- Expecting savings on the first call — the initial **write costs more** (1.25x / 2.0x); savings come from subsequent reads.
- Caching content below the per-model minimum length — no cache created.
- Letting the TTL expire between calls — the next call is a write, not a read.

---
verified against official Anthropic docs as of 2026-09-09; re-check version-sensitive figures.
