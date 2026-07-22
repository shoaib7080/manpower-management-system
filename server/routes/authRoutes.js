import express from 'express';
import { ROLE_LEVELS } from '../config/constants.js';
import { loginUser, registerUser } from '../controllers/authController.js';
import { protect, requireLevel } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public login route
router.post('/login', loginUser);

// Protected user creation route (Strictly Level 1 Admin)
router.post('/register', protect, requireLevel(ROLE_LEVELS.ADMIN), registerUser);

export default router;