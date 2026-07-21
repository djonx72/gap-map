import { validateCreateClassInput, isValidUUID } from '../validators/classValidators.js';
import * as classService from '../services/classService.js';

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
