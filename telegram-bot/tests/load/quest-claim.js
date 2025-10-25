import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const claimTrend = new Trend('claim_duration');
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 1000 },  // Ramp up
    { duration: '3m',  target: 10000 }, // Peak load
    { duration: '30s', target: 0 },     // Ramp down
  ],
  thresholds: {
    'claim_duration': ['p(95)<200'],    // 95th percentile < 200ms
    'errors': ['rate<0.01'],            // Error rate < 1%
    'http_req_duration': ['p(99)<500'], // 99th percentile < 500ms
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export default function () {
  const userId = `user_${__VU}_${__ITER}`;
  const questId = Math.floor(Math.random() * 1000) + 1;

  const payload = JSON.stringify({
    userId,
    questId,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(`${BASE_URL}/api/quest/claim`, payload, params);

  claimTrend.add(res.timings.duration);

  const success = check(res, {
    'status is 200 or 400': (r) => r.status === 200 || r.status === 400,
    'response has data': (r) => r.body.length > 0,
  });

  errorRate.add(!success);

  sleep(1); // 1 RPS per VU
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
}

function textSummary(data, opts) {
  return `
========================================
K6 LOAD TEST SUMMARY
========================================
VUs: ${data.metrics.vus.values.max}
Duration: ${data.state.testRunDurationMs / 1000}s
Requests: ${data.metrics.http_reqs.values.count}

HTTP Metrics:
  Request Duration:
    avg: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
    min: ${data.metrics.http_req_duration.values.min.toFixed(2)}ms
    med: ${data.metrics.http_req_duration.values.med.toFixed(2)}ms
    max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms
    p(95): ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
    p(99): ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms

  Request Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)} req/s
  Error Rate: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%

Custom Metrics:
  Claim Duration (p95): ${data.metrics.claim_duration.values['p(95)'].toFixed(2)}ms

========================================
${data.metrics.http_req_duration.values['p(95)'] < 200 ? '✅ PASS' : '❌ FAIL'}: p(95) < 200ms
${data.metrics.errors.values.rate < 0.01 ? '✅ PASS' : '❌ FAIL'}: Error rate < 1%
========================================
  `;
}
