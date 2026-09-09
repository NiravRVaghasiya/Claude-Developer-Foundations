# Model Selection — Cheat Sheet

## What it is
- Choosing the right Claude model for a task as a cost / latency / capability trade-off — not "always pick the biggest."

## Current models (Sept 2026)
- **Opus 5** — deepest reasoning; highest cost/latency.
- **Sonnet 5** — balanced workhorse for most production tasks.
- **Haiku 4.5** — fastest, cheapest; simple/high-volume tasks.
- **Fable 5 / Mythos 5** — additional current models in the lineup.

## When to use which
- Simple/high-volume (classification, routing, extraction, short replies) → **Haiku 4.5**.
- Standard production work (chat, summarization, tool use, coding help) → **Sonnet 5**.
- Hardest multi-step reasoning where cost/latency are secondary → **Opus 5**.
- Rule of thumb: start at Sonnet; drop to Haiku if it meets quality cheaper; escalate to Opus only when Sonnet demonstrably falls short.

## Key mechanics
- **Constraints** drive the choice: latency budget, cost per call, context window needs, quality bar.
- **Sampling & non-determinism**:
  - `temperature` (0 ≈ most deterministic; higher = more varied). `top_p` for nucleus sampling — tune one, not both.
  - Even at `temperature: 0`, output is **not guaranteed identical** across runs/versions.
- **Pin exact model versions** for reproducibility. `-latest`-style aliases float to the newest version and break stability.
- **Cost levers beyond model choice**: prompt caching, batch/async APIs.
- **Migration** (new model version): run **shadow / canary** traffic + **re-run your eval suite** before switching. Don't swap blind.
- **Tokenizer differences**: newer models/tokenizers may emit **more tokens** for the same text — re-check cost and `max_tokens` after migrating.

## Common traps
- Defaulting to the most powerful model "to be safe" — wastes cost/latency and is penalized on the exam.
- Tuning `temperature` and `top_p` together.
- Assuming `temperature: 0` gives byte-identical results forever.
- Using floating aliases in production and losing reproducibility.
- Migrating models without re-running evals or re-checking token counts/pricing.

---
verified against official Anthropic docs as of 2026-09-09; re-check version-sensitive figures.
