# Architecture Patterns — Diagrams

Fast-revision diagrams for the CCDV-F exam. Each diagram has a one-line caption. Read the caption, then the diagram.

Current model baseline (2026-09): Claude Fable 5 (most capable GA), Claude Mythos 5 (limited availability, Project Glasswing), Opus 5, Sonnet 5, Haiku 4.5.

---

## 1. Messages API — request/response (stateless)

The API is stateless: the server keeps no memory, so the full `messages[]` array is resent on every turn.

```mermaid
sequenceDiagram
    participant App as Application
    participant Claude
    App->>Claude: POST /messages { model, system, messages[] }
    Note over App,Claude: Full conversation history resent each turn
    Claude-->>App: assistant message (content, stop_reason, usage)
    Note over App: App appends reply, resends messages[] next turn
```

---

## 2. Tool use loop

Claude never runs tools; it emits `tool_use`, the application executes client-side and returns a `tool_result` keyed by `tool_use_id`.

```mermaid
sequenceDiagram
    participant App as Application
    participant Claude
    App->>Claude: messages[] + tools[] definitions
    Claude-->>App: stop_reason "tool_use" (id, name, input)
    App->>App: Execute tool client-side
    App->>Claude: tool_result (matched to tool_use_id)
    Claude-->>App: final answer (stop_reason "end_turn")
```

---

## 3. Agent loop

Claude drives toward a goal by looping tool_use -> execute -> observation until it stops with `end_turn`; a max-iteration guard prevents runaway loops.

```mermaid
flowchart TD
    A[Goal] --> B[Claude]
    B -->|tool_use| C[Execute tool]
    C -->|observation / tool_result| B
    B -->|end_turn| D[Final answer]
    B -.->|iteration limit reached| E[Stop: loop guard]
```

---

## 4. MCP architecture

MCP standardizes how a host connects to servers that expose Tools, Resources, and Prompts over stdio or HTTP transport.

```mermaid
flowchart LR
    Host[Host application] --> Client[MCP Client]
    Client -->|stdio or HTTP| Server[MCP Server]
    subgraph Server capabilities
        T[Tools]
        R[Resources]
        P[Prompts]
    end
    Server --> T
    Server --> R
    Server --> P
```

---

## 5. Multi-agent (orchestrator / workers)

A manager delegates to specialized subagents; each runs in isolated context and returns only distilled results, keeping the manager's context clean.

```mermaid
flowchart TD
    M[Manager / Orchestrator] -->|delegate| R[Research subagent]
    M -->|delegate| C[Coding subagent]
    M -->|delegate| V[Review subagent]
    R -->|distilled result| M
    C -->|distilled result| M
    V -->|distilled result| M
    Isolated[Each subagent has isolated context] -.-> R
```

---

## 6. Security trust boundary

Untrusted data (retrieved content, tool output) crosses into the model; authorization and secret access are enforced in the application, never in the prompt.

```mermaid
flowchart TD
    User[User input - untrusted] --> Model
    Ext[External / retrieved data - untrusted] --> Model
    ToolOut[Tool output - untrusted] --> Model
    subgraph Trusted[Trusted application boundary]
        App[Application logic]
        Authz[Authorization checks]
        Secrets[(Secrets / credentials)]
    end
    Model -->|proposed action / tool_use| App
    App --> Authz
    Authz -->|allowed| Secrets
    Authz -->|denied| Reject[Reject action]
    Guard[Model output is never trusted to self-authorize] -.-> Model
```

---

## 7. The escalation ladder

Use the simplest approach that works; climb only when the task demands it.

```mermaid
flowchart LR
    A[Simple API call] --> B[Tool-using app]
    B --> C[Deterministic workflow]
    C --> D[Custom agent loop]
    D --> E[Multi-agent system]
```

---

_Facts verified against official Anthropic docs as of 2026-09-09. Re-check version-sensitive figures (model lineup, pricing multipliers) before relying on them._
