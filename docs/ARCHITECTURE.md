# Architecture

Matchday is an npm-workspaces monorepo with a strict dependency direction:

```text
        ┌──────────────┐
        │ @matchday/   │   pure functions, zero dependencies,
        │    core      │   Node and browser alike
        └──────┬───────┘
       imports │ imports
   ┌───────────┴───────────┐
┌──┴─────────┐      ┌──────┴──────┐
│ @matchday/ │      │ @matchday/  │
│    api     │      │    web      │
└────────────┘      └─────────────┘
```

**Layering rule: all domain logic lives in `core`; `api` and `web` only transport and
present it.** Neither app implements a business rule, and the two apps never import each
other. This is what lets the static demo and the live service give identical answers.

## `core` — the domain

- **Crowd model** (`crowd.ts`): occupancy → persons/m² → Fruin walkway Level-of-Service
  grade A–F. Band thresholds are named constants cited to Fruin's *Pedestrian Planning
  and Design* and the SGSA Green Guide. `assessVenue` produces the worst-first zone list
  and concrete redirect actions in a single pass.
- **Wayfinder** (`wayfinder.ts`): Dijkstra over an undirected walking graph. Edge cost is
  metres × a congestion factor from the zone's current LOS grade, so routes bend around
  crowds; a `stepFreeOnly` option drops stair edges entirely.
- **Concierge fallback** (`concierge.ts`): multilingual keyword scoring over seven
  service intents with curated replies — deterministic, so the assistant always answers.
- **Venue data** (`stadium.ts`): zones, walking graph, and a demo occupancy snapshot.
  Invariant tests keep the data internally consistent (no dangling references; a
  step-free route exists from every gate to every stand).

Everything is a pure function; `RangeError`s guard invalid input at the boundary.

## `api` — transport and Gemini

- **Fastify** with **TypeBox** schemas: one schema definition gives both compile-time
  types and runtime request validation.
- **Gemini proxy** (`gemini.ts`): the key lives only in the server environment and is
  sent in the `x-goog-api-key` header — never in a URL, never to the browser. The fetch
  implementation is injectable, so tests exercise the client with no network.
- **Dependency injection**: `buildApp({ gemini })` receives the client; tests pass a stub
  and drive the app through `app.inject()` without sockets.
- **Graceful degradation**: any Gemini failure logs a warning and answers from the core
  heuristic engine; the response is tagged `origin: "gemini" | "heuristic"`.
- **Hardening**: helmet security headers, CORS restricted to the console origin, a 32 kB
  body limit, per-client rate limiting, and an LRU-TTL cache that answers repeated
  questions without spending quota.

## `web` — presentation

- **Preact** keeps the whole console at roughly 14 kB gzipped; each view is a lazy chunk
  loaded on first open.
- **One design-token set** drives dark and light themes; contrast ratios are documented
  in `styles.css`, and the three LOS status colors were validated for color-vision
  deficiency separation on both surfaces. Every colored mark is paired with its letter
  grade, so state is never conveyed by color alone.
- **Accessibility as construction**: semantic landmarks, a skip link, labelled controls,
  `aria-live` regions for async content, the flow board as a real `<table>`, and
  `prefers-reduced-motion` respected globally. Each view is asserted violation-free with
  axe in the test suite.
- **Strict CSP** (`default-src 'self'`, no `unsafe-*`) injected into the production HTML
  at build time; the app is fully self-contained.

## Testing strategy

Each package owns its suite; coverage thresholds are enforced in every vitest config, so
`npm run verify` fails on under-tested code. Core is tested as pure functions, the API
through injected HTTP, and the web through Testing Library with axe assertions.
