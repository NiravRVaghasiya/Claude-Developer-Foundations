# Security Policy

## Reporting a vulnerability

Please report security issues **privately** — do not open a public issue for
anything exploitable.

- Use GitHub's **private vulnerability reporting** (Security → "Report a
  vulnerability") if enabled for this repository, or
- Contact the maintainer through the private channel listed on the repository
  profile.

Include: a description, reproduction steps, affected files/routes, and impact.
We'll acknowledge the report, investigate, and coordinate a fix and disclosure.

## Scope

This is a **static, client-side** study site with **no backend, no accounts, and
no server-side data**. All learner progress lives in the browser's `localStorage`.
There is no server to attack and no personal data collected by the app.

In scope: XSS via rendered content, unsafe handling of untrusted input,
dependency vulnerabilities, and anything that could execute untrusted code in a
visitor's browser. Out of scope: issues requiring a modified local build, or
social-engineering of a user's own browser storage.

## Security posture (what contributors must uphold)

Per the project's security contract (`.kiro/steering/security.md`):

- **No secrets in the repository.** Never commit API keys, tokens, or credentials.
  There is no server key in this app; any example key must be a placeholder.
- **Treat external and user-controlled data as untrusted:** MDX content, external
  links, `localStorage` values (parse defensively), URL/route params, and search
  input. `localStorage` reads are already wrapped in `try/catch`; keep it that way.
- **MCP integrations** (if added later) must use **least-privilege** permissions —
  never enable broad access when narrow scopes suffice.
- Pin dependency versions; prefer well-known, maintained packages; flag anything
  that looks like typosquatting.

## Supported versions

The latest `main` is supported. Fixes land on `main` and ship in the next release.
