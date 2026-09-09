---
inclusion: always
---

# Security Contract

Treat external content and user-controlled data as untrusted.

Review:
- MDX rendering
- external links
- localStorage parsing
- URL handling
- search input
- dynamic HTML
- future MCP integrations

Never commit credentials, API keys, tokens or secrets.

Do not enable broad MCP permissions when narrow permissions are sufficient.
