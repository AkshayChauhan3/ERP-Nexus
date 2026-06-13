const prisma = require('../../config/db');

async function getAuditLogs(filters) {
  const where = {};

  if (filters.user_id) {
    where.user_id = filters.user_id;
  }
  if (filters.model_name) {
    where.model_name = filters.model_name;
  }
  if (filters.action) {
    where.action = filters.action;
  }
  if (filters.record_id) {
    where.record_id = filters.record_id;
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

  return await prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    include: {
      user: { select: { id: true, login_id: true } },
    },
    take: 100,
  });
}

module.exports = {
  getAuditLogs,
};
