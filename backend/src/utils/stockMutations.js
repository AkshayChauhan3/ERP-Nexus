

class BusinessLogicError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BusinessLogicError';
  }
}

async function checkReorderLevel(tx, productId) {
  const product = await tx.product.findUnique({ 
    where: { id: productId },
    include: { inventory: true }
  });
  
  if (product && product.inventory && parseFloat(product.inventory.on_hand_qty) < parseFloat(product.inventory.reorder_level)) {
    const existing = await tx.procurementSuggestion.findFirst({
      where: { product_id: productId, status: 'pending' }
    });
    
    if (!existing) {
      const needed = parseFloat(product.inventory.reorder_level) - parseFloat(product.inventory.on_hand_qty);
      const suggestedQty = needed > 0 ? needed : 1;
      
      await tx.procurementSuggestion.create({
        data: {
          product_id: productId,
          current_stock: product.inventory.on_hand_qty,
          shortage_qty: suggestedQty,
          procurement_source: product.procurement_method || (product.procurement_type === 'MTO' ? 'MANUFACTURING' : 'PURCHASE'),
          status: 'PENDING',
          reason: `Stock level (${parseFloat(product.inventory.on_hand_qty).toFixed(3)}) fell below reorder level (${parseFloat(product.inventory.reorder_level).toFixed(3)})`
        }
      });
    }
  }
}

// ─── Invariant Validator ──────────────────────────────────────────────────────
/**
 * Validates stock levels BEFORE any mutation is saved.
 * Call this after computing new qty values, before calling prisma.inventory.update().
 *
 * @param {object} product - Product object
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
      `on_hand_qty would become ${onHand.toFixed(3)}, which is below zero.`
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
 *
 * @param {object} product - Product with inventory relation
 * @returns {number} Available free quantity
 */
function getFreeQty(product) {
  const inv = product.inventory || product;
  return parseFloat(inv.on_hand_qty) - parseFloat(inv.reserved_qty);
}

// ─── Stock Mutation Functions ─────────────────

/**
 * Reserves stock for a confirmed sales order line or manufacturing order.
 */
async function reserveStock(prisma, productId, qty, sourceType = 'MANUFACTURING_ORDER', sourceId = null, remarks = null) {
  const product = await prisma.product.findUnique({ 
    where: { id: productId },
    include: { inventory: true }
  });
  if (!product) throw new BusinessLogicError(`Product ${productId} not found`);

  // Ensure inventory record exists
  let inventory = product.inventory;
  if (!inventory) {
    inventory = await prisma.inventory.create({
      data: { product_id: productId, on_hand_qty: 0, reserved_qty: 0, reorder_level: 0 }
    });
  }

  const currentOnHand = parseFloat(inventory.on_hand_qty);
  const currentReserved = parseFloat(inventory.reserved_qty);
  const newReserved = currentReserved + parseFloat(qty);

  validateStockLevels(product, currentOnHand, newReserved);

  // 1. Update Inventory
  const updatedInv = await prisma.inventory.update({
    where: { product_id: productId },
    data: { 
      reserved_qty: newReserved,
      last_movement_at: new Date()
    }
  });

  // 2. Create Stock Reservation
  await prisma.stockReservation.create({
    data: {
      product_id: productId,
      source_type: sourceType,
      source_id: sourceId || productId,
      reserved_qty: qty,
      status: 'ACTIVE'
    }
  });

  // 3. Create Stock Ledger
  await prisma.stockLedger.create({
    data: {
      product_id: productId,
      movement_type: sourceType === 'SALES_ORDER' ? 'SALES_RESERVE' : 'MANUFACTURING_RESERVE',
      direction: 'RESERVE',
      reference_type: sourceType,
      reference_id: sourceId,
      quantity: qty,
      stock_before: currentOnHand,
      stock_after: currentOnHand,
      remarks: remarks || `Reserved ${qty} units for ${sourceType}`
    }
  });

  return updatedInv;
}

/**
 * Releases reserved stock when an order is cancelled.
 */
async function releaseReservation(prisma, productId, qty, sourceType = 'MANUFACTURING_ORDER', sourceId = null, remarks = null) {
  const product = await prisma.product.findUnique({ 
    where: { id: productId },
    include: { inventory: true }
  });
  if (!product) throw new BusinessLogicError(`Product ${productId} not found`);

  let inventory = product.inventory;
  if (!inventory) {
    inventory = await prisma.inventory.create({
      data: { product_id: productId, on_hand_qty: 0, reserved_qty: 0, reorder_level: 0 }
    });
  }

  const currentOnHand = parseFloat(inventory.on_hand_qty);
  const currentReserved = parseFloat(inventory.reserved_qty);
  const newReserved = currentReserved - parseFloat(qty);

  validateStockLevels(product, currentOnHand, newReserved);

  // 1. Update Inventory
  const updatedInv = await prisma.inventory.update({
    where: { product_id: productId },
    data: { 
      reserved_qty: newReserved,
      last_movement_at: new Date()
    }
  });

  // 2. Update Stock Reservation status to RELEASED
  if (sourceId) {
    await prisma.stockReservation.updateMany({
      where: {
        product_id: productId,
        source_id: sourceId,
        status: 'ACTIVE'
      },
      data: { status: 'RELEASED' }
    });
  }

  // 3. Create Stock Ledger
  await prisma.stockLedger.create({
    data: {
      product_id: productId,
      movement_type: sourceType === 'SALES_ORDER' ? 'SALES_RELEASE' : 'MANUFACTURING_RELEASE',
      direction: 'RELEASE',
      reference_type: sourceType,
      reference_id: sourceId,
      quantity: qty,
      stock_before: currentOnHand,
      stock_after: currentOnHand,
      remarks: remarks || `Released reservation of ${qty} units`
    }
  });

  return updatedInv;
}

/**
 * Deducts stock when a sales order is delivered.
 */
async function deductStockOnDelivery(prisma, productId, qty, sourceType = 'SALES_ORDER', sourceId = null, remarks = null) {
  const product = await prisma.product.findUnique({ 
    where: { id: productId },
    include: { inventory: true }
  });
  if (!product) throw new BusinessLogicError(`Product ${productId} not found`);

  let inventory = product.inventory;
  if (!inventory) {
    inventory = await prisma.inventory.create({
      data: { product_id: productId, on_hand_qty: 0, reserved_qty: 0, reorder_level: 0 }
    });
  }

  const currentOnHand = parseFloat(inventory.on_hand_qty);
  const currentReserved = parseFloat(inventory.reserved_qty);
  const newOnHand = currentOnHand - parseFloat(qty);
  const newReserved = currentReserved - parseFloat(qty);

  validateStockLevels(product, newOnHand, newReserved);

  // 1. Update Inventory
  const updatedInv = await prisma.inventory.update({
    where: { product_id: productId },
    data: { 
      on_hand_qty: newOnHand,
      reserved_qty: newReserved,
      last_movement_at: new Date()
    }
  });

  // 2. Update Stock Reservation status to CONSUMED
  if (sourceId) {
    await prisma.stockReservation.updateMany({
      where: {
        product_id: productId,
        source_id: sourceId,
        status: 'ACTIVE'
      },
      data: { status: 'CONSUMED' }
    });
  }

  // 3. Create Stock Ledger
  await prisma.stockLedger.create({
    data: {
      product_id: productId,
      movement_type: 'SALES_DELIVERY',
      direction: 'OUT',
      reference_type: sourceType,
      reference_id: sourceId,
      quantity: qty,
      stock_before: currentOnHand,
      stock_after: newOnHand,
      remarks: remarks || `Delivered ${qty} units`
    }
  });

  await checkReorderLevel(prisma, productId);
  return updatedInv;
}

/**
 * Adds stock when a purchase order is received.
 */
async function addStockOnReceipt(prisma, productId, qty, sourceType = 'GOODS_RECEIPT', sourceId = null, remarks = null) {
  const product = await prisma.product.findUnique({ 
    where: { id: productId },
    include: { inventory: true }
  });
  if (!product) throw new BusinessLogicError(`Product ${productId} not found`);

  let inventory = product.inventory;
  if (!inventory) {
    inventory = await prisma.inventory.create({
      data: { product_id: productId, on_hand_qty: 0, reserved_qty: 0, reorder_level: 0 }
    });
  }

  const currentOnHand = parseFloat(inventory.on_hand_qty);
  const currentReserved = parseFloat(inventory.reserved_qty);
  const newOnHand = currentOnHand + parseFloat(qty);

  validateStockLevels(product, newOnHand, currentReserved);

  // 1. Update Inventory
  const updatedInv = await prisma.inventory.update({
    where: { product_id: productId },
    data: { 
      on_hand_qty: newOnHand,
      last_movement_at: new Date()
    }
  });

  // 2. Create Stock Ledger
  await prisma.stockLedger.create({
    data: {
      product_id: productId,
      movement_type: 'PURCHASE_RECEIPT',
      direction: 'IN',
      reference_type: sourceType,
      reference_id: sourceId,
      quantity: qty,
      stock_before: currentOnHand,
      stock_after: newOnHand,
      remarks: remarks || `Received ${qty} units`
    }
  });

  return updatedInv;
}

/**
 * Consumes component stock when a manufacturing order is completed.
 */
async function consumeComponentStock(prisma, productId, qty, sourceType = 'MANUFACTURING_ORDER', sourceId = null, remarks = null) {
  const product = await prisma.product.findUnique({ 
    where: { id: productId },
    include: { inventory: true }
  });
  if (!product) throw new BusinessLogicError(`Product ${productId} not found`);

  let inventory = product.inventory;
  if (!inventory) {
    inventory = await prisma.inventory.create({
      data: { product_id: productId, on_hand_qty: 0, reserved_qty: 0, reorder_level: 0 }
    });
  }

  const currentOnHand = parseFloat(inventory.on_hand_qty);
  const currentReserved = parseFloat(inventory.reserved_qty);
  const newOnHand = currentOnHand - parseFloat(qty);
  const newReserved = currentReserved - parseFloat(qty);

  validateStockLevels(product, newOnHand, newReserved);

  // 1. Update Inventory
  const updatedInv = await prisma.inventory.update({
    where: { product_id: productId },
    data: { 
      on_hand_qty: newOnHand,
      reserved_qty: newReserved,
      last_movement_at: new Date()
    }
  });

  // 2. Update Stock Reservation to CONSUMED
  if (sourceId) {
    await prisma.stockReservation.updateMany({
      where: {
        product_id: productId,
        source_id: sourceId,
        status: 'ACTIVE'
      },
      data: { status: 'CONSUMED' }
    });
  }

  // 3. Create Stock Ledger
  await prisma.stockLedger.create({
    data: {
      product_id: productId,
      movement_type: 'MANUFACTURING_CONSUMPTION',
      direction: 'OUT',
      reference_type: sourceType,
      reference_id: sourceId,
      quantity: qty,
      stock_before: currentOnHand,
      stock_after: newOnHand,
      remarks: remarks || `Consumed ${qty} units for manufacturing`
    }
  });

  await checkReorderLevel(prisma, productId);
  return updatedInv;
}

/**
 * Produces finished goods stock when a manufacturing order is completed.
 */
async function produceFinishedGoods(prisma, productId, qty, sourceType = 'MANUFACTURING_ORDER', sourceId = null, remarks = null) {
  const product = await prisma.product.findUnique({ 
    where: { id: productId },
    include: { inventory: true }
  });
  if (!product) throw new BusinessLogicError(`Product ${productId} not found`);

  let inventory = product.inventory;
  if (!inventory) {
    inventory = await prisma.inventory.create({
      data: { product_id: productId, on_hand_qty: 0, reserved_qty: 0, reorder_level: 0 }
    });
  }

  const currentOnHand = parseFloat(inventory.on_hand_qty);
  const currentReserved = parseFloat(inventory.reserved_qty);
  const newOnHand = currentOnHand + parseFloat(qty);

  validateStockLevels(product, newOnHand, currentReserved);

  // 1. Update Inventory
  const updatedInv = await prisma.inventory.update({
    where: { product_id: productId },
    data: { 
      on_hand_qty: newOnHand,
      last_movement_at: new Date()
    }
  });

  // 2. Create Stock Ledger
  await prisma.stockLedger.create({
    data: {
      product_id: productId,
      movement_type: 'MANUFACTURING_PRODUCTION',
      direction: 'IN',
      reference_type: sourceType,
      reference_id: sourceId,
      quantity: qty,
      stock_before: currentOnHand,
      stock_after: newOnHand,
      remarks: remarks || `Produced ${qty} units`
    }
  });

  return updatedInv;
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
