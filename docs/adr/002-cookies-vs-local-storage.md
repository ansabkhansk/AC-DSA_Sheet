# ADR 002 — Cookies vs local storage for auth

## Context

The SPA and API share one origin in production (CloudFront) and in local Vite (`/api` proxy). Tokens must survive refresh and stay hard for XSS to steal.

## Decision

Store access and refresh tokens in **httpOnly** cookies (`Secure` in production, `SameSite=Lax`). Do not put JWTs in `localStorage`.

## Alternatives

- `localStorage` / `sessionStorage` — easy for JS, worse XSS exposure.
- Authorization header only — more client complexity; less natural with same-origin cookies.

## Consequences

- Browser sends cookies automatically; refresh rotation stays server-driven.
- Requires HTTPS + `COOKIE_SECURE=true` in production; CORS must allow credentials with exact origin.
