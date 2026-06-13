const { z } = require('zod');
const productService = require('./products.service');

const productSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  type: z.enum(['RAW_MATERIAL', 'FINISHED_GOOD']).default('RAW_MATERIAL'),
  sales_price: z.number().positive('Sales price must be positive'),
  cost_price: z.number().positive('Cost price must be positive'),
  on_hand_qty: z.number().min(0, 'On hand quantity cannot be negative').optional(),
  reserved_qty: z.number().min(0, 'Reserved quantity cannot be negative').optional(),
  reorder_level: z.number().min(0, 'Reorder level cannot be negative').optional(),
  procurement_type: z.enum(['MTS', 'MTO']).optional(),
  procure_on_demand: z.boolean().optional(),
  vendor_id: z.string().uuid('Invalid vendor ID format').optional().nullable(),
  bom_id: z.string().uuid('Invalid BOM ID format').optional().nullable(),
  image_url: z.string().optional().nullable(),
});

async function getAll(req, res) {
  const products = await productService.getAllProducts();
  res.json({ success: true, data: products });
}

async function getById(req, res) {
  const product = await productService.getProductById(req.params.id);
  res.json({ success: true, data: product });
}

async function create(req, res) {
  const data = productSchema.parse(req.body);
  const product = await productService.createProduct(data);
  res.status(201).json({ success: true, data: product });
}

async function update(req, res) {
  const data = productSchema.partial().parse(req.body);
  const product = await productService.updateProduct(req.params.id, data);
  res.json({ success: true, data: product });
}

async function remove(req, res) {
  await productService.deleteProduct(req.params.id);
  res.json({ success: true, message: 'Product deleted successfully' });
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
