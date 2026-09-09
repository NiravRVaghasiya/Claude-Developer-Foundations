# Phase 02 — Curriculum Upgrade: Design

## Approach

Add four new MDX topics following the exact structure of the existing 13 (Core
Concept → Annotated Code → tables → Mental Model → Common Traps (Callout) →
Exam Tips → Scenario Challenges (RevealAnswer)). Register each in
`content/topics.index.ts` with Phase 01 metadata. Add original flashcards and
questions. No schema or component changes.

## New topics & files

| Order | File | id / slug | Domain grouping (sidebar) | skillIds |
|---|---|---|---|---|
| 14 | `14-prompt-context-engineering.mdx` | `prompt-context-engineering` | new "Prompt & Context Engineering" | d6-context-management, d6-prompt-principles |
| 15 | `15-security-safety.mdx` | `security-safety` | new "Security & Safety" | d7-prompt-injection, d7-guardrails, d7-secrets |
| 16 | `16-mcp-and-tools.mdx` | `mcp-and-tools` | "Tools & MCPs" | d8-mcp-servers, d8-agentic-customization |
| 17 | `17-claude-code-debugging.mdx` | `claude-code-debugging` | new "Claude Code & Ops" | d3-core-components, d3-config-hierarchy, d3-modes, d4-trace-analysis, d1-agent-sdk, d2-config-management |

`TopicDomain` union expands to add "Prompt & Context Engineering", "Security &
Safety", and "Claude Code & Ops" (additive; existing values unchanged). This is
the minimal schema touch needed and keeps the sidebar coherent. The domains are
ordered after existing groups.

## Provenance

Every new topic carries `evidence[]` pointing at official Anthropic docs verified
2026-09-09 (recorded in `docs/phases/01-claims-ledger.md`, Phase 02 addendum):
- Context engineering: anthropic.com/engineering/effective-context-engineering-for-ai-agents; platform.claude.com cookbook (compaction/memory).
- Security: platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks; anthropic.com/research/prompt-injection-defenses.
- MCP: code.claude.com/docs/en/agent-sdk/mcp; modelcontextprotocol.io.
- Claude Code: code.claude.com/docs/en/headless; Claude Code settings/hooks docs.

## Content-quality bar (per topic)

Objective, core concepts, one annotated code/example, a tradeoffs or reference
table, ≥1 `Callout type="trap"`, exam tips, ≥1 `RevealAnswer` scenario. Difficulty
and (for questions) cognitive level set honestly. Any unsourced specific figure →
`needs-review`.

## Assessment

Add ≥2 flashcards and ≥1 question per new topic (originals), mapped to the topic's
skills with difficulty/cognitiveLevel/evidence. Target: clear the "no learning
content" and "no assessment" warnings for the covered skills.

## Sequencing (keep green at each step)
1. Fix topic 06 (prompt-caching) precision + status.
2. Add topic 14, then 15, 16, 17 (MDX + index entry) one at a time.
3. Add flashcards + questions.
4. Run validate:content (warnings should shrink), typecheck, tests, lint, build.

## Non-goals
- Not covering d1-orchestration or every remaining skill this phase; remaining
  gaps stay as tracked warnings for a later curriculum pass.
- No diagnostic/adaptive/simulator features (Phases 4–6).
- No MDX component or rendering changes.
