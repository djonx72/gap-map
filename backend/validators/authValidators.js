export const validateCreateProfileInput = (body) => {
  if (!body) {
    return { valid: false, error: 'Missing required fields' };
  }

  const { id, full_name, role } = body;

  if (!id || !full_name || !role) {
    return { valid: false, error: 'Missing required fields' };
  }

  if (role !== 'teacher' && role !== 'student') {
    return { valid: false, error: 'Invalid role' };
  }

  return { valid: true };
};
