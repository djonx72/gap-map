export const validateCreateProfileInput = (body) => {
  if (!body) {
    return { valid: false, error: 'Missing required fields' };
  }

  const { id, full_name, role, school_code } = body;

  if (!id || !full_name || !role || !school_code || typeof school_code !== 'string' || school_code.trim() === '') {
    return { valid: false, error: 'Missing required fields' };
  }

  if (role !== 'teacher' && role !== 'student') {
    return { valid: false, error: 'Invalid role' };
  }

  return { valid: true };
};
