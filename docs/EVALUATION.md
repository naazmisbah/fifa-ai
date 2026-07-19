# Rubric evidence

Where to find the evidence for each evaluation dimension of the PromptWars rubric.

| Dimension | Evidence |
| :--- | :--- |
| **Code Quality** | One domain model in `packages/core` imported by both apps — no duplicated logic anywhere. Strict TypeScript everywhere including `noUncheckedIndexedAccess`. Every threshold is a named, source-cited constant (Fruin LOS bands in `core/src/crowd.ts`). Small single-purpose modules (largest source file ≈ 130 lines). Exact-pinned dependencies, lint with explicit rule categories, pre-commit hooks (`.githooks/`), Dependabot, `.editorconfig`, `CONTRIBUTING.md`, `CHANGELOG.md`, `SECURITY.md`, `LICENSE`. |
| **Security** | Gemini key server-only, sent in the `x-goog-api-key` header (`api/src/gemini.ts`); no secrets in the repo (`.env` ignored, `.env.example` shipped). Helmet headers, CORS lock-down, 32 kB body cap, per-client rate limiting (`api/src/app.ts`). Static console ships a strict CSP with no `unsafe-*` (`web/vite.config.ts`). CI actions pinned to commit SHAs; `SECURITY.md` documents reporting. |
| **Efficiency** | Whole console ≈ 14 kB gzipped (Preact, no CSS framework); each view is a lazy chunk loaded on first open (`web/src/app.tsx`). API answers repeated questions from an LRU-TTL cache instead of re-invoking Gemini (`api/src/cache.ts`). Venue assessment is a single pass; the demo snapshot is computed once (`api/src/routes.ts`). Zero runtime dependencies in `core`. |
| **Testing** | 95 tests across three suites, each with coverage thresholds enforced in config (90 % lines/statements, 85 % branches — the build fails below them). Pure-function tests in core incl. venue-data invariants; API driven through injected HTTP with a stubbed Gemini client; web tested with Testing Library plus an axe accessibility assertion per view. All gated in CI on every push. |
| **Accessibility** | Semantic landmarks, skip link, labelled controls, `aria-live` async regions, real-`<table>` flow board, focus-visible outlines, `prefers-reduced-motion`. LOS status colors validated for CVD separation on both themes, letter grades always accompany color, contrast ratios documented in `web/src/styles.css`. Step-free routing is a first-class product feature, not an afterthought. |
| **Problem Statement Alignment** | The brief's pillars are the three consoles: multilingual assistance (Concierge + Gemini), crowd management (Flow board + Fruin LOS + operator actions), and accessible navigation (Wayfinder with congestion-aware, step-free routing). The features interlock: crowd grades weight the router; the concierge directs fans to the wayfinder. |

## CI

`.github/workflows/ci.yml` runs lint → typecheck → tests with coverage → build on every
push and pull request. `deploy.yml` publishes the static console to GitHub Pages with a
rename-proof base path. Both workflows pin actions to full commit SHAs.
