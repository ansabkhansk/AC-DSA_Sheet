# Load testing (P8)

## Commands

```bash
# Unit / API tests (mongodb-memory-server; never touches Atlas)
npm test
npm run test:api

# Index explain (writes docs/index-explain.json)
npm run verify-indexes

# Seed sheet + invalidate Redis sheet cache
npm run seed
```

## k6

Install [k6](https://k6.io/docs/get-started/installation/) separately. It is not an npm dependency.

```bash
# One-time: create a dedicated load user (not counted in the hot path)
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Load\",\"email\":\"load@example.com\",\"password\":\"password123\"}"

# Host k6 (verified with k6 v2.3.0 on Windows)
k6 run -e BASE_URL=http://localhost:4000 \
  -e LOAD_EMAIL=load-k6@example.com -e LOAD_PASSWORD=password123 \
  -e K6_VUS=2 -e K6_DURATION=20s -e K6_SLEEP=1 \
  infra/k6/load.js

# Or Docker (Windows/macOS: host.docker.internal reaches the API on the host)
docker run --rm \
  -e BASE_URL=http://host.docker.internal:4000 \
  -e LOAD_EMAIL=load@example.com -e LOAD_PASSWORD=password123 \
  -e K6_VUS=2 -e K6_DURATION=20s -e K6_SLEEP=1 \
  -v "%CD%/infra/k6:/scripts" grafana/k6:0.54.0 run /scripts/load.js
```

### Covered endpoints

- `GET /api/v1/sheet`
- `GET /api/v1/progress/me`
- `PUT /api/v1/progress/:problemId`
- `GET /api/v1/plans?from=&to=`

### Thresholds in the script

- `http_req_failed` rate &lt; 1%
- `http_req_duration` p95 &lt; 500ms for the configured VU/duration profile

These are **local smoke targets**, not a claim that the system supports 10k–50k users. See `docs/load-test-results.md` for recorded runs.

## Environment variables (API)

| Variable | Default | Purpose |
|----------|---------|---------|
| `REDIS_ENABLED` | `false` in tests | Enable Redis for cache + shared rate limits |
| `REDIS_URL` | — | Required when Redis enabled |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate-limit window |
| `RATE_LIMIT_API_MAX` | `300` | General API requests / IP / window |
| `RATE_LIMIT_AUTH_MAX` | `30` | Auth routes / IP / window (stricter) |
| `SHEET_CACHE_TTL_SECONDS` | `3600` | Redis TTL for sheet tree |

Raise `RATE_LIMIT_*` before long k6 runs if you hit `429`.
