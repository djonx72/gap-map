// UUID v4 format validator (reused from classValidators pattern)
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

// School code: alphanumeric + dashes, max 20 chars
const SCHOOL_CODE_REGEX = /^[A-Za-z0-9-]{1,20}$/;

// Strip HTML tags to prevent stored XSS
const stripHtmlTags = (str) => str.replace(/<[^>]*>/g, '');

export const validateCreateProfileInput = (body) => {
  if (!body) {
    return { valid: false, error: 'Missing required fields' };
  }

  const { id, full_name, role, school_code } = body;

  // Check all required fields are present and are strings
  if (!id || !full_name || !role || !school_code || typeof school_code !== 'string' || school_code.trim() === '') {
    return { valid: false, error: 'Missing required fields' };
  }

  // Issue #12: Validate id is a proper UUID
  if (typeof id !== 'string' || !UUID_REGEX.test(id)) {
    return { valid: false, error: 'Invalid user ID format' };
  }

  // Issue #11: full_name — strip HTML tags, enforce max length
  if (typeof full_name !== 'string') {
    return { valid: false, error: 'Full name must be a string' };
  }
  const sanitisedName = stripHtmlTags(full_name).trim();
  if (sanitisedName.length === 0) {
    return { valid: false, error: 'Full name cannot be empty' };
  }
  if (sanitisedName.length > 200) {
    return { valid: false, error: 'Full name cannot exceed 200 characters' };
  }

  if (role !== 'teacher' && role !== 'student') {
    return { valid: false, error: 'Invalid role' };
  }

  // Issue #13: school_code — enforce length and alphanumeric+dash pattern
  const trimmedSchoolCode = school_code.trim();
  if (!SCHOOL_CODE_REGEX.test(trimmedSchoolCode)) {
    return { valid: false, error: 'School code must be 1-20 alphanumeric characters or dashes' };
  }

  return { valid: true, data: { id, full_name: sanitisedName, role, school_code: trimmedSchoolCode } };
};
