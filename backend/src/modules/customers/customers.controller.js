const { z } = require('zod');
const customerService = require('./customers.service');

const cleanString = z.preprocess((val) => (val === '' ? null : val), z.string().optional().nullable());
const cleanEmail = z.preprocess((val) => (val === '' ? null : val), z.string().email('Invalid email format').optional().nullable());
const cleanNumber = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return null;
  const num = Number(val);
  return isNaN(num) ? undefined : num;
}, z.number().optional().nullable());

const customerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: cleanEmail,
  phone: cleanString,
  address: cleanString,
  customer_code: cleanString,
  gst_no: cleanString,
  credit_limit: cleanNumber,
  contact_person: cleanString,
});

async function getAll(req, res) {
  const customers = await customerService.getAllCustomers();
  res.json({ success: true, data: customers });
}

async function getById(req, res) {
  const customer = await customerService.getCustomerById(req.params.id);
  res.json({ success: true, data: customer });
}

async function create(req, res) {
  const data = customerSchema.parse(req.body);
  const customer = await customerService.createCustomer(data);
  res.status(201).json({ success: true, data: customer });
}

async function update(req, res) {
  const data = customerSchema.partial().parse(req.body);
  const customer = await customerService.updateCustomer(req.params.id, data);
  res.json({ success: true, data: customer });
}

async function remove(req, res) {
  await customerService.deleteCustomer(req.params.id);
  res.json({ success: true, message: 'Customer deleted successfully' });
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
