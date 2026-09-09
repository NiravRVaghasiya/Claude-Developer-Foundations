# Common Certification Traps (CCDV-F)

An original study reference of common misconceptions developers hold when preparing for the Anthropic Claude Developer Foundations (CCDV-F) exam. Each entry names a trap and gives a one-line correction. These are original study aids, not exam questions.

Timeline context: as of September 2026, the current model generation includes Fable 5, Mythos 5, Opus 5, Sonnet 5, and Haiku 4.5.

---

## D1 — Agents & Workflows

**1. Trap:** An agent is automatically better than a workflow. **Reality:** Prefer a deterministic workflow when the steps are known in advance; reserve agents for open-ended tasks where the path can't be predetermined.

**2. Trap:** Agents should be given every tool available "just in case." **Reality:** Fewer, well-scoped tools reduce confusion and error; give an agent only the tools its task actually needs.

**3. Trap:** An agent loop ends on its own once the task feels done. **Reality:** Your application controls the loop; you keep calling the API until `stop_reason` is `end_turn` (or you hit your own budget/guardrail), not until the model "feels" finished.

**4. Trap:** More agent steps always produce a better result. **Reality:** Longer loops accumulate context bloat and cost, often degrading reliability; bound the loop with clear stop conditions.

**5. Trap:** A single monolithic agent is the best design for complex work. **Reality:** Decomposing into focused subagents or a workflow of steps is usually more reliable and easier to debug.

**6. Trap:** The agent decides when to stop calling tools. **Reality:** The model requests tools, but your orchestration code decides whether to execute, continue, or halt.

**7. Trap:** Adding memory means the model remembers across calls by itself. **Reality:** Any persistence (memory, state, history) is something your application stores and re-supplies; the model has no built-in cross-call memory.

**8. Trap:** Evaluating an agent is the same as evaluating a single prompt. **Reality:** Agents need trajectory- and outcome-level evaluation across multi-step runs, not just single-response scoring.

---

## D2 — Applications & Integration

**9. Trap:** Claude maintains conversation state for my application. **Reality:** The API is stateless; you must resend the full `messages[]` history on every request to preserve context.

**10. Trap:** Claude executes the client-side tools I define. **Reality:** Claude only emits a `tool_use` request; your code runs the tool and returns the result as a `tool_result`.

**11. Trap:** Structured output is just asking the model nicely for JSON. **Reality:** For reliable structured data, force a tool with a defined `input_schema` rather than relying on free-text formatting instructions.

**12. Trap:** A `stop_reason` of `max_tokens` means the model finished its answer. **Reality:** `max_tokens` means the response was truncated at the limit; the output is incomplete and you must handle continuation.

**13. Trap:** A 400 error usually means the model is broken. **Reality:** A 400 is almost always a bug in your own integration (malformed request, bad schema, invalid content blocks), not a model failure.

**14. Trap:** The system prompt is a message with a `"system"` role inside `messages[]`. **Reality:** There is no `system` role in `messages[]`; the system prompt is a separate top-level `system` parameter.

**15. Trap:** You should retry every error with backoff. **Reality:** Retry transient errors (429 rate limits, 5xx); do not retry 400/401/403, which are deterministic client-side failures that won't fix themselves.

**16. Trap:** A spend-cap 429 will clear if you back off and retry. **Reality:** A spend-cap 429 carries no `retry-after` and won't clear with backoff; it requires raising the cap or waiting for the billing window, not retrying.

**17. Trap:** Streaming makes the total response faster. **Reality:** Streaming reduces perceived latency by delivering tokens incrementally; it does not reduce total generation time.

**18. Trap:** The Batch API is a faster path for interactive requests. **Reality:** The Batch API is asynchronous and roughly 50% cheaper, but it is for non-interactive workloads, not low-latency user-facing calls.

**19. Trap:** Parallel tool calls come back as separate user messages. **Reality:** Parallel `tool_use` results are returned as multiple `tool_result` blocks inside one user message, each keyed by its `tool_use_id`.

**20. Trap:** Any `tool_result` order works as long as the tools ran. **Reality:** Each `tool_result` must reference the matching `tool_use_id`; results are correlated by ID, not by position.

**21. Trap:** Token counting reflects what I'll actually be billed after caching. **Reality:** The count-tokens endpoint returns input tokens only and ignores cache reads/writes, so it isn't a billing figure.

**21a. Trap:** Putting a per-request timestamp (or any changing value) inside a cached block is harmless. **Reality:** Any change within the cached prefix — including a dynamic timestamp or request id — changes the hash and misses the cache, forcing a fresh write every call; keep volatile values *after* the cache breakpoint.

**22. Trap:** More output detail is free if I don't set `max_tokens`. **Reality:** Output tokens are billed and bounded; set `max_tokens` deliberately and handle truncation, because longer output costs more and can be cut off.

**23. Trap:** Errors from the API can be shown raw to end users. **Reality:** Treat API errors as internal signals; map them to safe, user-appropriate messages and handle retryable vs. non-retryable cases in code.

---

## D5 — Model Selection

**24. Trap:** The highest-intelligence model is always the right choice. **Reality:** Model choice is a tradeoff of capability, cost, and latency; smaller/faster models are often the better fit for well-scoped tasks.

**25. Trap:** More reasoning (extended thinking) always improves the answer. **Reality:** Extended reasoning adds latency and cost and isn't always better; enable it when the task genuinely benefits, not by default.

**26. Trap:** Floating model aliases are safe to use in production. **Reality:** Aliases can shift to a newer version underneath you and change behavior; pin a specific model version for reproducibility.

**27. Trap:** A newer model is always a drop-in upgrade. **Reality:** Model upgrades can change output style and tool behavior; migrate deliberately and re-test prompts and evals before switching.

**28. Trap:** Temperature 0 guarantees identical outputs every time. **Reality:** Temperature 0 is greedy decoding but not a determinism guarantee; outputs can still vary.

**29. Trap:** One model should handle every step of a pipeline. **Reality:** Routing simpler steps to cheaper/faster models and hard steps to stronger models often gives better cost/latency without losing quality.

**30. Trap:** Bigger context windows mean I should always send more. **Reality:** A large context window is a capacity limit, not a target; irrelevant context adds cost and can degrade reliability.

**31. Trap:** Model selection is a one-time decision. **Reality:** Model options and pricing evolve; revisit selection as new versions ship and as your workload's cost/latency needs change.

**32. Trap:** Latency and cost are the same optimization. **Reality:** They are distinct axes — a model can be cheaper but slower, or faster but pricier — so choose based on which constraint dominates your use case.

---

## D6 — Prompt & Context Engineering

**33. Trap:** More context is always better. **Reality:** Context bloat dilutes relevant signal and degrades reliability; include only what the task needs.

**34. Trap:** Prompt instructions enforce a security boundary. **Reality:** Prompts are guidance, not enforcement; a determined input can override instructions, so real controls belong in your application.

**35. Trap:** Examples in a prompt are optional polish. **Reality:** Well-chosen examples (few-shot) often improve reliability and format adherence more than longer instructions.

**36. Trap:** Ordering of prompt content doesn't matter. **Reality:** Placement matters — stable, reusable context up front (cache-friendly) and task-specific instructions positioned clearly improves results and caching.

**37. Trap:** The model reliably follows format rules buried mid-prompt. **Reality:** Critical constraints should be explicit and well-placed; relying on the model to catch buried rules is fragile compared to structured/forced output.

**38. Trap:** Bigger prompts are the fix when quality is low. **Reality:** Clarity, structure, and relevant context usually beat length; trim and sharpen before adding more text.

---

## D7 — Security & Safety

**39. Trap:** Model output can be treated as trusted application logic. **Reality:** Model output is untrusted; validate, sanitize, and constrain it before acting on it in your system.

**40. Trap:** Content returned from tools or retrieval is trusted data. **Reality:** Retrieved and tool-returned content is untrusted input and can carry indirect prompt injection; treat it as adversarial.

**41. Trap:** Indirect prompt injection only comes from the user's message. **Reality:** Injection can hide inside fetched pages, documents, or tool outputs the model reads; sanitize and isolate that content.

**42. Trap:** Human-in-the-loop approval can be enforced by instructing the model. **Reality:** Approval gates must be enforced in your application code, not requested in the prompt.

**43. Trap:** API keys are fine to include in prompts or ship to the client. **Reality:** Keys must never appear in prompts, client code, or logs; keep them server-side in secure configuration.

**44. Trap:** A tool that accepts model-generated URLs is harmless. **Reality:** Fetching model-supplied URLs is an SSRF and data-exfiltration risk; validate, allowlist, and restrict outbound requests.

---

## D8 — Tools & MCPs

**45. Trap:** Tool schemas act as authorization and validation. **Reality:** Schemas describe shape to the model only; you must validate and authorize every tool call server-side.

**46. Trap:** Tool descriptions replace application-side validation. **Reality:** Descriptions guide the model's choices but enforce nothing; validate arguments and permissions in your own code.

**47. Trap:** MCP is just another name for native tool use. **Reality:** MCP is a protocol for connecting external servers/resources; it is not synonymous with the API's built-in tool-use mechanism.

**48. Trap:** Tools should be granted broad access for convenience. **Reality:** Apply least privilege — each tool gets the minimum scope and permissions required for its job.

**49. Trap:** Enabling an MCP server safely exposes all its capabilities. **Reality:** Grant only the narrow MCP permissions a task needs; broad permissions expand the attack surface unnecessarily.

**50. Trap:** A `tool_use` block is a completed action. **Reality:** It is a request; nothing happens until your code executes it and returns a `tool_result`, so failures and denials are yours to handle.

---

## D3 — Claude Code

**51. Trap:** Headless Claude Code signals success through its stdout text. **Reality:** In headless/automation mode, success is signaled by the process exit code, not by parsing printed output.

**52. Trap:** Guidance in CLAUDE.md is a guaranteed hook that always runs. **Reality:** CLAUDE.md is context/guidance, not an enforced hook; use actual hooks when you need guaranteed execution.

**53. Trap:** Skills and Commands are the same kind of extension. **Reality:** Skills are model-invoked (the model decides to use them), while Commands are user-invoked (you trigger them explicitly).

**54. Trap:** Subagents share the main conversation's context. **Reality:** Subagents run with isolated context, which keeps the main context clean but means you must pass in what they need.

---

## D4 — Eval, Testing & Debugging

**55. Trap:** If the output looks right once, the prompt is done. **Reality:** A single good sample isn't evidence; use a repeatable eval set to measure reliability across varied inputs.

**56. Trap:** Non-determinism means you can't test model behavior. **Reality:** You test with evals over datasets and acceptance criteria, measuring pass rates rather than expecting a single fixed output.

**57. Trap:** A 400 during development is a debugging dead end. **Reality:** A 400 is a precise signal pointing at your request construction; read the error detail and fix the malformed field, schema, or content block.

**58. Trap:** Eval scores from one model version carry over after an upgrade. **Reality:** Re-run your eval suite after any model or prompt change, since behavior and scores can shift between versions.

---

_These are study aids, verified against official Anthropic documentation as of 2026-09-09; version-sensitive figures should be re-checked against current docs. They do not reproduce real exam questions._
