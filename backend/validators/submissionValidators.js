export const validateQuizSubmission = (body) => {
  const { answers } = body;

  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return { isValid: false, error: 'No answers were submitted. Please try again.' };
  }

  if (answers.length > 50) {
    return { isValid: false, error: 'Too many answers in one submission.' };
  }

  for (let i = 0; i < answers.length; i++) {
    const ans = answers[i];
    if (!ans.question_id || typeof ans.question_id !== 'string' || ans.question_id.trim() === '') {
      return { isValid: false, error: 'One or more answers are missing a valid question ID.' };
    }
    if (ans.answer_content !== undefined && typeof ans.answer_content !== 'string') {
      return { isValid: false, error: 'One or more answers have an invalid format.' };
    }
    const content = typeof ans.answer_content === 'string' ? ans.answer_content.trim() : '';
    if (content.length > 2000) {
      return { isValid: false, error: 'One or more answers exceed the 2000 character limit.' };
    }
  }

  return { isValid: true, data: body };
};
