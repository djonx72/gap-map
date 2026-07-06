// backend/ai/parseResponse.js
// Parses and validates Gemini's JSON response

function parseResponse(rawText) {
  // Remove markdown code fences if Gemini adds them
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned
      .replace(/^```(json)?\n?/, '')
      .replace(/\n?```$/, '')
      .trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Gemini response was not valid JSON: ${cleaned.slice(0, 200)}`);
  }

  // Validate all required fields are present
  const required = ['is_correct', 'root_gap', 'explanation', 'teacher_report', 'confidence_score'];
  for (const field of required) {
    if (!(field in parsed)) {
      throw new Error(`Missing required field in AI response: ${field}`);
    }
  }

  // Validate types
  if (typeof parsed.is_correct !== 'boolean') {
    throw new Error('is_correct must be a boolean');
  }

  if (typeof parsed.confidence_score !== 'number' ||
      parsed.confidence_score < 0 || parsed.confidence_score > 1) {
    throw new Error('confidence_score must be a number between 0 and 1');
  }

  // If correct, root_gap must be null
  if (parsed.is_correct && parsed.root_gap !== null) {
    parsed.root_gap = null;
  }

  return {
    is_correct:       parsed.is_correct,
    root_gap:         parsed.root_gap ?? null,
    explanation:      String(parsed.explanation).trim(),
    teacher_report:   String(parsed.teacher_report).trim(),
    confidence_score: Number(parsed.confidence_score.toFixed(2))
  };
}

export { parseResponse };
