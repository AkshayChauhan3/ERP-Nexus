const { z } = require('zod');
const auditService = require('./audit.service');

const auditFilterSchema = z.object({
  user_id: z.string().uuid().optional(),
  model_name: z.string().optional(),
  record_id: z.string().uuid().optional(),
  action: z.enum(['create', 'update', 'delete', 'status_change']).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

async function getLogs(req, res) {
  const filters = auditFilterSchema.parse(req.query);
  const logs = await auditService.getAuditLogs(filters);
  res.json({ success: true, data: logs });
}

module.exports = {
  getLogs,
};
