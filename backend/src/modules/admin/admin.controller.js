const { z } = require('zod');
const adminService = require('./admin.service');

const rejectSchema = z.object({
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

const createSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.string().min(2, 'Role is required'),
});

const updateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.string().min(2, 'Role is required'),
});

const passwordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

function mapUserForFrontend(user) {
  let role = 'user';
  if (user.login_id === 'owner') role = 'owner';
  else if (user.is_admin) role = 'admin';
  else if (user.requested_modules && user.requested_modules.length > 0) {
    // Look for a standard role matching their requested modules
    const matchingRoles = ['sales', 'purchase', 'manufacturing', 'inventory'];
    const matchingModuleIds = { sales: 1, purchase: 2, manufacturing: 3, inventory: 4 };
    const firstMatch = matchingRoles.find(r => user.requested_modules.includes(matchingModuleIds[r]));
    if (firstMatch) role = firstMatch;
  }

  // Fallback to position in profile if present and matches role names
  if (role === 'user' && user.profile?.position) {
    const pos = user.profile.position.toLowerCase();
    if (['admin', 'owner', 'sales', 'purchase', 'manufacturing', 'inventory'].includes(pos)) {
      role = pos;
    }
  }

  return {
    id: user.id,
    login_id: user.login_id,
    email: user.email,
    status: user.status,
    role: role,
    is_active: user.status === 'APPROVED',
    name: user.profile?.full_name || user.login_id,
    created_at: user.created_at,
    last_login: user.last_login_at || null,
  };
}

async function getPendingRegistrations(req, res) {
  const users = await adminService.getPendingRegistrations();
  res.json({ 
    success: true, 
    users: users.map(mapUserForFrontend) 
  });
}

async function approve(req, res) {
  const userId = req.params.userId;
  const adminId = req.user.id;
  const user = await adminService.approveRegistration(userId, adminId);
  res.json({ 
    success: true, 
    message: 'User approved successfully', 
    data: mapUserForFrontend(user) 
  });
}

async function reject(req, res) {
  const userId = req.params.userId;
  const adminId = req.user.id;
  const { reason } = rejectSchema.parse(req.body);
  
  const user = await adminService.rejectRegistration(userId, adminId, reason);
  res.json({ 
    success: true, 
    message: 'User registration rejected', 
    data: user 
  });
}

async function getAllUsers(req, res) {
  const users = await adminService.getAllUsers();
  res.json({ 
    success: true, 
    users: users.map(mapUserForFrontend) 
  });
}

async function create(req, res) {
  const data = createSchema.parse(req.body);
  const adminId = req.user.id;
  const user = await adminService.createUser(data, adminId);
  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: mapUserForFrontend(user)
  });
}

async function update(req, res) {
  const userId = req.params.userId;
  const data = updateSchema.parse(req.body);
  const adminId = req.user.id;
  const user = await adminService.updateUser(userId, data, adminId);
  res.json({
    success: true,
    message: 'User updated successfully',
    data: mapUserForFrontend(user)
  });
}

async function toggle(req, res) {
  const userId = req.params.userId;
  const user = await adminService.toggleUserStatus(userId);
  res.json({
    success: true,
    message: 'User status updated successfully',
    data: mapUserForFrontend(user)
  });
}

async function resetPassword(req, res) {
  const userId = req.params.userId;
  const { password } = passwordSchema.parse(req.body);
  await adminService.resetUserPassword(userId, password);
  res.json({
    success: true,
    message: 'User password reset successfully'
  });
}

module.exports = {
  getPendingRegistrations,
  getAllUsers,
  approve,
  reject,
  create,
  update,
  toggle,
  resetPassword,
};
