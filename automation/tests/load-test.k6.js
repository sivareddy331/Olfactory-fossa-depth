import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ─── Custom Metrics ──────────────────────────────────────────────────────────
const errorRate = new Rate('error_rate');
const loginDuration = new Trend('login_page_duration');
const dashboardDuration = new Trend('dashboard_duration');
const patientsDuration = new Trend('patients_duration');
const requestsTotal = new Counter('requests_total');

// ─── Load Test Configuration: Baseline 100 VUs / 1 Minute ────────────────────
export const options = {
  scenarios: {
    baseline_load: {
      executor: 'constant-vus',
      vus: 100,
      duration: '1m',
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<1500', 'p(99)<2000'],
    http_req_failed: ['rate<0.01'],
    error_rate: ['rate<0.02'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

const HEADERS = { 'Content-Type': 'application/x-www-form-urlencoded' };

// ─── Login and get session ────────────────────────────────────────────────────
function doLogin() {
  const res = http.post(`${BASE_URL}/login`, {
    username: 'testdoctor',
    password: 'TestPass123',
  }, { headers: HEADERS });
  return res;
}

// ─── Main VU Script ──────────────────────────────────────────────────────────
export default function () {
  requestsTotal.add(1);

  group('Authentication', function () {
    // Login page load
    const loginPageRes = http.get(`${BASE_URL}/login`);
    loginDuration.add(loginPageRes.timings.duration);
    check(loginPageRes, {
      'Login page status 200': (r) => r.status === 200,
      'Login page has form': (r) => r.body && r.body.includes('login'),
    });
    errorRate.add(loginPageRes.status !== 200);

    sleep(0.1);

    // POST login
    const loginPostRes = http.post(`${BASE_URL}/login`, {
      username: 'testdoctor',
      password: 'TestPass123',
    }, { headers: HEADERS, redirects: 5 });

    check(loginPostRes, {
      'Login POST responds': (r) => r.status === 200 || r.status === 302 || r.status === 301,
    });
    errorRate.add(loginPostRes.status >= 500);
  });

  sleep(0.2);

  group('Dashboard', function () {
    const dashRes = http.get(`${BASE_URL}/dashboard`);
    dashboardDuration.add(dashRes.timings.duration);
    check(dashRes, {
      'Dashboard status 200 or redirect to login': (r) => r.status === 200 || r.status === 302,
    });
    errorRate.add(dashRes.status >= 500);
  });

  sleep(0.1);

  group('Patients List', function () {
    const patientsRes = http.get(`${BASE_URL}/patients`);
    patientsDuration.add(patientsRes.timings.duration);
    check(patientsRes, {
      'Patients page responds': (r) => r.status === 200 || r.status === 302,
    });
    errorRate.add(patientsRes.status >= 500);
  });

  sleep(0.1);

  group('Other Pages', function () {
    const uploadRes = http.get(`${BASE_URL}/upload`);
    check(uploadRes, { 'Upload page responds': (r) => r.status === 200 || r.status === 302 });

    const reportsRes = http.get(`${BASE_URL}/reports`);
    check(reportsRes, { 'Reports page responds': (r) => r.status === 200 || r.status === 302 });

    const profileRes = http.get(`${BASE_URL}/profile`);
    check(profileRes, { 'Profile page responds': (r) => r.status === 200 || r.status === 302 });
  });

  sleep(0.2);
}

// ─── Summary handler ─────────────────────────────────────────────────────────
export function handleSummary(data) {
  const metrics = data.metrics;
  const duration = metrics.http_req_duration;
  const rps = metrics.http_reqs ? metrics.http_reqs.values.rate.toFixed(2) : 'N/A';

  const summary = {
    timestamp: new Date().toISOString(),
    virtualUsers: 100,
    duration: '1 minute',
    requestsPerSecond: rps,
    responseTime: {
      average: duration ? duration.values.avg.toFixed(2) + ' ms' : 'N/A',
      minimum: duration ? duration.values.min.toFixed(2) + ' ms' : 'N/A',
      maximum: duration ? duration.values.max.toFixed(2) + ' ms' : 'N/A',
      p95: duration ? duration.values['p(95)'].toFixed(2) + ' ms' : 'N/A',
      p99: duration ? duration.values['p(99)'].toFixed(2) + ' ms' : 'N/A',
    },
    errorRate: metrics.http_req_failed ? (metrics.http_req_failed.values.rate * 100).toFixed(2) + '%' : '0%',
    totalRequests: metrics.http_reqs ? metrics.http_reqs.values.count : 0,
    thresholdsPassed: !data.root_group.checks || data.root_group.checks.fails === 0
  };

  return {
    'reports/load/load-test-results.json': JSON.stringify(summary, null, 2),
    stdout: `\n✅ Load Test Complete\n  VUs: 100 | Duration: 1m\n  RPS: ${rps}\n  Avg: ${summary.responseTime.average}\n  Min: ${summary.responseTime.minimum}\n  Max: ${summary.responseTime.maximum}\n  P95: ${summary.responseTime.p95}\n  Errors: ${summary.errorRate}\n`
  };
}
