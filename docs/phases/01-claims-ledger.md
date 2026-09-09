# Phase 01 — Source-Verification Claims Ledger

> Verification of the factual claims in the existing content against authoritative
> Anthropic documentation. Per the `source-verification` skill: every claim gets a
> strongest-available source, a verification date, and a status. Unsupported or
> ambiguous claims are marked `needs-review`.
>
> **Verification date for this sweep: 2026-09-09.**
>
> Content was rephrased for compliance with source licensing restrictions.

## Headline finding

The "futuristic" model names in the content (**Fable 5, Mythos 5, Opus 5, Sonnet 5,
Haiku 4.5, Opus 4.6/4.7/4.8**) are **real** for the current timeline (Sept 2026),
confirmed on the official Anthropic docs and newsroom. The content is substantially
accurate. The only material issue found is **imprecision on per-model cache
minimums**, corrected below. No fabricated model names were found.

## Claims

| # | Claim (as in content) | Status | Authoritative source | Notes |
|---|---|---|---|---|
| 1 | Claude Fable 5 (`claude-fable-5`) is a real, most-capable widely released model | verified | Anthropic newsroom — "Claude Fable 5 and Claude Mythos 5" (anthropic.com/news/claude-fable-5-mythos-5); Models overview (platform.claude.com/docs/en/docs/about-claude/models) | Fable 5.1 GA later (anthropic.com/claude-fable-and-mythos-5-1) |
| 2 | Claude Mythos / Mythos Preview exists (`claude-mythos-5`) | verified | Anthropic newsroom (same as #1); Models overview | Invitation-only via Project Glasswing |
| 3 | Claude Opus 5 / Sonnet 5 / Haiku 4.5 are current tier models | verified | Models overview (platform.claude.com/docs) | Opus/Sonnet moved to gen 5 mid-2026 |
| 4 | Model IDs use `claude-<family>-<version>` and should be pinned | verified | Models overview; migration guidance | Aliases float to newest |
| 5 | Prompt caching: 5-min write 1.25x, 1-hour write 2.0x, read 0.1x | verified | Anthropic pricing / prompt-caching docs (platform.claude.com/docs/en/docs/build-with-claude/prompt-caching); corroborated widely | — |
| 6 | Fable 5.1 dropped cache **reads** to 0.25x ("Fable/Mythos 5.1") | verified | anthropic.com/claude-fable-and-mythos-5-1; corroborating pricing writeups | Read price cut (~75%) drives "25% cheaper" |
| 7 | Minimum cacheable length: **512 (Opus 5 / Fable / Mythos)**, 1,024 (Sonnet/Haiku-class) | **needs-review (imprecise)** | "What's new in Claude Opus 5" (platform.claude.com/docs/en/about-claude/models/whats-new-opus-5) confirms **512 on Opus 5** | Minimums are **non-monotonic per model**: 512 Opus 5; 1,024 Opus 4.8 & Sonnet 5; 2,048 Opus 4.7 & Haiku 3.5; 4,096 Opus 4.6/4.5 & Haiku 4.5. The content's grouping is too coarse — **replace with a precise per-model table in Phase 02**. Not a fabrication; a precision fix. |
| 8 | `count_tokens` returns input tokens only, does not apply caching, is model-specific | verified | Count tokens API (platform.claude.com/docs/en/api/messages/count_tokens); anthropics/skills token-counting.md (github.com/anthropics/skills) | Free, separately rate-limited |
| 9 | Assistant-message **prefill returns 400** on Claude 4.6+ / Fable / Mythos | verified | Fable 5.1 migration guide (platform.claude.com/docs/en/models/fable-5-1/migration-guide); multiple corroborations | Replace with system-prompt / structured output |
| 10 | Newer tokenizer (4.7+/Fable/Mythos) emits **~30% more tokens**; recount when migrating | verified | Fable 5 technical harness report (huggingface.co/blog/Svngoku/...); "Opus 4.7 tokenizer tax" (ravoid.com) cites up to 1.35x | Re-check context-window fit and cost |
| 11 | Sampling params behavior on newer models | **refine in Phase 02** | Using the Messages API (platform.claude.com/docs/en/build-with-claude/working-with-messages) | `temperature`/`top_p`/`top_k` return **400 on 4.7+ and Mythos Preview**; manual extended thinking returns 400 on `claude-mythos-5` (migration guide). Content should state the exact version boundary. |

## Official CCDV-F blueprint (authoritative structure)

Source: **Claude Certified Developer – Foundations Exam Guide v1.0**, effective
July 2026 (official PDF hosted for the Anthropic Partner Academy course;
structure corroborated by the FlashGenius interactive guide, which cites the
official guide v1.0). Verified 2026-09-09.

- Format: 53 multiple-choice / multiple-response items; 120 minutes; delivered via Pearson VUE.
- Scoring: criterion-referenced; scaled 100–1000; **cut score 720**; per-domain percent-correct is informational.

| Code | Domain | Weight |
|---|---|---|
| D1 | Agents and Workflows | 14.7% |
| D2 | Applications and Integration | 33.1% |
| D3 | Claude Code | 3.1% |
| D4 | Eval, Testing, and Debugging | 2.6% |
| D5 | Model Selection and Optimization | 16.8% |
| D6 | Prompt and Context Engineering | 11.0% |
| D7 | Security and Safety | 8.1% |
| D8 | Tools and MCPs | 10.6% |

Weights sum to 100.0%.

## Actions arising

- **Phase 01 (now):** encode the 8 official domains + stable skills in `content/blueprint.ts` with source #(blueprint). Map all content to skills. Attach evidence to claim-bearing content; mark claim #7 content `needs-review`.
- **Phase 02 (curriculum):** replace the coarse cache-minimum grouping (claim #7) with a precise per-model table; sharpen the sampling-params version boundary (claim #11).

## Compliance note

All external sources are linked inline. No source is quoted beyond short factual
phrases; figures and behaviors are paraphrased. Community/secondary sources
(HuggingFace blog, independent pricing writeups) are used only to corroborate
figures that also appear in official Anthropic documentation, and are labeled as
secondary where they stand alone.

---

# Phase 02 addendum — Curriculum source verification

Verification date: **2026-09-09**. New curriculum areas grounded in authoritative
sources (official Anthropic docs preferred; secondary sources labeled).

| Area | Claim | Status | Authoritative source |
|---|---|---|---|
| Prompt caching (fix) | Minimum cacheable length is per-model & non-monotonic: 512 (Opus 5); 1,024 (Opus 4.8, Sonnet 5); 2,048 (Opus 4.7, Haiku 3.5); 4,096 (Opus 4.6, 4.5, Haiku 4.5) | verified | "What's new in Claude Opus 5" (platform.claude.com/docs/en/about-claude/models/whats-new-opus-5); per-model list corroborated by LiteLLM model-db issue #35011 (secondary) |
| Messages API | Sampling params (`temperature`/`top_p`/`top_k`) return 400 on Claude 4.7+ and Mythos Preview | verified | Using the Messages API (platform.claude.com/docs/en/build-with-claude/working-with-messages) |
| Context engineering | Context engineering = curating the optimal token set during inference; core strategies include compaction, tool-result clearing, and memory | verified | Anthropic — Effective context engineering for AI agents (anthropic.com/engineering/effective-context-engineering-for-ai-agents); platform.claude.com cookbook (context-engineering / memory) |
| Security | Defend against prompt injection with input screening, hardened system prompts, structural isolation of untrusted tool content, least privilege, and human approval for high-risk actions | verified | Anthropic — Mitigate jailbreaks and prompt injections (platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks); Anthropic research — prompt-injection defenses (anthropic.com/research/prompt-injection-defenses) |
| MCP | An MCP server exposes three primitives — tools, resources, prompts — to clients over stdio or (streamable) HTTP; MCP standardizes tool/context provision to LLMs | verified | Anthropic — Connect to external tools with MCP (code.claude.com/docs/en/agent-sdk/mcp); Model Context Protocol spec (modelcontextprotocol.io) |
| Claude Code | Headless mode runs Claude Code programmatically and exits 0 on success / non-zero on failure; configuration via CLAUDE.md hierarchy, settings.json, hooks, skills, slash commands | verified | Anthropic — Run Claude Code programmatically (code.claude.com/docs/en/headless); Claude Code docs |

Compliance note: external sources linked inline; figures paraphrased, no source
quoted beyond short factual phrases. Secondary sources (LiteLLM issue) used only
to corroborate a figure that also appears in official Anthropic docs.

---

# Phase 10 addendum — Final-audit provenance corrections

Verification date: **2026-09-09**. The final adversarial content audit surfaced
provenance issues that are corrected here.

| # | Claim | Status | Notes |
|---|---|---|---|
| 12 | Vision visual-token cost = `ceil(w/28) × ceil(h/28)` (28×28-pixel patches); older approximation was ~`w×h/750` | **needs-review** | The 28×28 patch formula is **secondary-sourced**; current official Vision docs (platform.claude.com/docs/en/build-with-claude/vision) still present a `~w×h/750` approximation. Content units teaching this (topic 08, quiz q5, `fc-vision-1`) are now `status: needs-review` until the per-model figure is confirmed against an authoritative page. |
| 13 | Vision / Files-API request size cap = **32 MB** per request | **needs-review** | The Files-API reuse pattern is sound, but the specific 32 MB cap is secondary-sourced. Quiz q6 and `fc-vision-2` are now `status: needs-review`. |
| 14 | Blueprint format (53 items / 120 min / cut 720) + 8 domain weights | verified (official) via **secondary URL** | The figures are from the official CCDV-F Exam Guide v1.0; the cited URL (flashgenius.net) is a **secondary** community guide that reproduces the official guide. Source labels in `blueprint.ts` and topics 12/13 were corrected to say "official … via FlashGenius (secondary)" rather than implying the URL is an Anthropic page. |

## Known blueprint coverage gaps (honest limitations)

The blueprint has 29 skills; content covers most, with these tracked gaps
(surfaced as non-fatal `validate:content` warnings):

- **No learning content or assessment:** `d1-orchestration` (Manager/subagent
  orchestration & hooks).
- **No dedicated assessment yet** (learning content exists): `d1-workflow-vs-agent`,
  `d1-agent-sdk`, `d2-config-management`, `d3-core-components`, `d3-config-hierarchy`.

These are low/lower-weight areas and are a tracked curriculum backlog, not defects.
