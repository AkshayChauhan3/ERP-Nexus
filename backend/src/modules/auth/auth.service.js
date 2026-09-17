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
      mappedRole = access.module.module_name.toLowerCase();
    } else if (user.profile?.position) {
      const p = user.profile.position.toLowerCase();
      if (p.includes('owner') || p.includes('ceo')) mappedRole = 'owner';
      else if (p.includes('pur') || p.includes('procure')) mappedRole = 'purchase';
      else if (p.includes('sal')) mappedRole = 'sales';
      else if (p.includes('mfg') || p.includes('produc')) mappedRole = 'manufacturing';
      else if (p.includes('inv') || p.includes('ware') || p.includes('stock')) mappedRole = 'inventory';
    } else if (user.login_id) {
      const lid = user.login_id.toLowerCase();
      if (lid.includes('pur')) mappedRole = 'purchase';
      else if (lid.includes('sal')) mappedRole = 'sales';
      else if (lid.includes('mfg')) mappedRole = 'manufacturing';
      else if (lid.includes('inv')) mappedRole = 'inventory';
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
      role: mappedRole,
      position: profile?.position || mappedRole,
      address: profile?.address || '',
      mobile: profile?.mobile_no || '',
      profile_photo: profile?.profile_photo || '',
    },
  };
}

async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true }
  });
  if (!user) throw new Error('User not found');
  
  let mappedRole = 'user';
  if (user.login_id === 'owner') mappedRole = 'owner';
  else if (user.profile?.position && (user.profile.position.toLowerCase().includes('owner') || user.profile.position.toLowerCase().includes('ceo'))) mappedRole = 'owner';
  else if (user.is_admin) mappedRole = 'admin';
  else {
    const access = await prisma.userModuleAccess.findFirst({
      where: { user_id: user.id },
      include: { module: true }
    });
    if (access && access.module) {
      mappedRole = access.module.module_name.toLowerCase();
    } else if (user.profile?.position) {
      const p = user.profile.position.toLowerCase();
      if (p.includes('pur') || p.includes('procure')) mappedRole = 'purchase';
      else if (p.includes('sal')) mappedRole = 'sales';
      else if (p.includes('mfg') || p.includes('produc')) mappedRole = 'manufacturing';
      else if (p.includes('inv') || p.includes('ware') || p.includes('stock')) mappedRole = 'inventory';
    } else if (user.login_id) {
      const lid = user.login_id.toLowerCase();
      if (lid.includes('pur')) mappedRole = 'purchase';
      else if (lid.includes('sal')) mappedRole = 'sales';
      else if (lid.includes('mfg')) mappedRole = 'manufacturing';
      else if (lid.includes('inv')) mappedRole = 'inventory';
    }
  }

  return {
    id: user.id,
    login_id: user.login_id,
    email: user.email,
    is_admin: user.is_admin,
    role: mappedRole,
    name: user.profile?.full_name || user.login_id,
    position: user.profile?.position || mappedRole,
    address: user.profile?.address || '',
    mobile: user.profile?.mobile_no || '',
    profile_photo: user.profile?.profile_photo || '',
  };
}

async function updateProfile(userId, data) {
  const { name, address, mobile, profile_photo } = data;
  const updated = await prisma.userProfile.upsert({
    where: { user_id: userId },
    create: {
      user_id: userId,
      full_name: name || 'User',
      position: 'Staff',
      email_display: '',
      address: address || '',
      mobile_no: mobile || '',
      profile_photo: profile_photo || null,
    },
    update: {
      full_name: name !== undefined ? name : undefined,
      address: address !== undefined ? address : undefined,
      mobile_no: mobile !== undefined ? mobile : undefined,
      profile_photo: profile_photo !== undefined ? profile_photo : undefined,
    }
  });
  return updated;
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
  verifyResetToken,
  getProfile,
  updateProfile
};
