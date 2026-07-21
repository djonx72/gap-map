import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('--- Starting Tests ---');

  // 1. Create two test users and their profiles
  const email1 = `qtest1_${Date.now()}@example.com`;
  const email2 = `qtest2_${Date.now()}@example.com`;
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
    body: JSON.stringify({ id: u1.user.id, full_name: 'Q Teacher 1', role: 'teacher', school_name: 'School 1' })
  });
  await fetch(`${BASE_URL}/auth/create-profile`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t2}` },
    body: JSON.stringify({ id: u2.user.id, full_name: 'Q Teacher 2', role: 'teacher', school_name: 'School 2' })
  });

  // 2. Create classes for both
  console.log('Creating classes...');
  const resC1 = await fetch(`${BASE_URL}/classes`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t1}` },
    body: JSON.stringify({ name: 'Class 1', subject: 'Math' })
  });
  const c1 = await resC1.json();
  const class1Id = c1.class.id;

  const resC2 = await fetch(`${BASE_URL}/classes`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t2}` },
    body: JSON.stringify({ name: 'Class 2', subject: 'Science' })
  });
  const c2 = await resC2.json();
  const class2Id = c2.class.id;

  // 3. Test successfully creating each of 4 types
  console.log('Testing successful creation of all 4 types...');
  const types = ['mcq', 'short', 'long', 'math'];
  for (const type of types) {
    const payload = {
      class_id: class1Id,
      topic: `Topic ${type}`,
      type: type,
      difficulty: 'medium',
      content: `Content for ${type}`,
      correct_answer: type === 'mcq' ? 'Option B' : 'Correct Answer'
    };
    if (type === 'mcq') {
      payload.options = ['Option A', 'Option B', 'Option C', 'Option D'];
    }

    const res = await fetch(`${BASE_URL}/questions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t1}` },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
       console.error(await res.text());
       throw new Error(`Failed to create ${type} question`);
    }
  }
  console.log('All 4 types created successfully.');

  // 4. Test MCQ validations
  console.log('Testing MCQ validations...');
  const invalidMcqMatch = await fetch(`${BASE_URL}/questions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t1}` },
    body: JSON.stringify({
      class_id: class1Id, topic: 'T', type: 'mcq', difficulty: 'easy', content: 'C',
      correct_answer: 'Option E', options: ['Option A', 'Option B', 'Option C', 'Option D']
    })
  });
  const errMatch = await invalidMcqMatch.json();
  if (invalidMcqMatch.status !== 400 || !errMatch.error.includes('must match one of the four options exactly')) {
    throw new Error('MCQ match validation failed: ' + JSON.stringify(errMatch));
  }

  const invalidMcqLength = await fetch(`${BASE_URL}/questions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t1}` },
    body: JSON.stringify({
      class_id: class1Id, topic: 'T', type: 'mcq', difficulty: 'easy', content: 'C',
      correct_answer: 'Option A', options: ['Option A', 'Option B', 'Option C']
    })
  });
  if (invalidMcqLength.status !== 400) {
    throw new Error('MCQ 3 options validation failed');
  }

  // 5. Test Cross Contamination Creation (Teacher 1 creating question in Teacher 2's class)
  console.log('Testing cross-contamination creation...');
  const crossCreate = await fetch(`${BASE_URL}/questions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t1}` },
    body: JSON.stringify({
      class_id: class2Id, topic: 'T', type: 'short', difficulty: 'easy', content: 'C', correct_answer: 'A'
    })
  });
  if (crossCreate.status !== 403) {
    throw new Error(`Expected 403 for cross create, got ${crossCreate.status}`);
  }

  // 6. Test GET /questions/:classId cross contamination
  console.log('Testing cross-contamination read...');
  const crossRead = await fetch(`${BASE_URL}/questions/${class1Id}`, {
    headers: { 'Authorization': `Bearer ${t2}` }
  });
  if (crossRead.status !== 403) {
     throw new Error(`Expected 403 for cross read, got ${crossRead.status}`);
  }

  // 7. Test invalid UUID param
  console.log('Testing invalid UUID param...');
  const invalidUUID = await fetch(`${BASE_URL}/questions/abc123`, {
    headers: { 'Authorization': `Bearer ${t1}` }
  });
  if (invalidUUID.status !== 400) {
     throw new Error(`Expected 400 for invalid UUID, got ${invalidUUID.status}`);
  }

  // 8. Test Rate Limiting
  console.log('Testing rate limiting (30 requests)...');
  let rateLimited = false;
  // Send spam to hit 30 writes.
  for (let i = 0; i < 35; i++) {
    const r = await fetch(`${BASE_URL}/questions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t1}` },
      body: JSON.stringify({
         class_id: class1Id, topic: 'T', type: 'short', difficulty: 'easy', content: 'C', correct_answer: 'A'
      })
    });
    if (r.status === 429) {
      rateLimited = true;
      break;
    }
  }
  if (!rateLimited) {
    throw new Error('Rate limiting failed');
  }

  console.log('--- All Tests Passed ---');
  process.exit(0);
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});
