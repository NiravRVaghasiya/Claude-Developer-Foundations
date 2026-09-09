# Kiro Operating Model

## Goal

Use Kiro as a controlled software-development system rather than a single-shot code generator.

## Phase workflow

```text
Phase
  ↓
Kiro Spec
  ↓
Requirements review
  ↓
Design review
  ↓
Implementation tasks
  ↓
Implementation
  ↓
Hooks / validation
  ↓
Specialist review
  ↓
Release gate
```

## Required specialist review

| Area | Agent |
|---|---|
| Architecture | architect |
| Curriculum | curriculum-reviewer |
| Factual accuracy | content-verifier |
| Learning science | learning-science-reviewer |
| UI/accessibility | frontend-qa |
| Testing/reliability | qa-engineer |
| Final release | release-auditor |

## Quality rule

A feature is not complete because the code compiles. It is complete when:

- requirements are satisfied
- design is coherent
- tests pass
- content validation passes
- accessibility is acceptable
- no known critical correctness issues remain
- documentation is updated where necessary

## MCP policy

Use authoritative web/documentation access for content verification.

Use browser/Playwright tooling for real UI verification if available.

Use GitHub tooling for repository/release workflows if available.

Do not add database/cloud MCPs merely because they are available. The current product is intentionally client-side.

## Content integrity

Never publish real, recalled, or reconstructed certification-exam questions. Practice questions must be original and clearly labeled as such.

Never invent product behavior. Verify current Anthropic behavior against authoritative documentation.
