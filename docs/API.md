# API reference

Base URL (local): `http://localhost:4000`  
Base URL (prod): `https://d3o8eouup6tfum.cloudfront.net` (same-origin `/api`)

Unless noted, JSON bodies use `Content-Type: application/json`.  
Success: `{ "success": true, "data": … }`  
Error: `{ "success": false, "error": { "code": string, "message": string } }`

Auth cookies (when set): `access_token`, `refresh_token` (httpOnly). Send with credentials (`withCredentials` / browser same-origin).

Optional header: `X-Timezone` (IANA) for streak/activity day boundaries; API falls back to `Asia/Kolkata`.

Rate limits: `/api/v1/auth/*` uses `RATE_LIMIT_AUTH_MAX`; other `/api/v1/*` use `RATE_LIMIT_API_MAX` (defaults 30 / 300 per `RATE_LIMIT_WINDOW_MS`).

---

## Health

### `GET /health`

| | |
| --- | --- |
| Auth | No |
| Response 200 | `{ success, data: { status: "ok", mongo, redis } }` |
| Response 503 | mongo down → `status: "degraded"` |

Not exposed via CloudFront (only on EC2/Nginx). Public smoke uses `/api/v1/auth/me`.

---

## Auth — `/api/v1/auth`

### `POST /api/v1/auth/register`

| | |
| --- | --- |
| Auth | No |
| Body | `{ name, email, password }` (password ≥ 8) |
| 201 | `{ user: { id, name, email, role } }` + Set-Cookie |
| Errors | `VALIDATION_ERROR` 400, conflict/duplicate as applicable |

### `POST /api/v1/auth/login`

| | |
| --- | --- |
| Auth | No |
| Body | `{ email, password }` |
| 200 | `{ user }` + Set-Cookie |
| Errors | `VALIDATION_ERROR` 400, `UNAUTHORIZED` 401 |

### `POST /api/v1/auth/refresh`

| | |
| --- | --- |
| Auth | Refresh cookie |
| Body | none |
| 200 | rotates cookies |
| Errors | `UNAUTHORIZED` 401 |

### `POST /api/v1/auth/logout`

| | |
| --- | --- |
| Auth | Cookies (best-effort clear) |
| 200 | clears cookies |

### `GET /api/v1/auth/me`

| | |
| --- | --- |
| Auth | **Required** (access cookie) |
| 200 | `{ user }` (may include lastActivity fields as returned by controller) |
| 401 | `UNAUTHORIZED` JSON |

---

## Sheet — `/api/v1/sheet`

### `GET /api/v1/sheet`

| | |
| --- | --- |
| Auth | No |
| 200 | `{ sheet: Chapter[] }` nested topics/problems |
| Headers | May include `ETag`, `Cache-Control: public, max-age=300`, `X-Cache: HIT\|MISS` |

### `GET /api/v1/sheet/chapters/:slug`

| | |
| --- | --- |
| Auth | No |
| 200 | single chapter tree |
| 404 | `NOT_FOUND` |

---

## Problems — `/api/v1/problems`

### `GET /api/v1/problems`

| | |
| --- | --- |
| Auth | No |
| Query | optional `difficulty` (Easy\|Medium\|Hard), `topic` (ObjectId) |
| 200 | filtered problem list |
| 400 | `VALIDATION_ERROR` |

---

## Progress — `/api/v1/progress` (all require auth)

### `GET /api/v1/progress/me`

| | |
| --- | --- |
| 200 | current user progress map / list as implemented |

### `GET /api/v1/progress/stats`

| | |
| --- | --- |
| 200 | aggregates: difficulty, chapters, streak, sparse `activity` for heatmap |

### `PUT /api/v1/progress/:problemId`

| | |
| --- | --- |
| Params | `problemId` ObjectId |
| Body | `{ status: "done" \| "revisit" }` |
| 200 | upserted progress; may schedule revisit plans when status is `revisit` |
| 400 / 404 | validation / unknown problem |

### `DELETE /api/v1/progress/:problemId`

| | |
| --- | --- |
| 200 | removes progress (idempotent) |

---

## Plans — `/api/v1/plans` (all require auth)

### `GET /api/v1/plans`

| | |
| --- | --- |
| Query | `from`, `to` as `YYYY-MM-DD` (validated span) |
| 200 | `{ plans: […] }` with status derived on read |

### `POST /api/v1/plans`

| | |
| --- | --- |
| Body | create plan fields (`date`, `title`, `problemIds`, optional `topicId`, `note`, … per shared schema) |
| 201/200 | created plan |

### `POST /api/v1/plans/generate`

| | |
| --- | --- |
| Body | generate options (shared `generatePlansBodySchema`) |
| 200 | created/idempotent generated plans |

### `PATCH /api/v1/plans/:id`

| | |
| --- | --- |
| Body | partial update |
| 200 | updated plan |
| 404 | not found / not owned |

### `DELETE /api/v1/plans/:id`

| | |
| --- | --- |
| 200 | deleted |

---

## Non-production test routes

Only when `NODE_ENV !== 'production'`:

- `POST /api/v1/_test/validate` — Zod difficulty body  
- `GET /api/v1/_test/error` — intentional 500  

Not available on the production CloudFront deployment.

---

## Common error codes

| Code | Typical HTTP |
| --- | --- |
| `VALIDATION_ERROR` | 400 |
| `UNAUTHORIZED` | 401 |
| `NOT_FOUND` | 404 |
| `RATE_LIMITED` / similar | 429 (+ `Retry-After` when limited) |
| `INTERNAL_ERROR` | 500 |

Exact code strings are those returned by `ApiError` / error middleware in `apps/api`.
