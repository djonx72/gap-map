/**
 * verify_csp.mjs
 *
 * Verifies CSP configuration for GapMap_Security_Patch_Brief_v2.0 Issue 4.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅  ${label}`);
    passed++;
  } else {
    console.error(`  ❌  FAIL: ${label}${detail ? '\n       Detail: ' + detail : ''}`);
    failed++;
  }
}

async function hitEndpoint(path, port) {
  try {
    const res = await fetch(`http://localhost:${port}${path}`);
    return { status: res.status, headers: Object.fromEntries(res.headers) };
  } catch (e) {
    return { status: 0, error: e.message };
  }
}

async function runServer(port, extraEnv, testFn) {
  const childEnv = {
    ...process.env,
    PORT: port.toString(),
    ...extraEnv
  };

  const server = spawn('node', ['index.js'], {
    cwd: __dirname,
    env: childEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  await new Promise(r => setTimeout(r, 2000));
  await testFn();
  server.kill();
  await new Promise(r => setTimeout(r, 500));
}

(async () => {
  console.log('\n─── V1: Production CSP is tight ───');
  await runServer(5005, { NODE_ENV: 'production', FRONTEND_URL: 'https://example.com' }, async () => {
    const res = await hitEndpoint('/', 5005);
    const csp = res.headers['content-security-policy'] || '';
    assert('CSP header is present', !!csp);
    assert('unsafe-inline is NOT in CSP', !csp.includes('unsafe-inline'), `CSP: ${csp}`);
    assert('unsafe-eval is NOT in CSP', !csp.includes('unsafe-eval'), `CSP: ${csp}`);
    assert('default-src is self', csp.includes("default-src 'self'"));
    assert('connect-src includes Supabase and Gemini', csp.includes('https://generativelanguage.googleapis.com'));
  });

  console.log('\n─── V2: Development CSP allows Swagger ───');
  await runServer(5006, { NODE_ENV: 'development', FRONTEND_URL: 'http://localhost:5173' }, async () => {
    const res = await hitEndpoint('/api-docs', 5006);
    const csp = res.headers['content-security-policy'] || '';
    assert('CSP header is present', !!csp);
    assert('unsafe-inline IS in CSP', csp.includes('unsafe-inline'), `CSP: ${csp}`);
    assert('unsafe-eval IS in CSP', csp.includes('unsafe-eval'), `CSP: ${csp}`);
    assert('Swagger UI returns success status', res.status >= 200 && res.status < 400);
  });

  console.log(`\n${'═'.repeat(55)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log('🎉  All CSP verification checks passed.');
  } else {
    console.error('⚠️   One or more checks failed.');
    process.exit(1);
  }
  process.exit(0);
})();
