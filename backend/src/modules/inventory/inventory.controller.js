const { z } = require('zod');
const inventoryService = require('./inventory.service');

const filterSchema = z.object({
  product_id: z.string().uuid().optional(),
  movement_type: z.enum(['sale_out', 'purchase_in', 'mfg_consume', 'mfg_produce', 'adjustment']).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

async function getLedger(req, res) {
  const filters = filterSchema.parse(req.query);
  const ledger = await inventoryService.getStockLedger(filters);
  res.json({ success: true, data: ledger });
}

module.exports = {
  getLedger,
};
