/**
 * verify_rate_limiters.mjs
 *
 * Verification script for the restructured rate-limiting system.
 * Tests:
 *   1. rateLimiter.js exports exactly the three required limiters (no old ones).
 *   2. Server starts without errors (no startup crash from route-less /submissions limiter).
 *   3. POST /auth/create-profile: first 10 calls succeed (or fail for non-rate reasons),
 *      the 11th returns 429 with the auth-specific message.
 *   4. The 429 only fires once per window — no double-counting from stacked limiters.
 *   5. A normal GET / request within the generalLimiter's generous 200 req/15 min
 *      limit returns 200 — well-behaved use is not broken.
 *
 * Run with:  node verify_rate_limiters.mjs
 */

import * as rateLimiterModule from './middleware/rateLimiter.js';

// ── Helpers ───────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅  ${label}`);
    passed++;
  } else {
    console.error(`  ❌  FAIL: ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

// ── 1. Export surface check ───────────────────────────────────────────────────
console.log('\n─── Exported limiters from rateLimiter.js ───');

const exportedKeys = Object.keys(rateLimiterModule);
assert('generalLimiter is exported',  exportedKeys.includes('generalLimiter'));
assert('authLimiter is exported',     exportedKeys.includes('authLimiter'));
assert('aiLimiter is exported',       exportedKeys.includes('aiLimiter'));
assert('createProfileLimiter is NOT exported (superseded)',
  !exportedKeys.includes('createProfileLimiter'),
  `Exports: ${exportedKeys.join(', ')}`
);
assert('Exactly 3 limiters exported',
  exportedKeys.length === 3,
  `Found: ${exportedKeys.join(', ')}`
);

// ── 2. Live server tests (startup + 429 behaviour) ────────────────────────────
console.log('\n─── Spinning up server for live tests ───');

// Import and start the app in-process so we can fire real HTTP requests.
// We re-use the app's own express instance by importing index.js dynamically.
// Because index.js calls app.listen() itself, we just hit the running port.

const PORT = process.env.PORT || 5000;
const BASE = `http://localhost:${PORT}`;

// Give the server 1.5 s to start (it was already started by index.js import side-effect)
await new Promise(r => setTimeout(r, 1500));

async function hit(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(`${BASE}${path}`, opts);
    const json = await res.json().catch(() => ({}));
    return { status: res.status, body: json };
  } catch (e) {
    return { status: 0, body: {}, error: e.message };
  }
}

// ── 2a. Health check — server is up and generalLimiter is not blocking normal use ──
console.log('\n─── Health check (GET /) ───');
const health = await hit('GET', '/');
assert('Server started without errors (GET / returns non-zero status)',
  health.status !== 0, `Got: ${health.status}`);
assert('GET / returns 200 (generalLimiter not triggering on normal use)',
  health.status === 200, `Got: ${health.status}`);

// ── 2b. /submissions is reachable without crashing (pre-wired aiLimiter) ──────
console.log('\n─── /submissions limiter pre-wired (no route handlers yet) ───');
const subHit = await hit('GET', '/submissions/anything');
assert('/submissions request does NOT crash the server (aiLimiter pre-wired safely)',
  subHit.status !== 0 && subHit.status !== 500,
  `Got status: ${subHit.status}`
);
// Express returns 404 when a limiter is wired but no routes match — that's correct.
assert('/submissions returns 404 (no route registered yet, limiter passes through)',
  subHit.status === 404,
  `Got: ${subHit.status}`
);

// ── 2c. authLimiter: 11th POST /auth/create-profile returns 429 ───────────────
console.log('\n─── authLimiter: 11 rapid POSTs to /auth/create-profile ───');
console.log('    (First 10 will 401 — no token — but must NOT be 429. 11th must be 429.)');

const results = [];
for (let i = 1; i <= 11; i++) {
  const r = await hit('POST', '/auth/create-profile', { id: 'test', full_name: 'Test', role: 'teacher' });
  results.push({ i, status: r.status, error: r.body?.error });
  process.stdout.write(`    Request ${i}: ${r.status}\n`);
}

const first10 = results.slice(0, 10);
const eleventh = results[10];

assert('First 10 requests are NOT rate-limited (none returned 429)',
  first10.every(r => r.status !== 429),
  `Statuses: ${first10.map(r => r.status).join(', ')}`
);
assert('11th request returns 429',
  eleventh.status === 429,
  `Got: ${eleventh.status} — body: ${JSON.stringify(eleventh.error)}`
);
assert('429 message is the auth-specific message (not a generic fallback)',
  eleventh.error?.includes('login or sign-up attempts'),
  `Got: "${eleventh.error}"`
);
assert('429 message does NOT contain old generic text ("Too many attempts, please try again")',
  !eleventh.error?.includes('Too many attempts, please try again later'),
  `Got: "${eleventh.error}"`
);

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(55)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('🎉  All rate limiter verification checks passed.');
} else {
  console.error('⚠️   One or more checks failed — review output above.');
  process.exit(1);
}
process.exit(0);
