const { z } = require('zod');
const authService = require('./auth.service');

/**
 * auth.controller.js — Auth HTTP Layer
 *
 * What this file does:
 *   - Defines Zod schemas to validate incoming request bodies (req.body)
 *   - Calls the appropriate authService function
 *   - Formats the HTTP response (res.json)
 *   - Any thrown errors (like validation or invalid credentials) are
 *     caught by express-async-errors and routed to errorHandler.js
 */

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Assuming only admin creates users for now
const registerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'sales', 'purchase', 'manufacturing', 'inventory', 'owner']),
});

// ─── Controllers ─────────────────────────────────────────────────────────────

async function login(req, res) {
  // Validate req.body. Throws ZodError on failure -> returns HTTP 400 automatically
  const data = loginSchema.parse(req.body);
  
  // Call service
  const result = await authService.login(data.email, data.password);
  
  // Respond
  res.json({
    success: true,
    message: 'Login successful',
    ...result, // spreads accessToken, refreshToken, user
  });
}

async function refresh(req, res) {
  const data = refreshSchema.parse(req.body);
  const result = await authService.refreshAccessToken(data.refreshToken);
  
  res.json({
    success: true,
    accessToken: result.accessToken,
  });
}

async function register(req, res) {
  const data = registerSchema.parse(req.body);
  const user = await authService.registerUser(data);
  
  res.status(201).json({
    success: true,
    message: 'User created successfully',
    user,
  });
}

/**
 * Logout in a JWT stateless system means deleting the tokens on the client side.
 * However, the API provides this endpoint so the client has a formal way to end the session.
 * In a more complex setup, we would add the refreshToken to a Redis blacklist here.
 */
async function logout(req, res) {
  // For now, stateless logout: the client drops the tokens.
  res.json({
    success: true,
    message: 'Logged out successfully',
    hint: 'Client must discard access and refresh tokens locally',
  });
}

// STUBS for Forgot Password (Step 15)
async function forgotPassword(req, res) {
  res.json({ success: true, message: 'Forgot password stub' });
}
async function resetPassword(req, res) {
  res.json({ success: true, message: 'Reset password stub' });
}
async function verifyResetToken(req, res) {
  res.json({ success: true, valid: true });
}

module.exports = {
  login,
  refresh,
  register,
  logout,
  forgotPassword,
  resetPassword,
  verifyResetToken
};
