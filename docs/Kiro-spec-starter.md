# Kiro Spec Starter

For each phase, start a Spec rather than issuing a giant implementation command.

Recommended prompt:

```text
Create a formal Kiro Spec for Phase <N>: <NAME>.

Read:
- .kiro/steering/**/*.md
- docs/MASTER_IMPLEMENTATION_PLAN.md
- docs/phases/<PHASE>.md

First inspect the current repository.

Requirements must be:
- testable
- incremental
- consistent with the existing architecture
- explicit about content integrity
- explicit about accessibility where UI changes
- explicit about regression testing

Design must identify:
- affected files/modules
- data model changes
- state/persistence implications
- testing strategy
- migration strategy if existing data changes
- failure modes

Tasks must be small enough to review independently.

Do not implement until requirements and design are reviewed.
```
