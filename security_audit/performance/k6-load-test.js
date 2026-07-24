import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'], // less than 1% failure rate
  },
};

export default function () {
  // Assuming backend runs on 8080 locally or replace with BASE_URL
  const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
  
  const res = http.get(`${BASE_URL}/docs`);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  
  sleep(1);
}
