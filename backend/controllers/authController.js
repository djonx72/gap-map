import { validateCreateProfileInput } from '../validators/authValidators.js';
import * as profileService from '../services/profileService.js';

/**
 * createProfile — POST /auth/create-profile
 *
 * Creates the profiles row for a newly registered user and, for students,
 * validates the class code and performs the enrolment.
 *
 * Middleware applied before this handler (see routes/auth.js):
 *  1. verifyToken  — validates the Bearer token and sets req.user
 *  2. createProfileLimiter — rate-limits to 10 requests per 15 min per IP
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const createProfile = async (req, res, next) => {
  // Step 1: Validate input
  const validationResult = validateCreateProfileInput(req.body);
  if (!validationResult.valid) {
    return res.status(400).json({ error: validationResult.error });
  }

  // Use sanitised values from the validator (HTML-stripped name, trimmed school code)
  const { id, full_name, role, school_code } = validationResult.data;

  // Step 2: Identity check — the token's subject must match the supplied id
  if (id !== req.user.id) {
    return res.status(403).json({ error: 'You can only create a profile for your own account.' });
  }

  // Step 3: Find school by code
  let foundSchool;
  try {
    foundSchool = await profileService.findSchoolByCode(school_code);
  } catch (err) {
    return next(err);
  }

  if (!foundSchool) {
    return res.status(404).json({ error: 'School code not found. Check with your school administrator.' });
  }

  // Step 4: Create profile
  try {
    await profileService.createProfile({ 
      id, 
      full_name, 
      role, 
      school_id: foundSchool.id, 
      school_name: foundSchool.school_name 
    });
  } catch (err) {
    return next(err);
  }

  // Step 5: Success
  return res.status(201).json({ message: 'Profile created successfully' });
};
