const { z } = require('zod');
const receiptService = require('./receipt.service');

const receiptSchema = z.object({
  po_id: z.string().uuid('Invalid PO ID'),
  delivery_note_ref: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    po_line_id: z.string().uuid().optional(),
    quantity_received: z.number().positive(),
    remarks: z.string().optional(),
  })).min(1, 'At least one item is required'),
});

async function getAll(req, res) {
  const receipts = await receiptService.getAllReceipts();
  res.json({ success: true, data: receipts });
}

async function getById(req, res) {
  const receipt = await receiptService.getReceiptById(req.params.id);
  res.json({ success: true, data: receipt });
}

async function create(req, res) {
  const data = receiptSchema.parse(req.body);
  const receipt = await receiptService.createReceipt(data, req.user.id);
  res.status(201).json({ success: true, message: 'Goods receipt processed successfully', data: receipt });
}

module.exports = {
  getAll,
  getById,
  create,
};
