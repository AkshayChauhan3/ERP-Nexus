const { z } = require('zod');
const salesService = require('./sales.service');

const salesOrderSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  lines: z.array(
    z.object({
      product_id: z.string().uuid('Invalid product ID'),
      ordered_qty: z.number().positive('Quantity must be positive'),
      unit_price: z.number().positive('Unit price must be positive'),
    })
  ).min(1, 'Order must have at least one line item'),
});

async function getAll(req, res) {
  const orders = await salesService.getAllSalesOrders();
  res.json({ success: true, data: orders });
}

async function getById(req, res) {
  const order = await salesService.getSalesOrderById(req.params.id);
  res.json({ success: true, data: order });
}

async function create(req, res) {
  const data = salesOrderSchema.parse(req.body);
  const order = await salesService.createSalesOrder(data, req.user.id);
  res.status(201).json({ success: true, data: order });
}

async function confirm(req, res) {
  const order = await salesService.confirmSalesOrder(req.params.id, req.user.id);
  res.json({ success: true, message: 'Sales order confirmed. Stock reserved.', data: order });
}

async function deliver(req, res) {
  const order = await salesService.deliverSalesOrder(req.params.id);
  res.json({ success: true, message: 'Sales order delivered. Stock deducted.', data: order });
}

async function cancel(req, res) {
  const order = await salesService.cancelSalesOrder(req.params.id);
  res.json({ success: true, message: 'Sales order cancelled.', data: order });
}

module.exports = {
  getAll,
  getById,
  create,
  confirm,
  deliver,
  cancel,
};
