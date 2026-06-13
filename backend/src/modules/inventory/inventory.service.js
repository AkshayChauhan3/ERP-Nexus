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
    where.timestamp = {};
    if (filters.start_date) {
      where.timestamp.gte = new Date(filters.start_date);
    }
    if (filters.end_date) {
      where.timestamp.lte = new Date(filters.end_date);
    }
  }

  return await prisma.stockLedger.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    include: {
      product: { select: { id: true, name: true } },
      user: { select: { id: true, login_id: true } },
    },
  });
}

async function recordMovement(tx, data) {
  return await tx.stockLedger.create({
    data: {
      product_id: data.product_id,
      movement_type: data.movement_type,
      qty_change: data.qty_change,
      reference_model: data.reference_model,
      reference_id: data.reference_id,
      created_by: data.created_by,
    }
  });
}

module.exports = {
  getStockLedger,
  recordMovement,
};
