# Hooks

Kiro's hook schema varies by surface/version. Use the Kiro Agent Hooks UI to create these hooks, or translate the commands below into the current hook configuration.

Recommended hooks:

## 1. Content validation
Trigger: after changes to `content/**/*.mdx` or `content/**/*.json`

Command:
```bash
npm run validate:content
```

## 2. Type checking
Trigger: after changes to `src/**/*.ts` or `src/**/*.tsx`

Command:
```bash
npm run typecheck
```

## 3. Spec task verification
Trigger: after a spec task completes

Commands:
```bash
npm run validate:content
npm test
npm run build
```

## 4. Release gate
Trigger: before release/finalization

Commands:
```bash
npm run typecheck
npm run lint
npm run validate:content
npm test
npm run build
```

Do not make expensive full-build hooks run on every keystroke.
