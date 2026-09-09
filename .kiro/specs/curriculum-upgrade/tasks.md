# Phase 02 — Curriculum Upgrade: Tasks

- [x] 1. Add Phase 02 source-verification addendum to `docs/phases/01-claims-ledger.md` (context engineering, security, MCP, Claude Code, per-model cache minimums).
  - _Requirements: R2.2, R2.3_

- [x] 2. Fix `content/topics/06-prompt-caching.mdx`: precise per-model cache-minimum table + note; set topic 06 `status: verified` in the index.
  - _Requirements: R1.1, R1.2, R1.3_

- [x] 3. Expand `TopicDomain` union (+ "Prompt & Context Engineering", "Security & Safety", "Claude Code & Ops").
  - _Requirements: R4.2_

- [x] 4. Author `14-prompt-context-engineering.mdx` + index entry (d6-context-management, d6-prompt-principles).
  - _Requirements: R2.1, R2.2_

- [x] 5. Author `15-security-safety.mdx` + index entry (d7-prompt-injection, d7-guardrails, d7-secrets).
  - _Requirements: R2.1, R2.2, R2.4_

- [x] 6. Author `16-mcp-and-tools.mdx` + index entry (d8-mcp-servers, d8-agentic-customization).
  - _Requirements: R2.1, R2.2_

- [x] 7. Author `17-claude-code-debugging.mdx` + index entry (d3-*, d4-trace-analysis, d1-agent-sdk, d2-config-management).
  - _Requirements: R2.1, R2.2_

- [x] 8. Add 8 original flashcards + 4 practice questions for the four new topics with full metadata.
  - _Requirements: R3.1, R3.2, R2.4_

- [x] 9. Run `validate:content`, `typecheck`, `lint`, `test`, `build`; all green. Report results and unresolved risks.
  - _Requirements: R4.1, R4.2, R4.3_

## Result

- Content grew: **13 → 17 topics, 24 → 32 flashcards, 10 → 14 questions.**
- Coverage warnings dropped **28 → 7**. Prompt-caching topic `needs-review → verified` with a precise per-model table.
- All gates green: `validate:content` (exit 0), `typecheck` clean, `test` 83/83 (13 files), `lint` clean, `build` green (24 pages, 103–108 kB unchanged). Search index regenerated to 17 topics.

## Unresolved (tracked for a later curriculum pass)
Remaining 7 coverage warnings, all non-fatal:
- `d1-orchestration` — no learning content or assessment yet (manager/subagent orchestration).
- No dedicated assessment yet for: `d1-workflow-vs-agent`, `d1-agent-sdk`, `d2-config-management`, `d3-core-components`, `d3-config-hierarchy` (these now have learning content).
These are deliberately out of scope for this weight-prioritized pass and remain visible as validator warnings.
