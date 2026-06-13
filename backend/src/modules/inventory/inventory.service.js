const prisma = require('../../config/db');

async function getStockLedger(filters) {
  const where = {};

  if (filters.product_id) {
    where.product_id = filters.product_id;
  }
  if (filters.movement_type) {
    where.movement_type = filters.movement_type;
  }
  if (filters.start_date || filters.end_date) {
    where.created_at = {};
    if (filters.start_date) {
      where.created_at.gte = new Date(filters.start_date);
    }
    if (filters.end_date) {
      where.created_at.lte = new Date(filters.end_date);
    }
  }

  return await prisma.stockLedger.findMany({
    where,
    orderBy: { created_at: 'desc' },
    include: {
      product: { select: { id: true, name: true } },
      user: { select: { id: true, login_id: true } },
    },
  });
}

/**
 * Helper to record a stock movement.
 */
async function recordMovement(tx, data) {
  return await tx.stockLedger.create({
    data: {
      product_id: data.product_id,
      movement_type: data.movement_type,
      direction: data.direction,
      reference_type: data.reference_type,
      reference_id: data.reference_id,
      quantity: data.quantity,
      stock_before: data.stock_before,
      stock_after: data.stock_after,
      remarks: data.remarks,
      created_by: data.created_by,
    }
  });
}

module.exports = {
  getStockLedger,
  recordMovement,
};
