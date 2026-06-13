const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../../config/db');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../config/jwt');

/**
 * auth.service.js — Auth Business Logic
 */

function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Public Sign-Up
 * Creates user in PENDING state. Admin must approve later.
 */
async function registerUser(data) {
  // Check existing login_id or email
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ login_id: data.login_id }, { email: data.email }],
    },
  });

  if (existing) {
    const error = new Error('login_id or email already taken');
    error.status = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);
  
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        login_id: data.login_id,
        email: data.email,
        password: hashedPassword,
        status: 'PENDING',
        requested_modules: data.requested_modules,
        profile: {
          create: {
            full_name: data.full_name,
            position: data.position,
            email_display: data.email,
            address: data.address,
            mobile_no: data.mobile_no,
          }
        }
      },
      select: { id: true, login_id: true, email: true, status: true, created_at: true },
    });
    
    return user;
  });
}

/**
 * Authenticates a user by login_id and password.
 */
async function login(login_id, password) {
  // Find user by login_id
  const user = await prisma.user.findUnique({ where: { login_id } });
  
  if (!user) {
    const error = new Error('Invalid login_id or password');
    error.status = 401;
    throw error;
  }
  
  // Verify password
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    const error = new Error('Invalid login_id or password');
    error.status = 401;
    throw error;
  }

  // Check Approval Status
  if (user.status === 'PENDING') {
    const error = new Error('Registration is awaiting admin approval');
    error.status = 403;
    throw error;
  }
  if (user.status === 'REJECTED') {
    const error = new Error(`Your registration was rejected: ${user.rejected_reason || 'No reason provided'}`);
    error.status = 403;
    throw error;
  }
  
  // Create token payload
  const payload = { id: user.id, login_id: user.login_id, is_admin: user.is_admin };
  
  // Generate tokens
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  
  // Hash refresh token and store in DB
  const tokenHash = hashRefreshToken(refreshToken);
  
  await prisma.$transaction([
    // Update last login
    prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() }
    }),
    // Store refresh token
    prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    })
  ]);
  
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
  
  const tokenHash = hashRefreshToken(token);
  
  // Verify token exists in DB and is not revoked
  const dbToken = await prisma.refreshToken.findFirst({
    where: { token_hash: tokenHash, is_revoked: false }
  });

  if (!dbToken || dbToken.expires_at < new Date()) {
    const error = new Error('Invalid or expired refresh token');
    error.status = 403;
    throw error;
  }

  // Verify user still exists and is approved
  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user || user.status !== 'APPROVED') {
    const error = new Error('User inactive or not approved');
    error.status = 401;
    throw error;
  }
  
  const payload = { id: user.id, login_id: user.login_id, is_admin: user.is_admin };
  const accessToken = signAccessToken(payload);
  
  return { accessToken };
}

async function logout(userId, refreshToken) {
  if (refreshToken) {
    const tokenHash = hashRefreshToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { token_hash: tokenHash, user_id: userId },
      data: { is_revoked: true }
    });
  }
}

// STUBS for Forgot Password (Step 15)
async function forgotPassword(email) {
  return null;
}

async function resetPassword(token, newPassword) {
  return null;
}

async function verifyResetToken(token) {
  return null;
}

module.exports = {
  registerUser,
  login,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  verifyResetToken
};
