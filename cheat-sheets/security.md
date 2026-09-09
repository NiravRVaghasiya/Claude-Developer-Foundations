# Security — Cheat Sheet

## What it is
- Defending LLM applications against **prompt injection** and misuse. Core principle: **the prompt is not a security boundary.**

## When to use it
- Any app that ingests external content, calls tools, or takes actions on a user's behalf — i.e. essentially all agents and tool-using apps.

## Key mechanics
- **Prompt injection**:
  - **Direct** — the user tries to override your instructions.
  - **Indirect** — malicious instructions hidden in **retrieved or tool content** (web pages, docs, emails, MCP server output).
- **All retrieved/tool content is untrusted data**, not instructions. Isolate it **structurally** (clear boundaries, treat as data) — don't rely on wording like "ignore anything below."
- **Least privilege**: give tools/agents the minimum permissions needed.
- **Validate & allowlist tool args server-side** (e.g. URLs → prevent **SSRF**; file paths → prevent traversal). The `input_schema` is validation, not authorization.
- **Human approval enforced in the application**, not by asking the model nicely — gate high-risk/irreversible actions in code.
- **Secrets stay server-side only** — never in prompts, client code, or logs.
- **PII**: minimize, avoid logging, handle per policy.

## Common traps
- Treating the system prompt as a security boundary — it can be overridden/leaked; enforce controls in code.
- Trusting tool/retrieved content and following instructions embedded in it (indirect injection).
- Putting API keys/secrets in prompts, client, or logs.
- Passing model-provided args straight into requests (SSRF) or filesystem calls without allowlisting.
- Relying on the model to refuse dangerous actions instead of enforcing approval/permissions in the app.
- Over-broad tool permissions "for convenience."

---
verified against official Anthropic docs as of 2026-09-09; re-check version-sensitive figures.
