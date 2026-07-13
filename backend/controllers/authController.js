import { validateCreateProfileInput } from '../validators/authValidators.js';
import * as profileService from '../services/profileService.js';

export const createProfile = async (req, res, next) => {
  // Step 1: Validate input
  const validationResult = validateCreateProfileInput(req.body);
  if (!validationResult.valid) {
    return res.status(400).json({ error: validationResult.error });
  }

  const { id, full_name, role, school_name, class_code } = req.body;

  // Step 2: Identity check
  if (id !== req.user.id) {
    return res.status(403).json({ error: 'You can only create a profile for your own account.' });
  }

  // Step 3: Create profile
  try {
    await profileService.createProfile({ id, full_name, role, school_name });
  } catch (err) {
    return next(err);
  }

  // Step 4: Handle student class enrollment
  if (role === 'student' && class_code) {
    try {
      const foundClass = await profileService.findClassByCode(class_code);
      
      if (!foundClass) {
        return res.status(404).json({ error: 'Class code not found. Check with your teacher.' });
      }

      await profileService.enrollStudent({ classId: foundClass.id, studentId: id });
    } catch (err) {
      return next(err);
    }
  }

  // Step 5: Success response
  return res.status(201).json({ message: 'Profile created successfully' });
};
