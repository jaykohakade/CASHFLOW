// backend/routes/authRoutes.js
import express from 'express';
import { login, logout, getMe } from '../controllers/authController.js';

const router = express.Router();

/**
 * POST /api/auth/login
 */
router.post('/login', login);

/**
 * POST /api/auth/logout
 */
router.post('/logout', logout);

/**
 * GET /api/auth/me
 */
router.get('/me', getMe);

export default router;