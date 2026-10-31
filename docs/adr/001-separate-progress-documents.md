# ADR 001 — Separate progress documents

## Context

Each student marks many problems done. Storing progress as a growing array on the user document would rewrite large documents on every toggle and create concurrency conflicts.

## Decision

Use a **UserProgress** collection with one document per `(userId, problemId)` and a unique compound index for idempotent upserts.

## Alternatives

- Embedded array on `users` — simple reads, poor write scaling.
- Single “blob” JSON per user — same rewrite/conflict issues.

## Consequences

- Small atomic writes; easy chapter/stats queries via indexes.
- More documents overall; acceptable for the design estimate and demo seed size.
