# CCDV-F Readiness Scorecard

> A structured self-assessment across **all 29 official objectives**. Score each
> objective honestly, weight by domain, and read the band. These are **study
> heuristics — not Anthropic's official pass prediction.** The platform does not
> guarantee exam success or estimate real pass probability.

## How to score

For each objective, rate yourself **0–5** on this ladder (score the *lowest* level
you can't yet meet, minus one):

| Score | You can… |
|---:|---|
| 0 | Not started |
| 1 | Recognize the term |
| 2 | **Explain it** in your own words |
| 3 | **Implement it** in code |
| 4 | **Debug it** when it goes wrong |
| 5 | **Recognize the exam trap** and answer scenario questions confidently |

Aim for **≥4 on high-weight objectives**, **≥3 everywhere**.

## Score each objective (0–5)

### D1 — Agents & Workflows (14.7%)
- [ ] `d1-workflow-vs-agent` — Choose workflow vs. agent (and when *not* to use an agent) ⟶ ___
- [ ] `d1-agent-loop` — Build a custom agent loop / harness with loop guards ⟶ ___
- [ ] `d1-agent-sdk` — Construct agents with the Claude Agent SDK ⟶ ___
- [ ] `d1-orchestration` — Manager/subagent orchestration & hooks ⟶ ___

### D2 — Applications & Integration (33.1%)
- [ ] `d2-messages-api` — Messages API mechanics (stateless, roles, `stop_reason`) ⟶ ___
- [ ] `d2-streaming` — Streaming SSE and delta accumulation ⟶ ___
- [ ] `d2-vision` — Vision / multimodal inputs ⟶ ___
- [ ] `d2-prompt-caching` — Prompt caching mechanics & breakpoints ⟶ ___
- [ ] `d2-batch-vs-realtime` — Realtime vs. Batch API tradeoffs ⟶ ___
- [ ] `d2-error-handling` — Error handling & retries (429 vs 529, backoff) ⟶ ___
- [ ] `d2-config-management` — Config management & version pinning ⟶ ___

### D3 — Claude Code (3.1%)
- [ ] `d3-core-components` — Rules, Skills, Commands, Agents, Memory ⟶ ___
- [ ] `d3-config-hierarchy` — CLAUDE.md hierarchy & settings.json ⟶ ___
- [ ] `d3-modes` — Session management & headless/streaming modes ⟶ ___

### D4 — Eval, Testing & Debugging (2.6%)
- [ ] `d4-error-identification` — Error type identification & recovery ⟶ ___
- [ ] `d4-trace-analysis` — Trace analysis: integration-layer vs. model output ⟶ ___

### D5 — Model Selection & Optimization (16.8%)
- [ ] `d5-llm-fundamentals` — Tokens, context, sampling, non-determinism ⟶ ___
- [ ] `d5-model-tradeoffs` — Opus/Sonnet/Haiku tradeoffs & tiers ⟶ ___
- [ ] `d5-token-cost` — Token counting & cost management ⟶ ___
- [ ] `d5-model-migration` — Model migration & version management ⟶ ___

### D6 — Prompt & Context Engineering (11.0%)
- [ ] `d6-context-management` — Context/memory management & drift prevention ⟶ ___
- [ ] `d6-prompt-principles` — Prompt engineering principles & placement ⟶ ___
- [ ] `d6-structured-output` — Structured output & defensive parsing ⟶ ___

### D7 — Security & Safety (8.1%)
- [ ] `d7-prompt-injection` — Prompt injection & untrusted input handling ⟶ ___
- [ ] `d7-guardrails` — Guardrails, least privilege & hooks ⟶ ___
- [ ] `d7-secrets` — Identity, secrets & key management ⟶ ___

### D8 — Tools & MCPs (10.6%)
- [ ] `d8-tool-use` — Tool implementation & function calling ⟶ ___
- [ ] `d8-mcp-servers` — MCP server development ⟶ ___
- [ ] `d8-agentic-customization` — Built-in vs. custom tools vs. Skills vs. MCP ⟶ ___

---

## Compute your readiness

**Weighted readiness** reflects that domains are not equal. For each domain,
average its objective scores, divide by 5 to get a 0–1 domain readiness, then
weight by the domain's exam weight:

```
domain_readiness_d = (avg objective score in domain d) / 5
overall_readiness  = Σ ( weight_d × domain_readiness_d )   // weights already sum to 100%
readiness_percent  = overall_readiness   // already a % because weights sum to 100
```

**Worked example:** if you average 4/5 across D2's objectives, D2 contributes
`33.1% × (4/5) = 26.5` points. Sum the contribution from all eight domains for
your overall percentage.

A quick unweighted check: `(sum of all 29 scores) / 145 × 100`. Use the weighted
number as the real signal — it rewards strength where the exam actually spends its
points.

## Readiness bands (heuristic, not a pass prediction)

| Readiness | Band | What to do |
|---:|---|---|
| < 60% | Not ready | Follow the 30-day plan; focus D2 + D5 first |
| 60–75% | Developing | Drill weak domains; retake the diagnostic |
| 75–85% | Likely needs more practice | Mock exams; review every miss + distractor |
| 85–90% | Strong | Polish weak skills; timed mock at full length |
| 90%+ | Exam-ready | Final flashcard/traps pass; book with confidence |

> These bands are learning heuristics only. The real exam is criterion-referenced
> with a scaled cut score of 720/1000; this scorecard cannot and does not predict
> your actual result.

## Cross-checks before you book

- [ ] Full-length **Mock Exam** completed **timed** at ≥ your target band.
- [ ] No domain averaging below **3/5**.
- [ ] You can articulate **≥40 of the [common traps](common-traps/README.md)** without looking.
- [ ] You can answer "what should you do **first**?" scenarios by isolating the layer.
- [ ] Comfortable with **multiple-response** scoring (all-or-nothing: exact set match).
