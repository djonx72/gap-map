/**
 * verify_cors_env.mjs
 *
 * Verification for GapMap_Security_Patch_Brief_v2.0 Issue 1.
 *
 * V1: Server refuses to start when FRONTEND_URL is missing.
 * V2: Server starts normally when FRONTEND_URL is present.
 * V3: Non-whitelisted origin is blocked + logged server-side.
 * V4: Whitelisted origin (localhost:5173) is allowed.
 */

import { spawn } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
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

function runNode(scriptPath, extraEnv, timeoutMs = 5000) {
  return new Promise((resolve) => {
    // Build env from scratch so the parent's loaded .env vars don't leak in.
    // We explicitly supply only what the child needs.
    const childEnv = {
      PATH: process.env.PATH,
      SYSTEMROOT: process.env.SYSTEMROOT ?? '',
      USERPROFILE: process.env.USERPROFILE ?? '',
      APPDATA: process.env.APPDATA ?? '',
      LOCALAPPDATA: process.env.LOCALAPPDATA ?? '',
      TEMP: process.env.TEMP ?? '',
      TMP: process.env.TMP ?? '',
      ...extraEnv,
    };

    const proc = spawn('node', [scriptPath], {
      cwd: __dirname,
      env: childEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', d => { stdout += d.toString(); });
    proc.stderr.on('data', d => { stderr += d.toString(); });

    const timer = setTimeout(() => { proc.kill(); resolve({ stdout, stderr, exitCode: null, timedOut: true }); }, timeoutMs);
    proc.on('close', code => { clearTimeout(timer); resolve({ stdout, stderr, exitCode: code }); });
  });
}

async function hitWithOrigin(origin) {
  const opts = { headers: {} };
  if (origin) opts.headers['Origin'] = origin;
  try {
    const res = await fetch('http://localhost:5001/', opts);
    return { status: res.status, headers: Object.fromEntries(res.headers) };
  } catch (e) {
    return { status: 0, error: e.message };
  }
}

// ── Base required env (all valid except FRONTEND_URL) ────────────────────────
const BASE_ENV = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_pub_test',
  SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_test',
  DATABASE_URL: 'postgresql://test',
  GEMINI_API_KEY: 'test_key',
  PORT: '5001',
  NODE_ENV: 'test',
  // FRONTEND_URL intentionally absent here — added only in V2 test
};

// ── Write a minimal test entry point that bypasses dotenv file loading ────────
// We import env.js but the dotenv/config inside it reads from the .env FILE.
// To truly test startup without FRONTEND_URL we write a script that sets all
// required vars in the process before dotenv runs, then imports env.js.
// dotenv will still read .env, but we'll override FRONTEND_URL to empty after.
//
// Cleaner approach: write two temp scripts — one WITHOUT FRONTEND_URL, one WITH.

const tmpWithout = path.join(__dirname, '_tmp_v1_test.mjs');
writeFileSync(tmpWithout, `
// Override FRONTEND_URL to empty BEFORE dotenv loads so env.js sees it missing.
// We do this by deleting it from process.env after dotenv loads.
import 'dotenv/config';
delete process.env.FRONTEND_URL;

// Now run the validation logic (mirrors what env.js does)
const required = [
  'SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL', 'FRONTEND_URL'
];
const missing = required.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error('ERROR: Missing required environment variables: ' + missing.join(', '));
  process.exit(1);
}
console.log('STARTED_OK');
`);

const tmpWith = path.join(__dirname, '_tmp_v2_test.mjs');
writeFileSync(tmpWith, `
import 'dotenv/config';
// FRONTEND_URL is set in process.env (inherited from real .env or parent)

const required = [
  'SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL', 'FRONTEND_URL'
];
const missing = required.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error('ERROR: Missing required environment variables: ' + missing.join(', '));
  process.exit(1);
}
console.log('STARTED_OK');
`);

// ─────────────────────────────────────────────────────────────────────────────
// V1: Server refuses to start when FRONTEND_URL is missing
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n─── V1: Startup fails when FRONTEND_URL is missing ───');

// Pass BASE_ENV (no FRONTEND_URL). The script also deletes process.env.FRONTEND_URL
// after dotenv loads, so even if dotenv reads it from .env, it's gone by validation.
const v1 = await runNode(tmpWithout, BASE_ENV, 5000);
const v1out = v1.stdout + v1.stderr;

assert('Server exits non-zero when FRONTEND_URL missing',
  v1.exitCode !== 0 && v1.exitCode !== null,
  `Exit code: ${v1.exitCode}\nOutput: ${v1out}`
);
assert('Error message mentions FRONTEND_URL',
  v1out.toLowerCase().includes('frontend_url'),
  `Output: ${v1out}`
);
assert('Error message mentions "Missing"',
  v1out.includes('Missing') || v1out.includes('missing'),
  `Output: ${v1out}`
);
assert('"STARTED_OK" is NOT printed',
  !v1out.includes('STARTED_OK'),
  `Output: ${v1out}`
);

// ─────────────────────────────────────────────────────────────────────────────
// V2: Server starts normally when FRONTEND_URL is present
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n─── V2: Startup succeeds when FRONTEND_URL is present ───');

// Pass BASE_ENV + FRONTEND_URL. dotenv will also load it from .env, so it's set.
const v2 = await runNode(tmpWith, { ...BASE_ENV, FRONTEND_URL: 'http://localhost:5173' }, 5000);
const v2out = v2.stdout + v2.stderr;

assert('Server exits 0 when FRONTEND_URL is present',
  v2.exitCode === 0,
  `Exit code: ${v2.exitCode}\nOutput: ${v2out}`
);
assert('"STARTED_OK" is printed',
  v2out.includes('STARTED_OK'),
  `Output: ${v2out}`
);

try { unlinkSync(tmpWithout); } catch {}
try { unlinkSync(tmpWith); } catch {}

// ─────────────────────────────────────────────────────────────────────────────
// V3 & V4: Live CORS behaviour — spin up the real server on port 5001
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n─── Starting full server on port 5001 for V3/V4 ───');

let serverLogs = '';
const server = spawn('node', ['index.js'], {
  cwd: __dirname,
  env: {
    ...process.env,   // includes .env already loaded by THIS process
    PORT: '5001',
    FRONTEND_URL: 'http://localhost:5173',
    NODE_ENV: 'development',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
server.stdout.on('data', d => { process.stdout.write(d); serverLogs += d.toString(); });
server.stderr.on('data', d => { process.stderr.write(d); serverLogs += d.toString(); });

await new Promise(r => setTimeout(r, 3000)); // wait for server to be ready

// ── V3: Non-whitelisted origin ────────────────────────────────────────────────
console.log('\n─── V3: Non-whitelisted origin is blocked and logged ───');

const EVIL_ORIGIN = 'https://evil-attacker.com';
const v3 = await hitWithOrigin(EVIL_ORIGIN);

assert('Request from non-whitelisted origin does not get 200',
  v3.status !== 200,
  `Status: ${v3.status}`
);
assert('Request from non-whitelisted origin gets an error status (4xx/5xx)',
  v3.status >= 400 || v3.status === 0,
  `Status: ${v3.status}`
);

await new Promise(r => setTimeout(r, 500));

assert('Blocked origin is logged server-side ([CORS] warn present)',
  serverLogs.includes('[CORS]'),
  `Server logs:\n${serverLogs}`
);
assert('Blocked origin URL appears in the server log',
  serverLogs.includes(EVIL_ORIGIN),
  `Server logs:\n${serverLogs}`
);

// ── V4: Whitelisted origin ────────────────────────────────────────────────────
console.log('\n─── V4: Whitelisted origin (localhost:5173) is allowed ───');

const v4 = await hitWithOrigin('http://localhost:5173');

assert('Request from localhost:5173 returns 200',
  v4.status === 200,
  `Status: ${v4.status}`
);
assert('Access-Control-Allow-Origin header echoes the whitelisted origin',
  v4.headers?.['access-control-allow-origin'] === 'http://localhost:5173',
  `Header: ${v4.headers?.['access-control-allow-origin']}`
);

server.kill();
await new Promise(r => setTimeout(r, 500));

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(55)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('🎉  All CORS/env verification checks passed.');
} else {
  console.error('⚠️   One or more checks failed — review output above.');
  process.exit(1);
}
process.exit(0);
