---
inclusion: always
---

# Architecture Rules

Respect the existing Next.js + React + TypeScript + MDX architecture.

Prefer:
- server components where client state is unnecessary
- small focused components
- typed domain models
- schema validation at content boundaries
- pure functions for scoring, SRS, mastery and recommendation logic
- localStorage only through a centralized storage abstraction
- content separated from presentation

Before adding a dependency, explain:
- why existing dependencies cannot solve the problem
- bundle/runtime impact
- maintenance impact
- whether the dependency is essential

Do not rewrite working architecture without evidence.
