const { z } = require('zod');
const bomService = require('./bom.service');

const bomSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  lines: z.array(
    z.object({
      component_product_id: z.string().uuid('Invalid component ID'),
      qty_per_unit: z.number().positive('Quantity must be positive'),
      operation: z.enum(['assembly', 'painting', 'packing']),
    })
  ).min(1, 'BOM must have at least one component'),
});

const bomUpdateSchema = z.object({
  lines: z.array(
    z.object({
      component_product_id: z.string().uuid('Invalid component ID'),
      qty_per_unit: z.number().positive('Quantity must be positive'),
      operation: z.enum(['assembly', 'painting', 'packing']),
    })
  ).min(1, 'BOM must have at least one component'),
});

async function getAll(req, res) {
  const boms = await bomService.getAllBoms();
  res.json({ success: true, data: boms });
}

async function getById(req, res) {
  const bom = await bomService.getBomById(req.params.id);
  res.json({ success: true, data: bom });
}

async function create(req, res) {
  const data = bomSchema.parse(req.body);
  const bom = await bomService.createBom(data);
  res.status(201).json({ success: true, data: bom });
}

async function update(req, res) {
  const data = bomUpdateSchema.parse(req.body);
  const bom = await bomService.updateBom(req.params.id, data);
  res.json({ success: true, data: bom });
}

async function remove(req, res) {
  await bomService.deleteBom(req.params.id);
  res.json({ success: true, message: 'BOM deleted successfully' });
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
