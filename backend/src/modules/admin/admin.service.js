const prisma = require('../../config/db');

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
    const modulesToGrant = user.requested_modules || [];
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

module.exports = {
  getPendingRegistrations,
  getAllUsers,
  approveRegistration,
  rejectRegistration,
};
