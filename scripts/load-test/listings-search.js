/**
 * k6 load test — Phase 4
 *
 * Install: https://k6.io/docs/get-started/installation/
 * Run against local API:
 *   k6 run -e BASE_URL=http://localhost:4000 scripts/load-test/listings-search.js
 *
 * Target: ~500 concurrent virtual users hitting public search/list (plan §12).
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    search_spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 200 },
        { duration: '1m', target: 500 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<800'],
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost:4000';

export default function () {
  const list = http.get(`${BASE}/api/v1/listings?limit=20`);
  check(list, {
    'list 200': (r) => r.status === 200,
    'list has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch {
        return false;
      }
    },
  });

  const q = ['react', 'python', 'data', 'design', 'ai'][Math.floor(Math.random() * 5)];
  const search = http.get(`${BASE}/api/v1/listings/search?q=${q}`);
  check(search, {
    'search 200': (r) => r.status === 200,
  });

  sleep(0.3);
}
