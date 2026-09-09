---
inclusion: always
---

# Testing Contract

Implementation is incomplete if relevant tests are missing.

Prefer a test pyramid:
- pure unit tests for domain logic
- component tests for interaction
- integration tests for workflows
- E2E tests for critical user journeys

Critical logic requiring strong coverage:
- SRS scheduling
- quiz scoring
- multiple-response scoring
- mastery
- diagnostic scoring
- recommendations
- progress persistence
- content validation

Run validation before declaring work complete.
