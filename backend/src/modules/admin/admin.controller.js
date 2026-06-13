const { z } = require('zod');
const adminService = require('./admin.service');

const rejectSchema = z.object({
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

async function getPendingRegistrations(req, res) {
  const users = await adminService.getPendingRegistrations();
  res.json({ success: true, data: users });
}

async function approve(req, res) {
  const userId = req.params.userId;
  const adminId = req.user.id;
  const user = await adminService.approveRegistration(userId, adminId);
  res.json({ success: true, message: 'User approved successfully', data: user });
}

async function reject(req, res) {
  const userId = req.params.userId;
  const adminId = req.user.id;
  const { reason } = rejectSchema.parse(req.body);
  
  const user = await adminService.rejectRegistration(userId, adminId, reason);
  res.json({ success: true, message: 'User registration rejected', data: user });
}

async function getAllUsers(req, res) {
  const users = await adminService.getAllUsers();
  res.json({ success: true, data: users });
}

module.exports = {
  getPendingRegistrations,
  getAllUsers,
  approve,
  reject,
};
