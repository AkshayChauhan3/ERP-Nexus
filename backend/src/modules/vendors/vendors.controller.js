const { z } = require('zod');
const vendorService = require('./vendors.service');

const vendorSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email format').optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

async function getAll(req, res) {
  const vendors = await vendorService.getAllVendors();
  res.json({ success: true, data: vendors });
}

async function getById(req, res) {
  const vendor = await vendorService.getVendorById(req.params.id);
  res.json({ success: true, data: vendor });
}

async function create(req, res) {
  const data = vendorSchema.parse(req.body);
  const vendor = await vendorService.createVendor(data);
  res.status(201).json({ success: true, data: vendor });
}

async function update(req, res) {
  const data = vendorSchema.partial().parse(req.body);
  const vendor = await vendorService.updateVendor(req.params.id, data);
  res.json({ success: true, data: vendor });
}

async function remove(req, res) {
  await vendorService.deleteVendor(req.params.id);
  res.json({ success: true, message: 'Vendor deleted successfully' });
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
