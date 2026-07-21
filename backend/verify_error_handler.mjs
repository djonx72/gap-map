/**
 * verify_error_handler.mjs
 *
 * Self-contained verification script for the security-hardened errorHandler.
 * Tests four scenarios:
 *   1. NODE_ENV=development, no publicMessage  → raw err.message in response, stack included
 *   2. NODE_ENV=production,  no publicMessage  → generic message in response, no stack
 *   3. NODE_ENV=development, publicMessage set → publicMessage in response
 *   4. NODE_ENV=production,  publicMessage set → publicMessage in response
 *
 * Also confirms: full error detail always appears in server-side logs.
 *
 * Run with:  node verify_error_handler.mjs
 */

import { errorHandler } from './middleware/errorHandler.js';

// ── Minimal mock helpers ──────────────────────────────────────────────────────

function makeReq(method = 'POST', url = '/auth/create-profile') {
  return { method, originalUrl: url };
}

function makeRes() {
  const res = { _status: null, _body: null };
  res.status = (code) => { res._status = code; return res; };
  res.json   = (body)  => { res._body  = body; return res; };
  return res;
}

function makeErr({ message, statusCode, publicMessage, stack }) {
  const err = new Error(message);
  if (statusCode)    err.statusCode    = statusCode;
  if (publicMessage) err.publicMessage = publicMessage;
  if (stack !== undefined) err.stack   = stack;
  return err;
}

// ── Test runner ───────────────────────────────────────────────────────────────

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

function runScenario(label, env, errOpts, checks) {
  console.log(`\n─── ${label} (NODE_ENV=${env}) ───`);
  process.env.NODE_ENV = env;

  const err = makeErr(errOpts);
  const req = makeReq();
  const res = makeRes();

  // Capture console.error output to verify server-side logging
  const logs = [];
  const origError = console.error;
  console.error = (...args) => logs.push(args.join(' '));

  errorHandler(err, req, res, () => {});

  console.error = origError; // Restore

  // Always: full detail must appear in server-side logs
  const logDump = logs.join('\n');
  assert('Full error message logged server-side',
    logDump.includes(errOpts.message),
    `Logs were: ${logDump}`);
  assert('Stack trace logged server-side',
    logDump.includes('Error:') || logDump.includes('at '),
    `Logs were: ${logDump}`);
  assert('Request method logged server-side', logDump.includes(req.method));
  assert('Request URL logged server-side',    logDump.includes(req.originalUrl));
  assert('Timestamp logged server-side',      logDump.includes('T') && logDump.includes('Z'));

  // Environment-specific assertions passed in by caller
  checks(res, logDump);
}

// ── Scenario 1: development, no publicMessage ─────────────────────────────────
runScenario(
  'Dev — no publicMessage',
  'development',
  { message: 'DB insert failed in createProfile: column "xyz" does not exist', statusCode: 500 },
  (res) => {
    assert('Status code is 500',           res._status === 500);
    assert('Raw error message in response', res._body.error.includes('DB insert failed'));
    assert('Stack included in response',   typeof res._body.stack === 'string');
    assert('Generic message NOT sent',     !res._body.error.includes('Something went wrong'));
  }
);

// ── Scenario 2: production, no publicMessage ──────────────────────────────────
runScenario(
  'Prod — no publicMessage',
  'production',
  { message: 'DB insert failed in createProfile: column "xyz" does not exist', statusCode: 500 },
  (res) => {
    assert('Status code is 500',                      res._status === 500);
    assert('Generic message in response',             res._body.error === 'Something went wrong. Please try again.');
    assert('Raw error message NOT in response',       !res._body.error.includes('DB insert failed'));
    assert('Stack NOT included in response',          res._body.stack === undefined);
    assert('Table/column detail NOT in response',     !JSON.stringify(res._body).includes('column'));
  }
);

// ── Scenario 3: development, publicMessage set ────────────────────────────────
runScenario(
  'Dev — publicMessage set',
  'development',
  {
    message: 'DB insert failed in createProfile: unique constraint violated',
    statusCode: 500,
    publicMessage: 'We could not create your profile. Please try again.'
  },
  (res) => {
    assert('publicMessage used in response',           res._body.error === 'We could not create your profile. Please try again.');
    assert('Raw error message NOT in response',        !res._body.error.includes('DB insert failed'));
  }
);

// ── Scenario 4: production, publicMessage set ─────────────────────────────────
runScenario(
  'Prod — publicMessage set',
  'production',
  {
    message: 'DB insert failed in createProfile: unique constraint violated',
    statusCode: 500,
    publicMessage: 'We could not create your profile. Please try again.'
  },
  (res) => {
    assert('publicMessage used in response',           res._body.error === 'We could not create your profile. Please try again.');
    assert('Raw error message NOT in response',        !res._body.error.includes('DB insert failed'));
    assert('Stack NOT included in response',           res._body.stack === undefined);
  }
);

// ── Scenario 5: statusCode defaults to 500 when unset ────────────────────────
runScenario(
  'Dev — no statusCode set (should default to 500)',
  'development',
  { message: 'Unexpected crash — no statusCode attached' },
  (res) => {
    assert('Status defaults to 500 when err.statusCode not set', res._status === 500);
  }
);

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('🎉  All verification checks passed.');
} else {
  console.error('⚠️   One or more checks failed — review output above.');
  process.exit(1);
}
