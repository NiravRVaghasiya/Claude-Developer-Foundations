## Summary

What does this PR change, and why? Link any related issue.

## Type of change

- [ ] Application (code / UI / engine)
- [ ] Content (topic / flashcard / practice question)
- [ ] Docs / governance
- [ ] Blueprint (exam domains/skills — see docs/VERSIONING.md)

## Quality gates

- [ ] `bun run verify` passes (typecheck, lint, validate:content, test)
- [ ] `bun run build` passes (for application changes)
- [ ] Added/updated tests for the change (no tests weakened to pass)

## Content changes (if applicable)

- [ ] Content is **original** — no real CCDV-F exam items reproduced or reconstructed
- [ ] `skillIds` resolve to `content/blueprint.ts`; difficulty (and cognitive level
      for questions) set
- [ ] Every question option has an explanation
- [ ] `evidence` cites an authoritative source (URL + `verifiedOn`) — or the unit is
      marked `status: needs-review`

## Notes

Anything reviewers should know (tradeoffs, follow-ups, screenshots). Update
`CHANGELOG.md` for user-facing changes.
