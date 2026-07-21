import { isValidUUID } from './classValidators.js';

export const VALID_TYPES = ['mcq', 'short', 'long', 'math'];
export const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];

export const validateCreateQuestionInput = (body) => {
  if (!body) return { isValid: false, error: 'Request body is required.' };

  let { class_id, topic, type, difficulty, content, correct_answer, options } = body;

  const requiredFields = ['class_id', 'topic', 'type', 'difficulty', 'content', 'correct_answer'];
  for (const field of requiredFields) {
    if (!body[field] || typeof body[field] !== 'string' || body[field].trim() === '') {
      return { isValid: false, error: `Missing or empty field: ${field}` };
    }
  }

  topic = topic.trim();
  type = type.trim();
  difficulty = difficulty.trim();
  content = content.trim();
  correct_answer = correct_answer.trim();

  if (!VALID_TYPES.includes(type)) {
    return { isValid: false, error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` };
  }

  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    return { isValid: false, error: `Invalid difficulty. Must be one of: ${VALID_DIFFICULTIES.join(', ')}` };
  }

  if (topic.length > 150) return { isValid: false, error: 'Topic cannot exceed 150 characters.' };
  if (content.length > 5000) return { isValid: false, error: 'Content cannot exceed 5000 characters.' };
  if (correct_answer.length > 5000) return { isValid: false, error: 'Correct answer cannot exceed 5000 characters.' };

  let trimmedOptions = null;
  if (type === 'mcq') {
    if (!options || !Array.isArray(options) || options.length !== 4) {
      return { isValid: false, error: 'MCQ questions require exactly 4 options in an array.' };
    }
    
    trimmedOptions = options.map(o => typeof o === 'string' ? o.trim() : '');
    if (trimmedOptions.some(o => o === '')) {
      return { isValid: false, error: 'All 4 options must be non-empty strings.' };
    }
    if (trimmedOptions.some(o => o.length > 300)) {
      return { isValid: false, error: 'Each option cannot exceed 300 characters.' };
    }

    if (!trimmedOptions.includes(correct_answer)) {
      return { isValid: false, error: 'The correct answer must match one of the four options exactly.' };
    }
  }

  return {
    isValid: true,
    data: { class_id, topic, type, difficulty, content, correct_answer, options: trimmedOptions }
  };
};

export const validateClassIdParam = (id) => isValidUUID(id);
