import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('--- Starting tests ---');

  // 1. Create two test users
  const email1 = `test1_${Date.now()}@example.com`;
  const email2 = `test2_${Date.now()}@example.com`;
  const password = 'Password123!';

  console.log('Signing up user 1...');
  const { data: user1Data, error: user1Err } = await supabase.auth.signUp({ email: email1, password });
  if (user1Err) throw user1Err;
  const token1 = user1Data.session.access_token;

  console.log('Signing up user 2...');
  const { data: user2Data, error: user2Err } = await supabase.auth.signUp({ email: email2, password });
  if (user2Err) throw user2Err;
  const token2 = user2Data.session.access_token;

  // Create profiles
  console.log('Creating profiles...');
  const profile1 = await fetch(`${BASE_URL}/auth/create-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
    body: JSON.stringify({ id: user1Data.user.id, full_name: 'Teacher 1', role: 'teacher', school_name: 'School' })
  });
  if (!profile1.ok) throw new Error('Failed to create profile 1: ' + await profile1.text());

  const profile2 = await fetch(`${BASE_URL}/auth/create-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token2}` },
    body: JSON.stringify({ id: user2Data.user.id, full_name: 'Teacher 2', role: 'teacher', school_name: 'School' })
  });
  if (!profile2.ok) throw new Error('Failed to create profile 2: ' + await profile2.text());

  // Wait a sec for triggers etc if any
  await new Promise(r => setTimeout(r, 1000));

  // --- Test POST /classes: valid creation & generating codes ---
  console.log('Testing POST /classes... Creating 15 classes to check codes.');
  const codes = [];
  let user1FirstClassId = null;
  for (let i = 0; i < 15; i++) {
    const res = await fetch(`${BASE_URL}/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
      body: JSON.stringify({ name: `Test Class ${i}`, subject: `Subject ${i}` })
    });
    
    if (res.status === 429) {
      console.log(`Rate limited on attempt ${i + 1}`);
      break;
    }
    
    if (!res.ok) {
      console.error(await res.text());
      throw new Error(`Failed to create class ${i}`);
    }
    const data = await res.json();
    codes.push(data.class.class_code);
    if (i === 0) user1FirstClassId = data.class.id;
  }

  // Verify no invalid chars
  const invalidChars = /[0O1I]/;
  const invalidCodes = codes.filter(c => invalidChars.test(c));
  if (invalidCodes.length > 0) {
    throw new Error(`Found codes with invalid chars: ${invalidCodes.join(', ')}`);
  } else {
    console.log(`Generated 15 codes without 0, O, 1, or I. Examples: ${codes.slice(0, 3).join(', ')}`);
  }

  // --- Test GET /classes cross-contamination ---
  console.log('Testing GET /classes cross-contamination...');
  // User 2 creates 1 class
  const resUser2 = await fetch(`${BASE_URL}/classes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token2}` },
    body: JSON.stringify({ name: 'User 2 Class', subject: 'Math' })
  });
  if (!resUser2.ok) {
     console.error(await resUser2.text());
     throw new Error('User 2 failed to create class');
  }
  
  const get1 = await fetch(`${BASE_URL}/classes`, { headers: { 'Authorization': `Bearer ${token1}` }});
  const data1 = await get1.json();
  const get2 = await fetch(`${BASE_URL}/classes`, { headers: { 'Authorization': `Bearer ${token2}` }});
  const data2 = await get2.json();

  if (data2.classes.some(c => c.teacher_id !== user2Data.user.id) || data1.classes.some(c => c.teacher_id !== user1Data.user.id)) {
    throw new Error('Cross-contamination found in GET /classes');
  }
  console.log(`GET /classes returns only the calling teacher's own classes. User1: ${data1.classes.length}, User2: ${data2.classes.length}`);

  // --- Test GET /classes/:id ownership enforcement ---
  console.log('Testing GET /classes/:id ownership enforcement...');
  const resCross = await fetch(`${BASE_URL}/classes/${user1FirstClassId}`, {
    headers: { 'Authorization': `Bearer ${token2}` }
  });
  if (resCross.status !== 404) {
    throw new Error(`Expected 404 for unowned class, got ${resCross.status}`);
  }
  const crossData = await resCross.json();
  if (crossData.error !== 'Class not found.') {
     throw new Error(`Expected 'Class not found.' for unowned class, got ${crossData.error}`);
  }
  console.log('Unowned class returned 404 (not 403 or DB error) with generic message.');

  // --- Test GET /classes/:id invalid UUID ---
  console.log('Testing GET /classes/:id with invalid UUID...');
  const resInvalidUUID = await fetch(`${BASE_URL}/classes/abc123`, {
    headers: { 'Authorization': `Bearer ${token1}` }
  });
  if (resInvalidUUID.status !== 400) {
    throw new Error(`Expected 400 for invalid UUID, got ${resInvalidUUID.status}`);
  }
  console.log('Invalid UUID returned 400.');

  // --- Test No Authorization Header ---
  console.log('Testing No Auth Header...');
  const resNoAuth = await fetch(`${BASE_URL}/classes`);
  if (resNoAuth.status !== 401) {
    throw new Error(`Expected 401 for no auth, got ${resNoAuth.status}`);
  }
  console.log('No Auth returned 401.');

  // --- Test Rate Limiting ---
  console.log('Testing Rate Limiting (30 req/15min). Sending multiple POSTs...');
  let rateLimited = false;
  let rateLimitMessage = '';
  // Since we already did 16 writes, we need at least 15 more to hit limit. We'll do 20.
  for (let i = 0; i < 20; i++) {
    const res = await fetch(`${BASE_URL}/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
      body: JSON.stringify({ name: `Spam ${i}`, subject: 'Spam Subject' })
    });
    if (res.status === 429) {
      rateLimited = true;
      const data = await res.json();
      rateLimitMessage = data.error;
      break;
    }
  }
  if (!rateLimited) {
    throw new Error('Rate limiting failed, did not receive 429 after 35 total requests.');
  } else {
    console.log(`Rate limiting worked: ${rateLimitMessage}`);
  }

  console.log('--- All tests passed! ---');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
