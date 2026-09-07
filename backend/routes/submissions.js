import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import * as submissionController from '../controllers/submissionController.js';

const router = express.Router();

router.use(verifyToken);
router.post('/quiz', submissionController.submitQuiz);
router.get('/status/:classId', submissionController.getStatus);

export default router;
