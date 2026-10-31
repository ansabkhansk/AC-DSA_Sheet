# ADR 006 — Timezone approach

## Context

Streaks, heatmaps, and plan dates are day-based. Servers run in UTC; students are often in India.

## Decision

- Store plan `date` as **UTC midnight** of the civil `YYYY-MM-DD`.
- Accept optional `X-Timezone` from the client; default **`Asia/Kolkata`** for day boundaries (C7).

## Alternatives

- Pure UTC midnights for streaks — shifts “today” for IST users.
- Always trust browser without header — harder for API/tests.

## Consequences

- Consistent local “days” for progress stats and calendar ranges.
- Clients should send `X-Timezone` (web axios interceptor does).
