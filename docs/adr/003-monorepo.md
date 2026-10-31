# ADR 003 — npm workspaces monorepo

## Context

API and web share Zod schemas and TypeScript types. Duplicating them invites drift.

## Decision

Use an **npm workspaces** monorepo: `apps/api`, `apps/web`, `packages/shared`.

## Alternatives

- Separate repos + published package — heavier for a small team/assessment.
- Copy-paste types — fastest short-term, costly long-term.

## Consequences

- One `npm ci` / CI pipeline; shared validation.
- Slightly more tooling awareness (build shared before api/web).
