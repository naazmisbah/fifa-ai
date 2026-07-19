<div align="center">

# ⚽ Matchday

### FIFA 2026 Stadium Intelligence

**A multilingual concierge, a live crowd flow board, and a step-free wayfinder for
World Cup 2026 venues — Gemini-assisted, accessible by construction, and always
functional offline.**

[Architecture](docs/ARCHITECTURE.md) · [Rubric evidence](docs/EVALUATION.md) · [Security policy](SECURITY.md)

</div>

---

## What it does

| Console | For | How |
| :--- | :--- | :--- |
| **Concierge** | Fans | Ask anything in any language. Answers come from **Gemini** through a secure server proxy; without a key or network, a deterministic multilingual intent engine answers instead. Every reply is labelled with its origin. |
| **Flow board** | Operations staff | Zone occupancy graded on the **Fruin walkway Level-of-Service scale** (persons/m², cited in code). The board names concrete actions: *"Redirect fans from Gate South (LOS F) to Gate East (LOS B)."* |
| **Wayfinder** | Everyone | Shortest-path routing (Dijkstra) over the stadium walking graph, **weighted away from congested zones** and filterable to **step-free** ramps and lifts only. |

The three features share one brain: crowd grades feed the router's edge weights, and the
concierge points fans at the wayfinder — one domain model, used everywhere.

## Architecture

```text
packages/
  core   pure domain logic — LOS crowd model, Dijkstra wayfinder,
         intent engine, venue data. Zero dependencies. One source of truth.
  api    Fastify service — TypeBox-validated routes, Gemini proxy
         (key server-side, sent in a header), LRU-TTL answer cache,
         rate limiting, security headers, pino logs.
  web    Preact console — ~14 kB gzipped total, per-view lazy chunks,
         strict CSP with no unsafe-*, dark/light from one token set.
```

The web console runs in two modes with no code duplication: pointed at the API it can use
live Gemini; deployed statically it computes every answer locally from `core`. Details in
[ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Run it

```bash
npm ci

# API (optional — the web console also runs fully standalone)
cp packages/api/.env.example packages/api/.env   # add GEMINI_API_KEY for live answers
npm run dev -w @matchday/api                     # http://localhost:8787

# Web console
npm run dev -w @matchday/web                     # http://localhost:5173
# set VITE_API_URL=http://localhost:8787 in packages/web/.env.local to use the API
```

No Gemini key is required for a full demo — the concierge falls back to its offline engine
and says so in the UI.

## Verify

One command runs every gate CI runs:

```bash
npm run verify   # lint · typecheck · tests with enforced coverage · build
```

95 tests across the three packages; coverage thresholds (90 % lines/statements,
85 % branches) fail the build when unmet. Accessibility is asserted per view with axe.

## License

MIT — see [LICENSE](LICENSE).
