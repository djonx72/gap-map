import { validateCreateClassInput, validateJoinClassInput, isValidUUID } from '../validators/classValidators.js';
import * as classService from '../services/classService.js';
import * as profileService from '../services/profileService.js';

export const createClass = async (req, res, next) => {
  try {
    const validation = validateCreateClassInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    const { name, subject } = validation.data;
    const newClass = await classService.createClass(req.user.id, name, subject);

    res.status(201).json({ message: 'Class created successfully', class: newClass });
  } catch (err) {
    next(err);
  }
};

export const listClasses = async (req, res, next) => {
  try {
    const classes = await classService.getTeacherClasses(req.user.id);
    res.status(200).json({ classes });
  } catch (err) {
    next(err);
  }
};

export const getClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid class ID' });
    }

    const classData = await classService.getClassById(id, req.user.id);
    res.status(200).json({ class: classData });
  } catch (err) {
    next(err);
  }
};

export const joinClass = async (req, res, next) => {
  try {
    const validation = validateJoinClassInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    const { class_code } = validation.data;

    const profile = await profileService.getProfileById(req.user.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    if (profile.role !== 'student') {
      return res.status(403).json({ error: 'Only students can join a class.' });
    }

    const foundClass = await classService.findClassByCode(class_code);
    if (!foundClass || foundClass.school_id !== profile.school_id) {
      return res.status(404).json({ error: 'Class code not found. Check with your teacher.' });
    }

    await classService.enrollStudent({ classId: foundClass.id, studentId: req.user.id });

    res.status(201).json({
      message: 'Successfully joined class',
      class: {
        id: foundClass.id,
        name: foundClass.name,
        subject: foundClass.subject
      }
    });
  } catch (err) {
    next(err);
  }
};
