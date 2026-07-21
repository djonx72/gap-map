/**
 * verify_swagger.mjs
 *
 * Verifies Swagger production guard for GapMap_Security_Patch_Brief_v2.0 Issue 5.
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
    const text = await res.text();
    return { status: res.status, body: text, headers: Object.fromEntries(res.headers) };
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

  let serverLogs = '';
  server.stdout.on('data', d => { serverLogs += d.toString(); });
  server.stderr.on('data', d => { serverLogs += d.toString(); });

  // wait for server
  await new Promise(r => setTimeout(r, 2000));
  
  await testFn(serverLogs);
  
  server.kill();
  await new Promise(r => setTimeout(r, 500));
}

(async () => {
  console.log('\n─── V1: Swagger loads in development mode ───');
  
  await runServer(5002, { NODE_ENV: 'development', FRONTEND_URL: 'http://localhost:5173' }, async (logs) => {
    const resDocs = await hitEndpoint('/api-docs', 5002);
    // swagger-ui-express sometimes redirects /api-docs to /api-docs/
    assert('GET /api-docs (or redirect) succeeds', resDocs.status === 200 || resDocs.status === 301 || resDocs.status === 303, `Got status: ${resDocs.status}`);
    
    const resJson = await hitEndpoint('/api-docs.json', 5002);
    assert('GET /api-docs.json succeeds (returns 200)', resJson.status === 200, `Got status: ${resJson.status}`);
    assert('GET /api-docs.json returns Swagger JSON', resJson.body.includes('"openapi"'), `Body snippet: ${resJson.body.substring(0, 50)}`);
  });

  console.log('\n─── V2: Swagger is blocked in production mode ───');

  await runServer(5003, { NODE_ENV: 'production', FRONTEND_URL: 'https://example.com' }, async (logs) => {
    const resDocs = await hitEndpoint('/api-docs', 5003);
    assert('GET /api-docs returns 404 in production', resDocs.status === 404, `Got status: ${resDocs.status}`);
    assert('GET /api-docs returns JSON { error: "Not found" }', resDocs.body.includes('"Not found"'), `Got body: ${resDocs.body}`);

    const resJson = await hitEndpoint('/api-docs.json', 5003);
    assert('GET /api-docs.json returns 404 in production', resJson.status === 404, `Got status: ${resJson.status}`);
    assert('GET /api-docs.json returns JSON { error: "Not found" }', resJson.body.includes('"Not found"'), `Got body: ${resJson.body}`);
    
    assert('Swagger development logs do not appear in production output', !logs.includes('Swagger API docs enabled'), `Found log?`);
  });

  console.log(`\n${'═'.repeat(55)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log('🎉  All Swagger verification checks passed.');
  } else {
    console.error('⚠️   One or more checks failed.');
    process.exit(1);
  }
  process.exit(0);
})();
