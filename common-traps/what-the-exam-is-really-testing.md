# What the CCDV-F Is Really Testing

> The exam is not vocabulary. It tests whether you can **reason like a developer
> building production Claude applications** — choosing architectures, isolating
> failures, and making cost/latency/security tradeoffs. Learn to read the *intent*
> behind a question and the answer usually reveals itself.

## The underlying competencies

Every question is really probing one (or more) of these abilities:

1. **API mechanics** — statelessness, roles, `stop_reason`, streaming, errors.
2. **Application architecture** — where state, execution, and authorization live.
3. **Model selection** — capability vs. cost vs. latency under real constraints.
4. **Tool execution** — the `tool_use` → `tool_result` contract; who runs what.
5. **Agents** — when a loop is warranted, when a workflow is safer.
6. **MCP** — the protocol, its boundaries, and when to reach for it.
7. **Context** — curating the window so reliability doesn't decay over a long task.
8. **Security** — treating model output and retrieved content as untrusted.
9. **Reliability** — retries, idempotency, graceful degradation.
10. **Evaluation** — proving behavior with datasets, isolating the failing layer.
11. **Production tradeoffs** — the "best answer" is the one that survives real load.

## Reading the intent behind a question

Certification questions describe a *symptom* and ask for the *right move*. Map the
symptom to the competency:

| If the scenario describes… | Think about… |
|---|---|
| Increasing **latency** | model selection, token count, prompt caching, streaming, or architecture |
| Rising **cost** | smaller model, caching, batch, trimming context, shorter output |
| Unexpected **tool behavior** | tool schema quality, `tool_choice`, `tool_result`/`tool_use_id` pairing, client-side execution, server-side validation |
| An agent that gets **more confused over time** | context bloat/drift — pruning tool output, compaction, retrieval, or subagent isolation |
| A **400 / structural** error | your integration (roles, message shape, schema, pairing), not the model |
| Wrong **content** on a valid 200 | prompt, context, examples, or model choice — and your evals |
| A page/tool telling Claude to do something dangerous | untrusted input; enforce in the **application**, not the prompt |
| "**What should I do first?**" | isolate the layer / measure before changing anything |
| "**Which architecture is most appropriate?**" | the simplest thing that meets the requirement (call → tool → workflow → agent → multi-agent) |
| **Truncated** output | `stop_reason: max_tokens` — raise the cap or continue |
| Needs **reproducibility** | pin the model version, set temperature 0, hold prompt/tools constant (still not byte-identical) |

## Answer patterns the exam rewards

- **Enforce in the application, not the prompt.** Authorization, secret handling,
  URL allowlisting, and human approval are code, not instructions.
- **Prefer the simplest architecture that works.** A deterministic workflow beats
  an agent when the steps are known.
- **Treat model output and retrieved content as untrusted.** Validate before
  acting; isolate untrusted data structurally.
- **Measure/isolate before you fix.** Read the trace; decide integration vs.
  model-output first.
- **Pick the model by the constraint that dominates** (cost, latency, or
  capability) — not "the smartest one."
- **The right answer is production-shaped:** it handles the error, bounds the loop,
  caps the tokens, and degrades gracefully.

## Distractor patterns to distrust

- Options that make the **prompt a security boundary**.
- Options that assume **server-side conversation memory**.
- Options that say the model **executes your tools** or that a schema **authorizes**
  a call.
- Options that reach for the **biggest model** or **more reasoning** by reflex.
- Options that **retry a 4xx** or treat a spend-cap 429 as transient.
- Options that add **more context / more steps** as the fix for unreliability.

> These are reasoning heuristics, not a guarantee. The exam is criterion-referenced
> (scaled 100–1000, cut 720); this guide builds judgment, it does not predict a
> result. Verified against official Anthropic docs as of 2026-09-09.
