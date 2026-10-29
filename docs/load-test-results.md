# k6 load-test results (P8)

These measurements are for the **local Docker Mongo+Redis + API on localhost:4000** stack only.
They do **not** establish capacity for 10k–50k users.

## Environment

| Field | Value |
|-------|-------|
| Date | 2026-10-30 |
| Host | Windows 10 (local) |
| API | `http://localhost:4000` (`npm run dev` / tsx) |
| Data stores | Docker Compose `mongo:7` (healthy), `redis:7-alpine` (healthy) |
| Health | `GET /health` → `mongo:"up"`, `redis:"up"` |
| Auth user | Pre-registered `load-k6@example.com` (login only in k6 `setup`) |
| Script | `infra/k6/load.js` |
| Thresholds | `http_req_failed` rate &lt; 1%; `http_req_duration` p95 &lt; 500ms |

---

## Run C — local host k6 (primary verification)

| Setting | Value |
|---------|-------|
| Runner | `k6.exe v2.3.0` (windows/amd64) |
| Command | `k6 run -e BASE_URL=http://localhost:4000 -e LOAD_EMAIL=load-k6@example.com -e LOAD_PASSWORD=password123 -e K6_VUS=2 -e K6_DURATION=20s -e K6_SLEEP=1 infra/k6/load.js` |
| VUs | 2 |
| Duration | 20s |
| Sleep | 1s |
| Throughput | ~7.49 req/s (`http_reqs` 158) |

| Metric | Result |
|--------|--------|
| Checks | **100%** (158/158) |
| `http_req_failed` | **0.00%** |
| `http_req_duration` p95 | **32.71ms** (threshold pass) |
| p99 (approx from max/p95 band) | max observed **88.82ms** |
| `sheet_latency` p95 | 33.55ms |
| `progress_me_latency` p95 | 22.65ms |
| `progress_put_latency` p95 | 44.61ms |
| `plans_latency` p95 | 22.24ms |
| Exit code | **0** |

During/after this run Redis key `cache:sheet:tree:v1` remained present (TTL refreshed around ~3550s), and a follow-up `GET /sheet` returned `X-Cache: HIT`.

---

## Run B — Docker k6 (earlier same day)

| Setting | Value |
|---------|-------|
| Runner | `docker run grafana/k6:0.54.0` → `host.docker.internal:4000` |
| VUs / duration / sleep | 2 / 20s / 1s |
| `http_req_failed` | 0.00% |
| `http_req_duration` p95 | 45.94ms |

---

## Run A — rate-limit stress (failed thresholds; expected)

| Setting | Value |
|---------|-------|
| Runner | Docker k6 |
| VUs / duration / sleep | 5 / 20s / 0.3s |
| `http_reqs` | 1122 (~55 req/s) |
| `http_req_failed` | **73.17%** |
| Bottleneck | Per-IP `RATE_LIMIT_API_MAX=300` / 60s → mostly `429` |

### Local rate-limit probe (host, same day)

Sequential `GET /api/v1/sheet` × 320 from one client IP:

| Observation | Value |
|-------------|-------|
| `200` | 299 (all `X-Cache: HIT`) |
| `429` | 21 |
| First `429` index | 299 |
| `Retry-After` sample | 44 |
| `X-RateLimit-Limit` | 300 |

Confirms the documented API limit and that cached sheet responses still carry rate-limit headers.

---

## Cache invalidation

1. `docker compose exec redis redis-cli DEL cache:sheet:tree:v1` → next read `X-Cache: MISS`, then `HIT`.
2. `npm run seed` logs `Sheet cache invalidated`; after the rate-limit window reset, next reads were `MISS` → `HIT` and Redis `EXISTS cache:sheet:tree:v1` → `1` with TTL `3600`.

---

## Multi-instance note

Production demo topology (P9 / C2) uses **two API containers behind Nginx** sharing Redis rate-limit keys. For this local P8 verification, a **single** API process is sufficient: rate-limit counters are stored in Redis (`rl:*`), so sharing is architectural rather than requiring two local Node processes. Starting a second local API instance was not required for the current single-process `npm run dev` setup.

---

## Limitations

- Local smoke only; not a 10k–50k capacity claim.
- One API process, one client IP.
- Host CPU/RSS not profiled beyond k6 latency/error metrics.
- k6 p99 is not a first-class threshold in the script; use max / p95 from the summary above.
