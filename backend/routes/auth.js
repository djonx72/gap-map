import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { createProfileLimiter } from '../middleware/rateLimiter.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.post('/create-profile', verifyToken, createProfileLimiter, authController.createProfile);

export default router;
