/**
 * utils/procurementAutomation.js — Auto PO / MO Creation
 *
 * What this file does:
 *   When confirming a Sales Order, if a product has insufficient free stock
 *   AND has `procure_on_demand = true`, the system automatically creates
 *   a draft procurement document to replenish the shortage:
 *
 *   - If product.procurement_type == 'MTO' (Make To Order):
 *       → Create a draft ManufacturingOrder for shortage_qty
 *         (product will be manufactured internally)
 *
 *   - If product.procurement_type == 'MTS' (Make To Stock / Buy):
 *       → Create a draft PurchaseOrder from the product's default vendor
 *         (product will be bought from a supplier)
 *
 *   This is the "Procurement Automation" feature from the requirements.
 *   It runs inside the same Prisma transaction as SO confirmation, so if
 *   anything fails, the auto-created PO/MO is also rolled back.
 *
 *   After auto-creation, a human (purchase/manufacturing manager) reviews
 *   and confirms the auto-created document. It's never auto-confirmed.
 *
 * STATUS: STUB — full logic implemented in Step 06.
 */

/**
 * autoProcure — Creates a draft PO or MO to cover a shortage.
 * Called during SO confirmation when free_qty < ordered_qty.
 *
 * @param {PrismaClient} prisma    - Prisma client (transaction instance)
 * @param {object}       product   - Product with procurement_type, vendor_id, bom_id
 * @param {number}       shortage  - Quantity that needs to be procured
 * @param {string}       userId    - User who triggered the SO confirmation
 * @param {string}       soId      - Source sales order ID (for reference)
 * @returns {Promise<{type: 'PurchaseOrder'|'ManufacturingOrder', id: string}>}
 *
 * @example
 * // Called inside SO confirm transaction:
 * if (product.procure_on_demand && shortage > 0) {
 *   const doc = await autoProcure(prisma, product, shortage, req.user.id, order.id);
 *   console.log(`Auto-created ${doc.type} ${doc.id}`);
 * }
 */
async function autoProcure(prisma, product, shortage, userId, soId) {
  // TODO: Implemented in Step 06
  console.log(
    `[PROCUREMENT STUB] Would auto-procure ${shortage} units of "${product.name}" ` +
    `via ${product.procurement_type === 'MTO' ? 'ManufacturingOrder' : 'PurchaseOrder'}`
  );
  return null;
}

module.exports = { autoProcure };
