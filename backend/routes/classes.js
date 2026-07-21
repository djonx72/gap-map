import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import * as classController from '../controllers/classController.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', writeLimiter, classController.createClass);
router.get('/', classController.listClasses);
router.get('/:id', classController.getClass);

export default router;
