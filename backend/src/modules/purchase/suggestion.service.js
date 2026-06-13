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
      product: { select: { id: true, name: true, vendor_id: true, inventory: { select: { on_hand_qty: true, reorder_level: true } } } }
    }
  });
}

async function updateSuggestionStatus(id, newStatus) {
  const validStatuses = ['PENDING', 'PO_CREATED', 'MO_CREATED', 'IGNORED', 'pending', 'po_created', 'mo_created', 'ignored'];
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
