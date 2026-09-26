import express from 'express';

import {
  registerUser,
  loginUser,
  getMe,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Authentication
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

// Password reset
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

export default router;