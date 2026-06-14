const { z } = require('zod');
const quotationService = require('./quotation.service');
const salesService = require('./sales.service');

const quotationSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  expiry_date: z.string(),
  amount: z.number().positive(),
  status: z.string().optional(),
  remarks: z.string().optional().nullable(),
  lines: z.array(
    z.object({
      product_id: z.string().uuid('Invalid product ID'),
      qty: z.number().positive(),
      price: z.number().positive(),
      discount: z.number().nonnegative().default(0),
      tax: z.number().nonnegative().default(18),
      total: z.number().positive(),
    })
  ).min(1, 'Quotation must have at least one line item'),
});

async function getAll(req, res) {
  const quotations = await quotationService.getAllQuotations();
  res.json({ success: true, data: quotations });
}

async function getById(req, res) {
  const quotation = await quotationService.getQuotationById(req.params.id);
  res.json({ success: true, data: quotation });
}

async function create(req, res) {
  const data = quotationSchema.parse(req.body);
  const quotation = await quotationService.createQuotation(data);
  res.status(201).json({ success: true, data: quotation });
}

async function update(req, res) {
  const quotation = await quotationService.updateQuotation(req.params.id, req.body);
  res.json({ success: true, data: quotation });
}

async function convert(req, res) {
  // 1. Convert Quotation to a draft SalesOrder
  const order = await quotationService.convertToOrder(req.params.id, req.user.id);
  
  // 2. Automatically confirm the draft SalesOrder to reserve stock and create a delivery record
  const confirmedOrder = await salesService.confirmSalesOrder(order.id, req.user.id);

  res.json({
    success: true,
    message: 'Quotation successfully converted to confirmed Sales Order.',
    data: confirmedOrder,
  });
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  convert,
};
