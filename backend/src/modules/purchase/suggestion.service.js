const prisma = require('../../config/db');
const { BusinessLogicError } = require('../../utils/stockMutations');

async function getAllSuggestions(filters = {}) {
  const where = {};
  if (filters.status) {
    where.status = filters.status;
  }

  return await prisma.procurementSuggestion.findMany({
    where,
    orderBy: { created_at: 'desc' },
    include: {
      product: { select: { id: true, name: true, on_hand_qty: true, reorder_level: true, vendor_id: true } }
    }
  });
}

async function updateSuggestionStatus(id, newStatus) {
  const validStatuses = ['pending', 'po_created', 'ignored'];
  if (!validStatuses.includes(newStatus)) {
    throw new BusinessLogicError(`Invalid status: ${newStatus}`);
  }

  return await prisma.procurementSuggestion.update({
    where: { id },
    data: { status: newStatus }
  });
}

module.exports = {
  getAllSuggestions,
  updateSuggestionStatus,
};
