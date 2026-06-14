const { z } = require('zod');
const deliveryService = require('./delivery.service');

const statusSchema = z.object({
  status: z.enum(['Pending', 'Packed', 'Dispatched', 'Delivered']),
});

async function getAll(req, res) {
  const deliveries = await deliveryService.getAllDeliveries();
  res.json({ success: true, data: deliveries });
}

async function getById(req, res) {
  const delivery = await deliveryService.getDeliveryById(req.params.id);
  res.json({ success: true, data: delivery });
}

async function updateStatus(req, res) {
  const { status } = statusSchema.parse(req.body);
  const delivery = await deliveryService.updateDeliveryStatus(req.params.id, status);
  res.json({ success: true, message: `Delivery status updated to ${status}`, data: delivery });
}

module.exports = {
  getAll,
  getById,
  updateStatus,
};
