/**
 * verify_logger.mjs
 *
 * Verifies logger redaction for GapMap_Security_Patch_Brief_v2.0 Issue 3.
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

async function hitEndpoint(path, port, body) {
  try {
    const res = await fetch(`http://localhost:${port}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const text = await res.text();
    return { status: res.status, body: text };
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
  
  await testFn(() => serverLogs);
  
  server.kill();
  await new Promise(r => setTimeout(r, 500));
}

(async () => {
  console.log('\n─── Starting full server on port 5004 for logger test ───');

  // We set NODE_ENV=development because the DEV_FORMAT logs the body.
  await runServer(5004, { NODE_ENV: 'development', FRONTEND_URL: 'http://localhost:5173' }, async (getLogs) => {
    
    console.log('\n─── Test 1: AI submission payload ───');
    // Doesn't matter if this returns 404, the logger runs for all routes.
    await hitEndpoint('/submissions', 5004, {
      student_answer: "the mitochondria is the powerhouse of the cell",
      answer_content: "something else",
      subject: "biology",
      class_code: "BIO101"
    });
    
    // give morgan a moment to flush to stdout
    await new Promise(r => setTimeout(r, 200));
    
    const logs1 = getLogs();
    assert('Logs contain the submission request line', logs1.includes('POST /submissions'));
    assert('student_answer is [REDACTED]', logs1.includes('"student_answer":"[REDACTED]"'));
    assert('answer_content is [REDACTED]', logs1.includes('"answer_content":"[REDACTED]"'));
    assert('Non-sensitive field "subject" is readable', logs1.includes('"subject":"biology"'));
    assert('Non-sensitive field "class_code" is readable', logs1.includes('"class_code":"BIO101"'));
    assert('Real student answer string NEVER appears in logs', !logs1.includes('mitochondria'));

    console.log('\n─── Test 2: Auth payload ───');
    await hitEndpoint('/auth/login', 5004, {
      email: "student@school.edu",
      password: "secretpassword123",
      role: "student"
    });
    
    await new Promise(r => setTimeout(r, 200));
    
    const logs2 = getLogs();
    assert('Logs contain the login request line', logs2.includes('POST /auth/login'));
    assert('email is [REDACTED]', logs2.includes('"email":"[REDACTED]"'));
    assert('password is [REDACTED]', logs2.includes('"password":"[REDACTED]"'));
    assert('Non-sensitive field "role" is readable', logs2.includes('"role":"student"'));
    assert('Real email string NEVER appears in logs', !logs2.includes('student@school.edu'));
    assert('Real password string NEVER appears in logs', !logs2.includes('secretpassword123'));
    
  });

  console.log(`\n${'═'.repeat(55)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log('🎉  All logger verification checks passed.');
  } else {
    console.error('⚠️   One or more checks failed.');
    process.exit(1);
  }
  process.exit(0);
})();
