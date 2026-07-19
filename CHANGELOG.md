# Changelog

## [1.0.0] - 2026-07-19

Initial release.

### Added
- `@matchday/core`: Fruin Level-of-Service crowd model with cited thresholds,
  congestion-aware Dijkstra wayfinding with a step-free mode, multilingual concierge
  intent engine, and an internally invariant-tested venue model.
- `@matchday/api`: Fastify service with TypeBox-validated routes, a server-side Gemini
  proxy with heuristic fallback tagged by origin, an LRU-TTL answer cache, rate
  limiting, security headers, and structured logging.
- `@matchday/web`: ~14 kB Preact console — Concierge, Flow board, and Wayfinder as
  lazy-loaded views; dark/light themes from one validated token set; strict CSP; axe
  accessibility assertions per view.
- Tooling: npm workspaces, strict TypeScript with `noUncheckedIndexedAccess`, 95 tests
  with enforced coverage thresholds, pre-commit hooks, Dependabot, SHA-pinned CI, and a
  GitHub Pages deploy with a rename-proof base path.
