const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../../config/db');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../config/jwt');

function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function registerUser(data) {
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

async function login(login_id, password) {
  const user = await prisma.user.findUnique({ 
    where: { login_id },
    include: { profile: true }
  });
  
  if (!user) {
    const error = new Error('Invalid login_id or password');
    error.status = 401;
    throw error;
  }
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    const error = new Error('Invalid login_id or password');
    error.status = 401;
    throw error;
  }
  
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
  
  let mappedRole = 'user';
  if (user.login_id === 'owner') mappedRole = 'owner';
  else if (user.is_admin) mappedRole = 'admin';
  else {
    const access = await prisma.userModuleAccess.findFirst({
      where: { user_id: user.id },
      include: { module: true }
    });
    if (access && access.module) {
      mappedRole = access.module.module_name;
    }
  }

  const payload = { id: user.id, login_id: user.login_id, role: mappedRole };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const tokenHash = hashRefreshToken(refreshToken);
  
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() }
    }),
    prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    })
  ]);
  const { password: _, profile, ...userWithoutPassword } = user;
  
  return {
    accessToken,
    refreshToken,
    user: {
      ...userWithoutPassword,
      name: profile?.full_name || user.login_id,
      role: mappedRole
    },
  };
}

async function refreshAccessToken(token) {
  const decoded = verifyRefreshToken(token);
  
  const tokenHash = hashRefreshToken(token);
  const dbToken = await prisma.refreshToken.findFirst({
    where: { token_hash: tokenHash, is_revoked: false }
  });

  if (!dbToken || dbToken.expires_at < new Date()) {
    const error = new Error('Invalid or expired refresh token');
    error.status = 403;
    throw error;
  }
  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user || user.status !== 'APPROVED') {
    const error = new Error('User inactive or not approved');
    error.status = 401;
    throw error;
  }
  
  let mappedRole = 'user';
  if (user.login_id === 'owner') mappedRole = 'owner';
  else if (user.is_admin) mappedRole = 'admin';
  else {
    const access = await prisma.userModuleAccess.findFirst({
      where: { user_id: user.id },
      include: { module: true }
    });
    if (access && access.module) {
      mappedRole = access.module.module_name;
    }
  }
  
  const payload = { id: user.id, login_id: user.login_id, role: mappedRole };
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
