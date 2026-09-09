---
inclusion: fileMatch
fileMatchPattern: ["src/**/*.tsx", "src/**/*.css"]
---

# Accessibility Contract

Target WCAG 2.2 AA.

Interactive features must support:
- keyboard navigation
- visible focus
- semantic HTML
- accessible names
- appropriate announcements
- sufficient contrast
- usable touch targets
- reduced motion preferences

Do not use ARIA where native semantic HTML is sufficient.

Test the actual interaction, not only static markup.
