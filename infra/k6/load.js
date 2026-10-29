/**
 * k6 load script for DSA Sheet API (P8).
 *
 * Prerequisites:
 * - API running locally (e.g. `npm run dev` or API on :4000)
 * - Seeded sheet data (`npm run seed`)
 * - Pre-created load-test user (register once; bcrypt is not on the hot path)
 *
 * Environment variables:
 * - BASE_URL          default http://localhost:4000
 * - LOAD_EMAIL        required for authenticated scenarios
 * - LOAD_PASSWORD     required for authenticated scenarios
 * - K6_VUS            default 10
 * - K6_DURATION       default 30s
 *
 * Example:
 *   k6 run -e LOAD_EMAIL=load@example.com -e LOAD_PASSWORD=password123 infra/k6/load.js
 *
 * Targets (local smoke — not a capacity claim):
 * - http_req_failed < 1%
 * - http_req_duration p(95) < 500ms for this VU/duration profile
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';
const EMAIL = __ENV.LOAD_EMAIL || '';
const PASSWORD = __ENV.LOAD_PASSWORD || '';
// Keep defaults under RATE_LIMIT_API_MAX (300/min) for a single client IP.
// Raise API rate limits (or lower VUs) before pushing harder — see docs/LOAD_TESTING.md.
const VUS = Number(__ENV.K6_VUS || 2);
const DURATION = __ENV.K6_DURATION || '20s';

const sheetLatency = new Trend('sheet_latency', true);
const progressMeLatency = new Trend('progress_me_latency', true);
const progressPutLatency = new Trend('progress_put_latency', true);
const plansLatency = new Trend('plans_latency', true);

export const options = {
  vus: VUS,
  duration: DURATION,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

function login() {
  const res = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(res, { 'login 200': (r) => r.status === 200 });
  return res.cookies;
}

function cookieHeader(cookies) {
  const parts = [];
  for (const name of Object.keys(cookies || {})) {
    const entries = cookies[name];
    if (entries && entries.length > 0) {
      parts.push(`${name}=${entries[0].value}`);
    }
  }
  return parts.join('; ');
}

export function setup() {
  if (!EMAIL || !PASSWORD) {
    throw new Error('Set LOAD_EMAIL and LOAD_PASSWORD for authenticated k6 scenarios');
  }

  const cookies = login();
  const jar = cookieHeader(cookies);

  const sheet = http.get(`${BASE_URL}/api/v1/sheet`);
  check(sheet, { 'setup sheet 200': (r) => r.status === 200 });
  const body = sheet.json();
  const problemId = body.data.sheet[0].topics[0].problems[0].id;

  return { jar, problemId };
}

export default function (data) {
  const headers = {
    Cookie: data.jar,
    'Content-Type': 'application/json',
    'X-Timezone': 'Asia/Kolkata',
  };

  group('sheet read', () => {
    const res = http.get(`${BASE_URL}/api/v1/sheet`, { headers });
    sheetLatency.add(res.timings.duration);
    check(res, { 'sheet 200/304': (r) => r.status === 200 || r.status === 304 });
  });

  group('progress me', () => {
    const res = http.get(`${BASE_URL}/api/v1/progress/me`, { headers });
    progressMeLatency.add(res.timings.duration);
    check(res, { 'progress me 200': (r) => r.status === 200 });
  });

  group('progress put', () => {
    const res = http.put(
      `${BASE_URL}/api/v1/progress/${data.problemId}`,
      JSON.stringify({ status: 'done' }),
      { headers },
    );
    progressPutLatency.add(res.timings.duration);
    check(res, { 'progress put 200': (r) => r.status === 200 });
  });

  group('plans range', () => {
    const res = http.get(`${BASE_URL}/api/v1/plans?from=2026-10-01&to=2026-10-31`, {
      headers,
    });
    plansLatency.add(res.timings.duration);
    check(res, { 'plans 200': (r) => r.status === 200 });
  });

  sleep(Number(__ENV.K6_SLEEP || 1));
}
