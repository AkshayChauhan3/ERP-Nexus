const { z } = require('zod');
const moService = require('./mo.service');

const moSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  quantity: z.number().positive('Quantity must be positive'),
});

async function getAll(req, res) {
  const mos = await moService.getAllMOs();
  res.json({ success: true, data: mos });
}

async function getById(req, res) {
  const mo = await moService.getMOById(req.params.id);
  res.json({ success: true, data: mo });
}

async function create(req, res) {
  const data = moSchema.parse(req.body);
  const mo = await moService.createMO(data, req.user.id);
  res.status(201).json({ success: true, data: mo });
}

async function confirm(req, res) {
  const mo = await moService.confirmMO(req.params.id);
  res.json({ success: true, message: 'Manufacturing order confirmed. Components reserved.', data: mo });
}

async function complete(req, res) {
  const mo = await moService.completeMO(req.params.id);
  res.json({ success: true, message: 'Manufacturing order completed. Stock updated.', data: mo });
}

async function cancel(req, res) {
  const mo = await moService.cancelMO(req.params.id);
  res.json({ success: true, message: 'Manufacturing order cancelled. Component reservations released.', data: mo });
}

module.exports = {
  getAll,
  getById,
  create,
  confirm,
  complete,
  cancel,
};
