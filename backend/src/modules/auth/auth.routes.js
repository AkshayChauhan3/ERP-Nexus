const express = require('express');
const authController = require('./auth.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User login, token refresh, and logout
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login to get access and refresh tokens
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [login_id, password]
 *             properties:
 *               login_id:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: 'boolean', example: true }
 *                 message: { type: 'string', example: 'Login successful' }
 *                 accessToken: { type: 'string' }
 *                 refreshToken: { type: 'string' }
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: 'string' }
 *                     login_id: { type: 'string' }
 *                     is_admin: { type: 'boolean' }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Get a new access token using a refresh token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: 'boolean', example: true }
 *                 accessToken: { type: 'string' }
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', authController.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout from current session
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
// Protected route — user must have a valid access token to log out
router.post('/logout', authenticate, authController.logout);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user (Public Sign-Up)
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [login_id, email, password, full_name, position, requested_modules]
 *             properties:
 *               login_id: { type: 'string' }
 *               email: { type: 'string', format: 'email' }
 *               password: { type: 'string', format: 'password' }
 *               full_name: { type: 'string' }
 *               position: { type: 'string' }
 *               address: { type: 'string' }
 *               mobile_no: { type: 'string' }
 *               requested_modules: 
 *                 type: array
 *                 items: { type: 'number' }
 *     responses:
 *       201:
 *         description: Registration submitted (PENDING)
 *       409:
 *         description: Conflict (login_id or email already taken)
 */
router.post('/register', authController.register);

// STUBS for Forgot Password (Step 15)
// These routes exist so Swagger picks them up, but they do nothing until Step 15
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/verify', authController.verifyResetToken);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
