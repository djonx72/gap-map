// backend/ai/test.js
// Run this to test the AI engine independently
// Usage: node ai/test.js

import * as dotenv from 'dotenv';
dotenv.config();

import { analyseAnswer } from './analyseAnswer.js';

const testCases = [
  {
    name: 'Test 1 — Science: root gap in prerequisites',
    input: {
      subject:        'Science',
      topic:          'Balancing Chemical Equations',
      difficulty:     'medium',
      question:       'Balance: H2 + O2 → H2O',
      correct_answer: '2H2 + O2 → 2H2O',
      student_answer: 'H2 + O2 → H2O (already balanced)',
      question_type:  'short'
    }
  },
  {
    name: 'Test 2 — Math: correct answer',
    input: {
      subject:        'Mathematics',
      topic:          'Linear Equations',
      difficulty:     'easy',
      question:       'Solve for x: 2x + 4 = 10',
      correct_answer: 'x = 3',
      student_answer: '2x = 6, x = 3',
      question_type:  'math'
    }
  },
  {
    name: 'Test 3 — Science: essay answer',
    input: {
      subject:        'Science',
      topic:          'Photosynthesis',
      difficulty:     'medium',
      question:       'What does a plant need for photosynthesis?',
      correct_answer: 'Sunlight, water, and carbon dioxide',
      student_answer: 'Sunlight and water. The plant breathes in air.',
      question_type:  'short'
    }
  },
  {
    name: 'Test 4 — Math: MCQ wrong answer',
    input: {
      subject:        'Mathematics',
      topic:          'Fractions',
      difficulty:     'easy',
      question:       'What is 1/2 + 1/4?',
      correct_answer: '3/4',
      student_answer: '2/6',
      question_type:  'mcq',
      options:['2/6', '3/4', '2/4', '1/2']
    }
  },
  {
    name: 'Test 5 — Math: step by step workings',
    input: {
      subject:        'Mathematics',
      topic:          'Quadratic Equations',
      difficulty:     'hard',
      question:       'Solve: x^2 - 5x + 6 = 0',
      correct_answer: 'x = 2 or x = 3',
      student_answer: 'Step 1: factors of 6 are 2 and 3\nStep 2: (x+2)(x+3) = 0\nStep 3: x = -2 or x = -3',
      question_type:  'math'
    }
  }
];

async function runTests() {
  console.log('\n=== GapMap AI Engine Tests ===\n');

  for (const test of testCases) {
    console.log(`Running: ${test.name}`);
    try {
      const result = await analyseAnswer(test.input);
      console.log('  is_correct:      ', result.is_correct);
      console.log('  root_gap:        ', result.root_gap);
      console.log('  confidence_score:', result.confidence_score);
      console.log('  explanation:     ', result.explanation.slice(0, 80) + '...');
      console.log('  teacher_report:  ', result.teacher_report.slice(0, 80) + '...');
      console.log('  PASS\n');
    } catch (err) {
      console.log('  FAIL:', err.message, '\n');
    }
  }
}

runTests();
