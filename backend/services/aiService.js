// aiService.js
// GapMap AI Diagnostic Engine
// Drop this file into the backend and call analyzeAnswer() on any student submission.
// Swap GEMINI_API_KEY for the real key in your .env file.

import * as dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const SYSTEM_PROMPT = `You are GapMap's AI diagnostic engine. Your job is to analyse a student's answer to an educational question and identify the ROOT CAUSE of any misunderstanding — not just whether the answer is right or wrong.

You will receive:
- subject: the subject area (e.g. Mathematics, Science, English)
- topic: the specific topic the question covers
- difficulty: easy, medium, or hard
- question: the full question text
- correct_answer: the correct answer provided by the teacher
- student_answer: what the student wrote
- question_type: mcq, short, long, or math

Your job is to:
1. Determine if the student's answer is correct
2. If incorrect, trace the error to its root prerequisite concept
   (e.g. if a student fails a chemistry question due to algebra errors,
   the root gap is algebra, not chemistry)
3. Write a simple, encouraging explanation for a 13-year-old student
4. Write a technical diagnostic report for the teacher
5. Give a confidence score for your diagnosis

For math questions: read each step the student wrote. Identify the exact step where understanding broke down.

CRITICAL: You must respond ONLY with a valid JSON object. No preamble. No explanation outside the JSON. No markdown backticks. Return exactly this structure:
{
  "is_correct": true or false,
  "root_gap": "The specific concept the student is missing. Null if correct.",
  "explanation": "Simple, encouraging explanation for the student. What went wrong. What to review. Max 3 sentences.",
  "teacher_report": "Technical report for the teacher. Name the gap. Where in the answer it appeared. Suggested action.",
  "confidence_score": 0.00 to 1.00
}`;

/**
 * Analyzes a student's answer and returns a diagnostic JSON.
 *
 * @param {Object} input
 * @param {string} input.submission_id - UUID of the submission
 * @param {string} input.subject       - e.g. "Mathematics"
 * @param {string} input.topic         - e.g. "Linear Equations"
 * @param {string} input.difficulty    - "easy" | "medium" | "hard"
 * @param {string} input.question      - Full question text
 * @param {string} input.correct_answer
 * @param {string} input.student_answer
 * @param {string} input.question_type - "mcq" | "short" | "long" | "math"
 *
 * @returns {Promise<Object>} - { is_correct, root_gap, explanation, teacher_report, confidence_score }
 */
async function analyzeAnswer(input) {
  const {
    submission_id,
    subject,
    topic,
    difficulty,
    question,
    correct_answer,
    student_answer,
    question_type,
  } = input;

  const userMessage = `subject: ${subject}
topic: ${topic}
difficulty: ${difficulty}
question: ${question}
correct_answer: ${correct_answer}
student_answer: ${student_answer}
question_type: ${question_type}`;

  const requestBody = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userMessage }],
      },
    ],
    generationConfig: {
      temperature: 0.2, // Low temperature = more consistent, predictable output
      maxOutputTokens: 2000,
      responseMimeType: "application/json",
      thinkingConfig: {
        thinkingBudget: 0, // disable internal reasoning tokens so the full budget goes to the JSON answer
      },
    },
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} — ${error}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error("No response from Gemini API");
  }

  // Strip markdown backticks if Gemini adds them despite instructions
  const cleaned = rawText.replace(/```json|```/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Failed to parse AI response as JSON: ${rawText}`);
  }

  // Attach submission_id to the result so Jonathan can save it to ai_analyses
  return {
    submission_id,
    ...parsed,
  };
}

export { analyzeAnswer };
