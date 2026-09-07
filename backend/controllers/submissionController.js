import { validateQuizSubmission } from '../validators/submissionValidators.js';
import { validateClassIdParam } from '../validators/questionValidators.js';
import * as profileService from '../services/profileService.js';
import * as submissionService from '../services/submissionService.js';

export const submitQuiz = async (req, res, next) => {
  try {
    const profile = await profileService.getProfileById(req.user.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    if (profile.role !== 'student') {
      return res.status(403).json({ error: 'Only students can submit quiz answers.' });
    }

    const validation = validateQuizSubmission(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    const results = await submissionService.processQuizSubmission(req.user.id, req.body.answers);

    res.status(200).json({
      message: 'Quiz submitted successfully',
      results,
      total: req.body.answers.length,
      scored: results.length
    });
  } catch (err) {
    next(err);
  }
};

export const getStatus = async (req, res, next) => {
  try {
    const { classId } = req.params;
    if (!validateClassIdParam(classId)) {
      return res.status(400).json({ error: 'Invalid class ID' });
    }

    const profile = await profileService.getProfileById(req.user.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    if (profile.role !== 'student') {
      return res.status(403).json({ error: 'Only students can check quiz status.' });
    }

    const result = await submissionService.getSubmissionStatus(classId, req.user.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
