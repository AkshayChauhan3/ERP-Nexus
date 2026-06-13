

async function writeAudit(prisma, { userId, modelName, recordId, action, oldValue = null, newValue = null }) {
  console.log(`[AUDIT STUB] ${action} on ${modelName}:${recordId} by user:${userId}`);
  return null;
}

module.exports = { writeAudit };
