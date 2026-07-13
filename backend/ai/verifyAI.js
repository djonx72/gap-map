// backend/ai/verifyAI.js
// Runs Elvis's official test cases (from his AI Engine Brief) against analyseAnswer.js
// and validates the response against the ai_analyses data contract.
//
// Usage: node ai/verifyAI.js (run from inside the backend folder)
// Requires: GEMINI_API_KEY in your .env file.

import * as dotenv from 'dotenv';
dotenv.config();
import { analyseAnswer } from './analyseAnswer.js';

const testCases = [
  {
    name: 'Test 1 — Math root-cause hidden in a Science question',
    input: {
      submission_id: 'test-001',
      subject: 'Science',
      topic: 'Balancing Chemical Equations',
      difficulty: 'medium',
      question: 'Balance the following equation: H2 + O2 → H2O',
      correct_answer: '2H2 + O2 → 2H2O',
      student_answer: 'H2 + O2 → H2O (the equation is already balanced)',
      question_type: 'short',
    },
    expect: { is_correct: false, root_gap_not_null: true },
  },
  {
    name: 'Test 2 — Correct answer (should not invent a gap)',
    input: {
      submission_id: 'test-002',
      subject: 'Mathematics',
      topic: 'Linear Equations',
      difficulty: 'easy',
      question: 'Solve for x: 2x + 4 = 10',
      correct_answer: 'x = 3',
      student_answer: '2x = 10 - 4, 2x = 6, x = 3',
      question_type: 'math',
    },
    expect: { is_correct: true, root_gap_not_null: false, min_confidence: 0.9 },
  },
  {
    name: 'Test 3 — Essay / long-answer diagnosis',
    input: {
      submission_id: 'test-003',
      subject: 'Science',
      topic: 'Photosynthesis',
      difficulty: 'medium',
      question: 'Explain what photosynthesis is and what a plant needs for it to happen.',
      correct_answer:
        'Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to produce glucose and oxygen.',
      student_answer:
        'Photosynthesis is when plants make food. They need sunlight and water. The plant breathes in air and turns it into food.',
      question_type: 'long',
    },
    expect: { is_correct: false, root_gap_not_null: true },
  },
  {
    name: 'Test 4 — MCQ question',
    input: {
      submission_id: 'test-004',
      subject: 'Mathematics',
      topic: 'Fractions',
      difficulty: 'easy',
      question: 'Which fraction is equivalent to 1/2? A) 2/3  B) 3/6  C) 4/5  D) 5/8',
      correct_answer: 'B) 3/6',
      student_answer: 'A) 2/3',
      question_type: 'mcq',
    },
    expect: { is_correct: false, root_gap_not_null: true },
  },
  {
    name: 'Test 5 — Blank / empty student answer',
    input: {
      submission_id: 'test-005',
      subject: 'English',
      topic: 'Identifying Verbs',
      difficulty: 'easy',
      question: 'Identify the verb in this sentence: "The dog quickly ran across the yard."',
      correct_answer: 'ran',
      student_answer: '',
      question_type: 'short',
    },
    // No strict expectations beyond schema validity — this just checks the
    // engine doesn't crash or return garbage when a student submits nothing.
    expect: { is_correct: false },
  },
];

function validateSchema(result) {
  const errors = [];
  if (typeof result.is_correct !== 'boolean') errors.push(`is_correct is not a boolean (got ${typeof result.is_correct})`);
  if (result.root_gap !== null && typeof result.root_gap !== 'string') errors.push('root_gap must be a string or null');
  if (typeof result.explanation !== 'string' || result.explanation.length === 0) errors.push('explanation missing/empty');
  if (typeof result.teacher_report !== 'string' || result.teacher_report.length === 0) errors.push('teacher_report missing/empty');
  if (typeof result.confidence_score !== 'number' || result.confidence_score < 0 || result.confidence_score > 1) {
    errors.push(`confidence_score out of range or not a number (got ${result.confidence_score})`);
  }
  if (!result.submission_id) errors.push('submission_id missing from returned object');
  return errors;
}

// Run with: node verifyAI.js --repeat 3
// Repeats every test case N times so you can eyeball whether Gemini's output
// stays consistent (same is_correct / same general root_gap) across runs,
// since temperature 0.2 still allows some variation, not full determinism.
const repeatArgIndex = process.argv.indexOf('--repeat');
const repeatCount = repeatArgIndex !== -1 ? parseInt(process.argv[repeatArgIndex + 1], 10) || 1 : 1;

async function run() {
  let passCount = 0;
  let totalRuns = 0;

  for (const tc of testCases) {
    for (let run = 1; run <= repeatCount; run++) {
      totalRuns++;
      if (repeatCount > 1) console.log(`\n--- Run ${run}/${repeatCount} ---`);
      await runOne(tc, () => passCount++);
    }
  }

  console.log(`\n----------------------------------------`);
  console.log(`${passCount}/${totalRuns} total runs passed`);
  console.log(`----------------------------------------`);
}

async function runOne(tc, onPass) {
  console.log(`\n=== ${tc.name} ===`);
  try {
    const result = await analyseAnswer(tc.input);
    console.log(JSON.stringify(result, null, 2));

    const schemaErrors = validateSchema(result);
    const logicErrors = [];

    if (result.is_correct !== tc.expect.is_correct) {
      logicErrors.push(`Expected is_correct=${tc.expect.is_correct}, got ${result.is_correct}`);
    }
    if (tc.expect.root_gap_not_null !== undefined) {
      const isNull = result.root_gap === null || result.root_gap === 'null';
      if (tc.expect.root_gap_not_null && isNull) logicErrors.push('Expected a root_gap, got null');
      if (!tc.expect.root_gap_not_null && !isNull) logicErrors.push(`Expected root_gap=null, got "${result.root_gap}"`);
    }
    if (tc.expect.min_confidence !== undefined && result.confidence_score < tc.expect.min_confidence) {
      logicErrors.push(`Expected confidence_score >= ${tc.expect.min_confidence}, got ${result.confidence_score}`);
    }

    const allErrors = [...schemaErrors, ...logicErrors];
    if (allErrors.length === 0) {
      console.log('✅ PASS');
      onPass();
    } else {
      console.log('❌ FAIL:');
      allErrors.forEach((e) => console.log('   - ' + e));
    }
  } catch (err) {
    console.log('❌ ERROR calling analyseAnswer:', err.message);
  }
}

run();