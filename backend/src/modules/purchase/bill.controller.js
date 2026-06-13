const { z } = require('zod');
const billService = require('./bill.service');

const billSchema = z.object({
  bill_number: z.string().min(1, 'Bill number is required'),
  po_id: z.string().uuid('Invalid PO ID'),
  vendor_id: z.string().uuid('Invalid Vendor ID'),
  invoice_date: z.string().date(),
  due_date: z.string().date(),
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative().default(0),
  attachment_url: z.string().url().optional(),
});

const paySchema = z.object({
  payment_reference: z.string().min(1, 'Payment reference is required'),
});

async function getAll(req, res) {
  const bills = await billService.getAllBills();
  res.json({ success: true, data: bills });
}

async function getById(req, res) {
  const bill = await billService.getBillById(req.params.id);
  res.json({ success: true, data: bill });
}

async function create(req, res) {
  const data = billSchema.parse(req.body);
  const bill = await billService.createBill(data);
  res.status(201).json({ success: true, message: 'Vendor bill created successfully', data: bill });
}

async function pay(req, res) {
  const { payment_reference } = paySchema.parse(req.body);
  const bill = await billService.payBill(req.params.id, req.user.id, payment_reference);
  res.json({ success: true, message: 'Bill marked as paid', data: bill });
}

module.exports = {
  getAll,
  getById,
  create,
  pay,
};
