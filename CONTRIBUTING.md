# Contributing

## Setup

```bash
npm ci          # installs all workspaces and the pre-commit hook
npm run verify  # the full gate: lint · typecheck · coverage · build
```

## The rules that keep this codebase healthy

1. **Domain logic goes in `packages/core` only.** If `api` or `web` needs a business
   rule, it imports it. The apps transport and present; they never decide.
2. **Tests move with code.** New logic ships with tests in the same commit. Coverage
   thresholds are enforced in each package's vitest config — the build fails below them.
3. **Accessibility is tested, not asserted.** UI changes must keep the per-view axe
   checks green, pair any status color with text, and preserve keyboard operability.
4. **No secrets, ever.** Configuration goes through the environment; document new
   variables in `.env.example`.
5. **Dependencies are exact-pinned.** Add one only when it earns its place — `core`
   stays dependency-free.

## Commit style

Small, focused commits; imperative subject lines ("Add gate telemetry", not "Added").
The pre-commit hook runs lint and typecheck; `npm run verify` before pushing runs
everything CI runs.
