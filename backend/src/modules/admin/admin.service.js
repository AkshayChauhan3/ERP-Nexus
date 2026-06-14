const prisma = require('../../config/db');
const bcrypt = require('bcryptjs');

async function getPendingRegistrations() {
  return await prisma.user.findMany({
    where: { status: 'PENDING' },
    select: {
      id: true,
      login_id: true,
      email: true,
      status: true,
      requested_modules: true,
      created_at: true,
      profile: true,
    }
  });
}

async function approveRegistration(userId, adminId) {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId }
    });

    if (user.status !== 'PENDING') {
      const error = new Error(`User status is ${user.status}, not PENDING.`);
      error.status = 400;
      throw error;
    }
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { status: 'APPROVED' },
    });
    
    const modulesToGrantRaw = user.requested_modules || [];
    if (modulesToGrantRaw.length > 0) {
      const allDbModules = await tx.module.findMany();
      const hardcodedMap = {
        1: 'sales',
        2: 'purchase',
        3: 'manufacturing',
        4: 'inventory'
      };

      const resolvedModuleIds = [];
      for (const rawId of modulesToGrantRaw) {
        const expectedName = hardcodedMap[rawId];
        if (expectedName) {
          const matchedDbModule = allDbModules.find(m => m.module_name === expectedName);
          if (matchedDbModule) {
            resolvedModuleIds.push(matchedDbModule.id);
          }
        } else {
          const matchedDbModule = allDbModules.find(m => m.id === rawId);
          if (matchedDbModule) {
            resolvedModuleIds.push(matchedDbModule.id);
          }
        }
      }

      const uniqueModuleIds = [...new Set(resolvedModuleIds)];
      if (uniqueModuleIds.length > 0) {
        await tx.userModuleAccess.createMany({
          data: uniqueModuleIds.map(moduleId => ({
            user_id: userId,
            module_id: moduleId,
            granted_by: adminId,
          }))
        });
      }
    }

    return updatedUser;
  });
}

async function rejectRegistration(userId, adminId, reason) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId }
  });

  if (user.status !== 'PENDING') {
    const error = new Error(`User status is ${user.status}, not PENDING.`);
    error.status = 400;
    throw error;
  }

  return await prisma.user.update({
    where: { id: userId },
    data: { 
      status: 'REJECTED',
      rejected_reason: reason 
    },
    select: { id: true, login_id: true, status: true, rejected_reason: true }
  });
}

async function getAllUsers() {
  return await prisma.user.findMany({
    select: {
      id: true,
      login_id: true,
      email: true,
      status: true,
      is_admin: true,
      requested_modules: true,
      created_at: true,
      last_login_at: true,
      profile: true,
    }
  });
}

async function createUser(data, adminId) {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ login_id: data.email }, { email: data.email }],
    },
  });

  if (existing) {
    const error = new Error('Username or email already taken');
    error.status = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);
  const is_admin = data.role === 'admin' || data.role === 'owner';

  // Find modules corresponding to the role
  const allModules = await prisma.module.findMany();
  let modulesToGrant = [];
  if (data.role === 'admin' || data.role === 'owner') {
    modulesToGrant = allModules.map(m => m.id);
  } else {
    const matchingModule = allModules.find(m => m.module_name === data.role);
    if (matchingModule) {
      modulesToGrant = [matchingModule.id];
    }
  }

  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        login_id: data.email,
        email: data.email,
        password: hashedPassword,
        is_admin: is_admin,
        status: 'APPROVED',
        requested_modules: modulesToGrant,
        profile: {
          create: {
            full_name: data.name,
            position: data.role.toUpperCase(),
            email_display: data.email,
          }
        }
      },
      include: { profile: true },
    });

    if (modulesToGrant.length > 0) {
      await tx.userModuleAccess.createMany({
        data: modulesToGrant.map(moduleId => ({
          user_id: user.id,
          module_id: moduleId,
          granted_by: adminId,
        }))
      });
    }

    return user;
  });
}

async function updateUser(userId, data, adminId) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId }
  });

  const is_admin = data.role === 'admin' || data.role === 'owner';

  // Find modules corresponding to the role
  const allModules = await prisma.module.findMany();
  let modulesToGrant = [];
  if (data.role === 'admin' || data.role === 'owner') {
    modulesToGrant = allModules.map(m => m.id);
  } else {
    const matchingModule = allModules.find(m => m.module_name === data.role);
    if (matchingModule) {
      modulesToGrant = [matchingModule.id];
    }
  }

  return await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        email: data.email,
        login_id: data.email,
        is_admin: is_admin,
        requested_modules: modulesToGrant,
        profile: {
          update: {
            full_name: data.name,
            position: data.role.toUpperCase(),
            email_display: data.email,
          }
        }
      },
      include: { profile: true }
    });

    // Revoke previous access
    await tx.userModuleAccess.deleteMany({
      where: { user_id: userId }
    });

    // Grant new access
    if (modulesToGrant.length > 0) {
      await tx.userModuleAccess.createMany({
        data: modulesToGrant.map(moduleId => ({
          user_id: userId,
          module_id: moduleId,
          granted_by: adminId,
        }))
      });
    }

    return updatedUser;
  });
}

async function toggleUserStatus(userId) {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId }
    });

    const newStatus = user.status === 'APPROVED' ? 'REJECTED' : 'APPROVED';

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { status: newStatus },
      include: { profile: true }
    });

    // If we are approving a pending user, grant access to their requested modules
    if (user.status === 'PENDING' && newStatus === 'APPROVED') {
      const modulesToGrantRaw = user.requested_modules || [];
      if (modulesToGrantRaw.length > 0) {
        const allDbModules = await tx.module.findMany();
        const hardcodedMap = {
          1: 'sales',
          2: 'purchase',
          3: 'manufacturing',
          4: 'inventory'
        };

        const resolvedModuleIds = [];
        for (const rawId of modulesToGrantRaw) {
          const expectedName = hardcodedMap[rawId];
          if (expectedName) {
            const matchedDbModule = allDbModules.find(m => m.module_name === expectedName);
            if (matchedDbModule) {
              resolvedModuleIds.push(matchedDbModule.id);
            }
          } else {
            const matchedDbModule = allDbModules.find(m => m.id === rawId);
            if (matchedDbModule) {
              resolvedModuleIds.push(matchedDbModule.id);
            }
          }
        }

        const uniqueModuleIds = [...new Set(resolvedModuleIds)];
        if (uniqueModuleIds.length > 0) {
          // Check existing to avoid duplication
          const existingAccess = await tx.userModuleAccess.findMany({
            where: { user_id: userId }
          });
          const existingModuleIds = existingAccess.map(ea => ea.module_id);
          const modulesToInsert = uniqueModuleIds.filter(mid => !existingModuleIds.includes(mid));

          if (modulesToInsert.length > 0) {
            await tx.userModuleAccess.createMany({
              data: modulesToInsert.map(moduleId => ({
                user_id: userId,
                module_id: moduleId,
              }))
            });
          }
        }
      }
    }

    return updatedUser;
  });
}

async function resetUserPassword(userId, newPassword) {
  await prisma.user.findUniqueOrThrow({
    where: { id: userId }
  });

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  return await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });
}

module.exports = {
  getPendingRegistrations,
  getAllUsers,
  approveRegistration,
  rejectRegistration,
  createUser,
  updateUser,
  toggleUserStatus,
  resetUserPassword,
};
