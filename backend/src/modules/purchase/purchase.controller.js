const { z } = require('zod');
const purchaseService = require('./purchase.service');

const purchaseOrderSchema = z.object({
  vendor_id: z.string().uuid('Invalid vendor ID'),
  lines: z.array(
    z.object({
      product_id: z.string().uuid('Invalid product ID'),
      ordered_qty: z.number().positive('Quantity must be positive'),
      unit_price: z.number().positive('Unit price must be positive'),
    })
  ).min(1, 'Order must have at least one line item'),
});

async function getAll(req, res) {
  const orders = await purchaseService.getAllPurchaseOrders();
  res.json({ success: true, data: orders });
}

async function getById(req, res) {
  const order = await purchaseService.getPurchaseOrderById(req.params.id);
  res.json({ success: true, data: order });
}

async function create(req, res) {
  const data = purchaseOrderSchema.parse(req.body);
  const order = await purchaseService.createPurchaseOrder(data, req.user.id);
  res.status(201).json({ success: true, data: order });
}

async function confirm(req, res) {
  const order = await purchaseService.confirmPurchaseOrder(req.params.id);
  res.json({ success: true, message: 'Purchase order confirmed.', data: order });
}

async function receive(req, res) {
  const order = await purchaseService.receivePurchaseOrder(req.params.id);
  res.json({ success: true, message: 'Purchase order received. Stock increased.', data: order });
}

module.exports = {
  getAll,
  getById,
  create,
  confirm,
  receive,
};
