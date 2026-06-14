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
  const mappedLogs = logs.map(log => ({
    id: log.id,
    timestamp: log.created_at,
    user: log.user ? log.user.login_id : log.user_id || 'System',
    module: log.model_name,
    action: log.action,
    old_value: log.old_value ? JSON.stringify(log.old_value) : '-',
    new_value: log.new_value ? JSON.stringify(log.new_value) : '-'
  }));
  res.json({ success: true, data: mappedLogs });
}

module.exports = {
  getLogs,
};
