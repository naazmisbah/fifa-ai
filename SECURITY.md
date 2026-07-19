# Security policy

## Reporting a vulnerability

Open a private security advisory on the repository (Security → Advisories → Report a
vulnerability). Please include reproduction steps. You will get a response within a week.

## Design notes

- The Gemini API key exists only in the API server's environment (`.env`, git-ignored) and
  is sent upstream in the `x-goog-api-key` request header — never in URLs, logs, or the
  browser bundle.
- The static web console ships a strict Content-Security-Policy (`default-src 'self'`,
  no `unsafe-inline`/`unsafe-eval`) and makes no third-party requests.
- The API sets helmet security headers, restricts CORS to the console origin, caps bodies
  at 32 kB, and rate-limits per client.
- Dependencies are exact-pinned and updated via Dependabot; CI actions are pinned to full
  commit SHAs.
