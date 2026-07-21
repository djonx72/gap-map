import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('--- Starting Rate Limit Isolation Tests ---');

  // 1. Create two test users and their profiles
  const email1 = `rltest1_${Date.now()}@example.com`;
  const email2 = `rltest2_${Date.now()}@example.com`;
  const password = 'Password123!';

  console.log('Signing up user 1...');
  const { data: u1, error: e1 } = await supabase.auth.signUp({ email: email1, password });
  if (e1) throw e1;
  const t1 = u1.session.access_token;

  console.log('Signing up user 2...');
  const { data: u2, error: e2 } = await supabase.auth.signUp({ email: email2, password });
  if (e2) throw e2;
  const t2 = u2.session.access_token;

  console.log('Creating profiles...');
  await fetch(`${BASE_URL}/auth/create-profile`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t1}` },
    body: JSON.stringify({ id: u1.user.id, full_name: 'RL Teacher 1', role: 'teacher', school_name: 'School 1' })
  });
  await fetch(`${BASE_URL}/auth/create-profile`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t2}` },
    body: JSON.stringify({ id: u2.user.id, full_name: 'RL Teacher 2', role: 'teacher', school_name: 'School 2' })
  });

  // Spam requests with User 1 until rate limited
  console.log('Spamming requests with User 1...');
  let rateLimited = false;
  for (let i = 0; i < 35; i++) {
    const res = await fetch(`${BASE_URL}/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t1}` },
      body: JSON.stringify({ name: `Spam ${i}`, subject: 'Math' })
    });
    if (res.status === 429) {
      console.log('User 1 hit rate limit (429)!');
      rateLimited = true;
      break;
    }
  }

  if (!rateLimited) {
    throw new Error('User 1 failed to hit rate limit.');
  }

  // Verify User 2 can still make requests successfully
  console.log('Testing if User 2 is isolated from User 1\'s rate limit...');
  const res2 = await fetch(`${BASE_URL}/classes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t2}` },
    body: JSON.stringify({ name: 'User 2 Safe Class', subject: 'Science' })
  });

  if (res2.status === 429) {
    throw new Error('User 2 was incorrectly rate-limited! The limiter is still IP-based.');
  }

  if (res2.status !== 201) {
    throw new Error(`User 2 request failed with status: ${res2.status}`);
  }

  console.log('User 2 request succeeded! Rate limits are successfully keyed by user.');

  console.log('--- All Rate Limit Isolation Tests Passed ---');
  process.exit(0);
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});
