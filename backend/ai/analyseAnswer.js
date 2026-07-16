// backend/ai/analyseAnswer.js
// Main AI engine function — Jonathan calls this

import { buildPrompt }   from './buildPrompt.js';
import { callGemini }    from './geminiClient.js';
import { parseResponse } from './parseResponse.js';

/**
 * Analyses a student's answer and returns a diagnostic result.
 *
 * @param {Object} submission
 * @param {string} submission.subject        - e.g. 'Mathematics'
 * @param {string} submission.topic          - e.g. 'Linear Equations'
 * @param {string} submission.difficulty     - 'easy' | 'medium' | 'hard'
 * @param {string} submission.question       - Full question text
 * @param {string} submission.correct_answer - Teacher's correct answer
 * @param {string} submission.student_answer - What the student wrote
 * @param {string} submission.question_type  - 'mcq'|'short'|'long'|'math'
 *
 * @returns {Object} { is_correct, root_gap, explanation, teacher_report, confidence_score }
 */
async function analyseAnswer(submission) {
  // Validate input fields
  const required = ['subject', 'topic', 'difficulty', 'question',
                    'correct_answer', 'student_answer', 'question_type'];
  for (const field of required) {
    if (!submission[field] && submission[field] !== '') {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Guard: handle empty or blank student answers before hitting the API
  if (!submission.student_answer || submission.student_answer.trim() === '') {
    return {
      is_correct:       false,
      root_gap:         'No answer submitted',
      explanation:      'It looks like you did not submit an answer. Give it a try — there are no wrong attempts!',
      teacher_report:   'Student submitted a blank answer. No diagnostic possible. Follow up to check if there was a technical issue or if the student chose not to attempt the question.',
      confidence_score: 1.00
    };
  }

  try {
    // Step 1: Build the prompt
    const { systemPrompt, userMessage } = buildPrompt(submission);

    // Step 2: Call Gemini
    const rawResponse = await callGemini(systemPrompt, userMessage);

    // Step 3: Parse and validate the response
    const result = parseResponse(rawResponse);

    return result;

  } catch (err) {
    // Log the error for debugging but return a safe fallback
    console.error('AI Engine Error:', err.message);

    // Return a fallback so the app never crashes
    return {
      is_correct:       false,
      root_gap:         'Unable to diagnose — AI engine error',
      explanation:      'We could not analyse your answer right now. Your teacher has been notified.',
      teacher_report:   `AI engine failed to analyse this submission. Error: please try again or contact support.`,
      confidence_score: 0.00
    };
  }
}

export { analyseAnswer };
