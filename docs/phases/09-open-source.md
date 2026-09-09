# Phase 09 — Open Source Maturity

## Execution prompt

```text
Add CI workflows, contribution guidance, content contribution rules, security policy, issue templates, release/changelog process, and documentation. Separate application releases, content releases, and blueprint versions.

Before changing code:
1. inspect the current repository and relevant existing abstractions
2. read all applicable `.kiro/steering/` guidance
3. use the relevant Kiro skill(s)
4. create or update a Kiro Spec when this is a substantial change
5. preserve working architecture unless evidence requires change

During implementation:
- make small, reviewable changes
- add tests with the feature
- update content/schema metadata as required
- avoid guessing about Anthropic behavior or certification requirements

Before completion:
- run relevant tests
- run content validation if content changed
- run typecheck/lint where available
- run production build for major phases
- report changed files, tests, failures, and unresolved risks

Do not declare success merely because the code compiles.
```

## Definition of done

Use the phase-specific requirements in the master implementation plan.
