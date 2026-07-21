import { validateCreateQuestionInput, validateClassIdParam } from '../validators/questionValidators.js';
import * as questionService from '../services/questionService.js';

export const createQuestion = async (req, res, next) => {
  try {
    const validation = validateCreateQuestionInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    const { class_id } = validation.data;
    const newQuestion = await questionService.createQuestion(req.user.id, class_id, validation.data);

    res.status(201).json({ message: 'Question created successfully', question: newQuestion });
  } catch (err) {
    next(err);
  }
};

export const listClassQuestions = async (req, res, next) => {
  try {
    const { classId } = req.params;
    if (!validateClassIdParam(classId)) {
      return res.status(400).json({ error: 'Invalid class ID' });
    }

    const questions = await questionService.getClassQuestions(classId, req.user.id);
    res.status(200).json({ questions });
  } catch (err) {
    next(err);
  }
};
