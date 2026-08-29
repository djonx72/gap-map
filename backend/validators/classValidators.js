export const validateCreateClassInput = (body) => {
  if (!body) return { isValid: false, error: 'Request body is required.' };
  
  let { name, subject } = body;
  
  if (!name || typeof name !== 'string') return { isValid: false, error: 'Name is required and must be a string.' };
  if (!subject || typeof subject !== 'string') return { isValid: false, error: 'Subject is required and must be a string.' };
  
  name = name.trim();
  subject = subject.trim();
  
  if (name.length === 0) return { isValid: false, error: 'Name cannot be empty.' };
  if (subject.length === 0) return { isValid: false, error: 'Subject cannot be empty.' };
  
  if (name.length > 200) return { isValid: false, error: 'Name cannot exceed 200 characters.' };
  if (subject.length > 200) return { isValid: false, error: 'Subject cannot exceed 200 characters.' };
  
  return { isValid: true, data: { name, subject } };
};

export const isValidUUID = (value) => {
  if (typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(value);
};

export const validateJoinClassInput = (body) => {
  if (!body) return { isValid: false, error: 'Request body is required.' };
  
  let { class_code } = body;
  if (!class_code || typeof class_code !== 'string') {
    return { isValid: false, error: 'class_code is required and must be a string.' };
  }
  
  class_code = class_code.toUpperCase().trim();
  if (class_code.length === 0) {
    return { isValid: false, error: 'class_code cannot be empty.' };
  }

  // Class codes are exactly 6 uppercase alphanumeric characters (excluding I, O, 0, 1)
  if (!/^[A-Z0-9]{6}$/.test(class_code)) {
    return { isValid: false, error: 'Invalid class code format. Must be 6 alphanumeric characters.' };
  }
  
  return { isValid: true, data: { class_code } };
};
