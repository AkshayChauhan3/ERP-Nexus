const bcrypt = require('bcryptjs');
const prisma = require('../../config/db');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../config/jwt');

/**
 * auth.service.js — Auth Business Logic
 *
 * What this file does:
 *   Handles all database interactions and token generation logic for authentication.
 *   Controllers call these functions — keeping the HTTP layer separate from DB layer.
 */

/**
 * Registers a new user (usually only admins can call this).
 * Hashes the password with bcryptjs before saving to DB.
 */
async function registerUser(data) {
  const hashedPassword = await bcrypt.hash(data.password, 12);
  
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      password: hashedPassword,
    },
    // Don't return the password in the output
    select: { id: true, name: true, email: true, role: true, is_active: true, created_at: true },
  });
  
  return user;
}

/**
 * Authenticates a user by email and password.
 * Returns both access and refresh tokens.
 */
async function login(email, password) {
  // Find user by email
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user || !user.is_active) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }
  
  // Verify password
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }
  
  // Create token payload (keep it small)
  const payload = { id: user.id, email: user.email, role: user.role };
  
  // Generate tokens
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  
  // Remove password before returning
  const { password: _, ...userWithoutPassword } = user;
  
  return {
    accessToken,
    refreshToken,
    user: userWithoutPassword,
  };
}

/**
 * Generates a new access token using a valid refresh token.
 */
async function refreshAccessToken(token) {
  // Throws if invalid or expired
  const decoded = verifyRefreshToken(token);
  
  // Verify user still exists and is active
  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  
  if (!user || !user.is_active) {
    const error = new Error('User inactive or deleted');
    error.status = 401;
    throw error;
  }
  
  // Generate new short-lived access token
  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  
  return { accessToken };
}

/**
 * STUB: We will implement full forgot-password logic in Step 15.
 */
async function forgotPassword(email) {
  return null;
}

/**
 * STUB: We will implement full password-reset logic in Step 15.
 */
async function resetPassword(token, newPassword) {
  return null;
}

/**
 * STUB: We will implement full verify-token logic in Step 15.
 */
async function verifyResetToken(token) {
  return null;
}

module.exports = {
  registerUser,
  login,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  verifyResetToken
};
