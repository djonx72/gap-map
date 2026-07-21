import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import * as questionController from '../controllers/questionController.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', writeLimiter, questionController.createQuestion);
router.get('/:classId', questionController.listClassQuestions);

export default router;
