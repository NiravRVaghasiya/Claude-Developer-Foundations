# MCP (Model Context Protocol) — Cheat Sheet

## What it is
- An **open protocol** that standardizes how applications expose tools, resources, and prompts to LLMs.
- **Host** (the app) runs an **MCP client**, which connects to an **MCP server** that exposes capabilities.

## When to use it
- **Build a custom MCP server** when a capability is **reusable across multiple clients/apps** (share once, use everywhere).
- **Native/custom tool** when the capability is needed by only **one app** — simpler, no protocol overhead.
- **Skill** when you want packaged, model-invoked know-how/instructions rather than a live external integration.

## Key mechanics
- **Server exposes three primitives**:
  - **Tools** — actions the model can invoke.
  - **Resources** — data/content the host can read.
  - **Prompts** — reusable prompt templates.
- **Transports**: **stdio** (local subprocess) and **HTTP** (remote/networked).
- **Discovery then invocation**: the client discovers available tools/resources from the server, then invokes them on demand.
- One host can connect to multiple servers; servers are reusable across different hosts.

## Common traps
- **Treating third-party MCP servers as trusted.** They are **untrusted** — apply **least privilege**, require **auth**, and validate what they return (indirect prompt injection).
- Granting broad permissions when narrow ones suffice.
- Building an MCP server for a single-app need where a native tool is simpler.
- Confusing MCP resources/prompts with tools — they are distinct primitives.
- Assuming server output is safe to act on — content from a server is untrusted data.

---
verified against official Anthropic docs as of 2026-09-09; re-check version-sensitive figures.
