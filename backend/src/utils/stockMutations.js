/**
 * utils/stockMutations.js — Atomic Stock Operations
 *
 * What this file does:
 *   Contains ALL functions that touch product.on_hand_qty or product.reserved_qty.
 *   Having them in ONE place means:
 *     - Stock invariants are enforced ONCE, not scattered across modules
 *     - Every stock change is auditable and predictable
 *     - Business logic modules (sales, purchase, manufacturing) call these
 *       helpers instead of writing raw Prisma stock queries
 *
 *   INVARIANTS (enforced before every mutation):
 *     1. on_hand_qty >= 0          (stock can never go below zero)
 *     2. reserved_qty >= 0         (can't have negative reservation)
 *     3. reserved_qty <= on_hand_qty (can't reserve more than you have)
 *
 *   STATUS: STUB — function signatures and error classes defined here.
 *   Full implementations are added in Step 06 (Sales), Step 07 (Purchase),
 *   and Step 09 (Manufacturing).
 *
 * All functions accept a `prisma` instance as first argument so they
 * can participate in prisma.$transaction() — the caller controls the transaction.
 */

// ─── Custom Error Class ───────────────────────────────────────────────────────
/**
 * BusinessLogicError — thrown when a stock mutation would violate an invariant.
 * The global errorHandler catches this and returns HTTP 422 Unprocessable Entity.
 */
class BusinessLogicError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BusinessLogicError';
  }
}

// ─── Invariant Validator ──────────────────────────────────────────────────────
/**
 * Validates stock levels BEFORE any mutation is saved.
 * Call this after computing new qty values, before calling prisma.product.update().
 *
 * @param {object} product - Product object with on_hand_qty and reserved_qty
 * @param {Decimal|number} newOnHand - The proposed new on_hand_qty
 * @param {Decimal|number} newReserved - The proposed new reserved_qty
 * @throws {BusinessLogicError} if any invariant would be violated
 */
function validateStockLevels(product, newOnHand, newReserved) {
  const onHand = parseFloat(newOnHand);
  const reserved = parseFloat(newReserved);

  if (onHand < 0) {
    throw new BusinessLogicError(
      `Stock violation for "${product.name}": ` +
      `on_hand_qty would become ${onHand.toFixed(3)}, which is below zero. ` +
      `Current stock: ${parseFloat(product.on_hand_qty).toFixed(3)}`
    );
  }

  if (reserved < 0) {
    throw new BusinessLogicError(
      `Stock violation for "${product.name}": ` +
      `reserved_qty would become ${reserved.toFixed(3)}, which is below zero.`
    );
  }

  if (reserved > onHand) {
    throw new BusinessLogicError(
      `Stock violation for "${product.name}": ` +
      `reserved_qty (${reserved.toFixed(3)}) would exceed on_hand_qty (${onHand.toFixed(3)}).`
    );
  }
}

// ─── Computed Property ────────────────────────────────────────────────────────
/**
 * Computes free_qty (not stored in DB — always calculated).
 * free_qty = on_hand_qty - reserved_qty
 * This is what's actually available for new sales orders.
 *
 * @param {object} product - Product with on_hand_qty and reserved_qty
 * @returns {number} Available free quantity
 */
function getFreeQty(product) {
  return parseFloat(product.on_hand_qty) - parseFloat(product.reserved_qty);
}

// ─── Stock Mutation Functions (STUBS — filled in Step 06–09) ─────────────────

/**
 * Reserves stock for a confirmed sales order line.
 * Adds qty to product.reserved_qty.
 * [IMPLEMENTED IN STEP 06]
 *
 * @param {PrismaClient} prisma - Prisma client (inside a transaction)
 * @param {string} productId - Product UUID
 * @param {number} qty - Quantity to reserve
 * @returns {object} Updated product
 */
async function reserveStock(prisma, productId, qty) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new BusinessLogicError(`Product ${productId} not found`);

  const newReserved = parseFloat(product.reserved_qty) + parseFloat(qty);
  validateStockLevels(product, product.on_hand_qty, newReserved);

  return await prisma.product.update({
    where: { id: productId },
    data: { reserved_qty: newReserved }
  });
}

/**
 * Releases reserved stock when a sales order is cancelled.
 * Subtracts qty from product.reserved_qty.
 * [IMPLEMENTED IN STEP 06]
 *
 * @param {PrismaClient} prisma
 * @param {string} productId
 * @param {number} qty
 * @returns {object} Updated product
 */
async function releaseReservation(prisma, productId, qty) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new BusinessLogicError(`Product ${productId} not found`);

  const newReserved = parseFloat(product.reserved_qty) - parseFloat(qty);
  validateStockLevels(product, product.on_hand_qty, newReserved);

  return await prisma.product.update({
    where: { id: productId },
    data: { reserved_qty: newReserved }
  });
}

/**
 * Deducts stock when a sales order is delivered.
 * Reduces both on_hand_qty and reserved_qty by delivered_qty.
 * [IMPLEMENTED IN STEP 06]
 *
 * @param {PrismaClient} prisma
 * @param {string} productId
 * @param {number} qty
 * @returns {object} Updated product
 */
async function deductStockOnDelivery(prisma, productId, qty) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new BusinessLogicError(`Product ${productId} not found`);

  const newOnHand = parseFloat(product.on_hand_qty) - parseFloat(qty);
  const newReserved = parseFloat(product.reserved_qty) - parseFloat(qty);
  validateStockLevels(product, newOnHand, newReserved);

  return await prisma.product.update({
    where: { id: productId },
    data: {
      on_hand_qty: newOnHand,
      reserved_qty: newReserved
    }
  });
}

/**
 * Adds stock when a purchase order is received.
 * Increases on_hand_qty by received_qty.
 * [IMPLEMENTED IN STEP 07]
 *
 * @param {PrismaClient} prisma
 * @param {string} productId
 * @param {number} qty
 * @returns {object} Updated product
 */
async function addStockOnReceipt(prisma, productId, qty) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new BusinessLogicError(`Product ${productId} not found`);

  const newOnHand = parseFloat(product.on_hand_qty) + parseFloat(qty);
  // Reserved qty stays the same when receiving new stock
  validateStockLevels(product, newOnHand, product.reserved_qty);

  return await prisma.product.update({
    where: { id: productId },
    data: { on_hand_qty: newOnHand }
  });
}

/**
 * Consumes component stock when a manufacturing order is completed.
 * Reduces on_hand_qty and reserved_qty for each BOM component.
 * [IMPLEMENTED IN STEP 09]
 *
 * @param {PrismaClient} prisma
 * @param {string} productId - Component product ID
 * @param {number} qty - Quantity consumed
 * @returns {object} Updated product
 */
async function consumeComponentStock(prisma, productId, qty) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new BusinessLogicError(`Product ${productId} not found`);

  const newOnHand = parseFloat(product.on_hand_qty) - parseFloat(qty);
  const newReserved = parseFloat(product.reserved_qty) - parseFloat(qty);
  validateStockLevels(product, newOnHand, newReserved);

  return await prisma.product.update({
    where: { id: productId },
    data: {
      on_hand_qty: newOnHand,
      reserved_qty: newReserved
    }
  });
}

/**
 * Produces finished goods stock when a manufacturing order is completed.
 * Increases on_hand_qty of the finished product.
 * [IMPLEMENTED IN STEP 09]
 *
 * @param {PrismaClient} prisma
 * @param {string} productId - Finished product ID
 * @param {number} qty
 * @returns {object} Updated product
 */
async function produceFinishedGoods(prisma, productId, qty) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new BusinessLogicError(`Product ${productId} not found`);

  const newOnHand = parseFloat(product.on_hand_qty) + parseFloat(qty);
  validateStockLevels(product, newOnHand, product.reserved_qty);

  return await prisma.product.update({
    where: { id: productId },
    data: { on_hand_qty: newOnHand }
  });
}

module.exports = {
  BusinessLogicError,
  validateStockLevels,
  getFreeQty,
  reserveStock,
  releaseReservation,
  deductStockOnDelivery,
  addStockOnReceipt,
  consumeComponentStock,
  produceFinishedGoods,
};
