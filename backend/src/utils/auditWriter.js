/**
 * utils/auditWriter.js — Central Audit Log Writer
 *
 * What this file does:
 *   Every state change in the ERP system (SO confirmed, PO received, MO completed, etc.)
 *   must be recorded in the audit_logs table for traceability.
 *   This file provides ONE function — writeAudit() — that all business logic
 *   modules call after mutating data.
 *
 *   WHY CENTRALIZE?
 *   - Consistent audit record format across all modules
 *   - Easy to add fields later (e.g., IP address, session ID)
 *   - Single place to enable/disable audit logging
 *   - Runs INSIDE the same Prisma transaction as the mutation it records,
 *     so if the transaction rolls back, the audit entry is also rolled back
 *
 *   AUDIT RECORD SHAPE:
 *   {
 *     user_id:    UUID of the user who performed the action
 *     model_name: 'SalesOrder' | 'PurchaseOrder' | 'ManufacturingOrder' | ...
 *     record_id:  UUID of the affected record
 *     action:     'create' | 'update' | 'delete' | 'status_change'
 *     old_value:  JSON snapshot of the record BEFORE the change (or null for creates)
 *     new_value:  JSON snapshot of the record AFTER the change (or null for deletes)
 *   }
 *
 * STATUS: STUB — signature defined, implementation in Step 08.
 */

/**
 * writeAudit — Records an action in the audit_logs table.
 * Must be called inside a prisma.$transaction() to ensure atomicity.
 *
 * @param {PrismaClient} prisma - Prisma client (the transaction instance)
 * @param {object} options
 * @param {string} options.userId      - ID of the user performing the action
 * @param {string} options.modelName   - e.g., 'SalesOrder', 'Product'
 * @param {string} options.recordId    - UUID of the affected record
 * @param {string} options.action      - 'create' | 'update' | 'delete' | 'status_change'
 * @param {object|null} options.oldValue - Record state BEFORE change
 * @param {object|null} options.newValue - Record state AFTER change
 * @returns {Promise<object>} The created audit log entry
 *
 * @example
 * // Inside a transaction:
 * await writeAudit(prisma, {
 *   userId: req.user.id,
 *   modelName: 'SalesOrder',
 *   recordId: order.id,
 *   action: 'status_change',
 *   oldValue: { status: 'draft' },
 *   newValue: { status: 'confirmed' },
 * });
 */
async function writeAudit(prisma, { userId, modelName, recordId, action, oldValue = null, newValue = null }) {
  // TODO: Implemented in Step 08
  // For now, silently succeed so business logic stubs can be tested
  console.log(`[AUDIT STUB] ${action} on ${modelName}:${recordId} by user:${userId}`);
  return null;
}

module.exports = { writeAudit };
