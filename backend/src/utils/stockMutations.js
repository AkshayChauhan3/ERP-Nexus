class BusinessLogicError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BusinessLogicError';
  }
}

async function resolveWarehouseId(prisma, productId, warehouseId) {
  if (warehouseId) return warehouseId;
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { warehouse_id: true }
  });
  if (product && product.warehouse_id) {
    return product.warehouse_id;
  }
  const defaultWH = await prisma.warehouse.findFirst({ select: { id: true } });
  if (!defaultWH) {
    throw new BusinessLogicError('No warehouses configured in the system.');
  }
  return defaultWH.id;
}

async function checkReorderLevel(tx, productId, warehouseId) {
  const inventory = await tx.inventory.findUnique({
    where: { product_id_warehouse_id: { product_id: productId, warehouse_id: warehouseId } },
    include: { product: true }
  });
  
  if (inventory && parseFloat(inventory.on_hand_qty) < parseFloat(inventory.reorder_level)) {
    const existing = await tx.procurementSuggestion.findFirst({
      where: { product_id: productId, status: 'PENDING' }
    });
    
    if (!existing) {
      const needed = parseFloat(inventory.reorder_level) - parseFloat(inventory.on_hand_qty);
      const suggestedQty = needed > 0 ? needed : 1;
      
      await tx.procurementSuggestion.create({
        data: {
          product_id: productId,
          current_stock: inventory.on_hand_qty,
          shortage_qty: suggestedQty,
          procurement_source: inventory.product.procurement_method || (inventory.product.procurement_type === 'MTO' ? 'MANUFACTURING' : 'PURCHASE'),
          status: 'PENDING',
          reason: `Stock level (${parseFloat(inventory.on_hand_qty).toFixed(3)}) fell below reorder level (${parseFloat(inventory.reorder_level).toFixed(3)}) in warehouse.`
        }
      });
    }
  }
}

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

function getFreeQty(product) {
  const inv = product.inventory || product;
  if (Array.isArray(inv)) {
    return inv.reduce((sum, item) => sum + (parseFloat(item.on_hand_qty) - parseFloat(item.reserved_qty)), 0);
  }
  return parseFloat(inv.on_hand_qty) - parseFloat(inv.reserved_qty);
}

async function reserveStock(prisma, productId, qty, sourceType = 'MANUFACTURING_ORDER', sourceId = null, remarks = null, warehouseId = null) {
  const whId = await resolveWarehouseId(prisma, productId, warehouseId);
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new BusinessLogicError(`Product ${productId} not found`);

  let inventory = await prisma.inventory.findUnique({
    where: { product_id_warehouse_id: { product_id: productId, warehouse_id: whId } }
  });
  if (!inventory) {
    inventory = await prisma.inventory.create({
      data: { product_id: productId, warehouse_id: whId, on_hand_qty: 0, reserved_qty: 0, reorder_level: 0 }
    });
  }

  const currentOnHand = parseFloat(inventory.on_hand_qty);
  const currentReserved = parseFloat(inventory.reserved_qty);
  const newReserved = currentReserved + parseFloat(qty);

  validateStockLevels(product, currentOnHand, newReserved);

  const updatedInv = await prisma.inventory.update({
    where: { product_id_warehouse_id: { product_id: productId, warehouse_id: whId } },
    data: { 
      reserved_qty: newReserved,
      last_movement_at: new Date()
    }
  });

  await prisma.stockReservation.create({
    data: {
      product_id: productId,
      warehouse_id: whId,
      source_type: sourceType,
      source_id: sourceId || productId,
      reserved_qty: qty,
      status: 'ACTIVE'
    }
  });

  await prisma.stockLedger.create({
    data: {
      product_id: productId,
      warehouse_id: whId,
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

async function releaseReservation(prisma, productId, qty, sourceType = 'MANUFACTURING_ORDER', sourceId = null, remarks = null, warehouseId = null) {
  const whId = await resolveWarehouseId(prisma, productId, warehouseId);
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new BusinessLogicError(`Product ${productId} not found`);

  let inventory = await prisma.inventory.findUnique({
    where: { product_id_warehouse_id: { product_id: productId, warehouse_id: whId } }
  });
  if (!inventory) {
    inventory = await prisma.inventory.create({
      data: { product_id: productId, warehouse_id: whId, on_hand_qty: 0, reserved_qty: 0, reorder_level: 0 }
    });
  }

  const currentOnHand = parseFloat(inventory.on_hand_qty);
  const currentReserved = parseFloat(inventory.reserved_qty);
  const newReserved = currentReserved - parseFloat(qty);

  validateStockLevels(product, currentOnHand, newReserved);

  const updatedInv = await prisma.inventory.update({
    where: { product_id_warehouse_id: { product_id: productId, warehouse_id: whId } },
    data: { 
      reserved_qty: newReserved,
      last_movement_at: new Date()
    }
  });

  if (sourceId) {
    await prisma.stockReservation.updateMany({
      where: {
        product_id: productId,
        warehouse_id: whId,
        source_id: sourceId,
        status: 'ACTIVE'
      },
      data: { status: 'RELEASED' }
    });
  }

  await prisma.stockLedger.create({
    data: {
      product_id: productId,
      warehouse_id: whId,
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

async function deductStockOnDelivery(prisma, productId, qty, sourceType = 'SALES_ORDER', sourceId = null, remarks = null, warehouseId = null) {
  const whId = await resolveWarehouseId(prisma, productId, warehouseId);
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new BusinessLogicError(`Product ${productId} not found`);

  let inventory = await prisma.inventory.findUnique({
    where: { product_id_warehouse_id: { product_id: productId, warehouse_id: whId } }
  });
  if (!inventory) {
    inventory = await prisma.inventory.create({
      data: { product_id: productId, warehouse_id: whId, on_hand_qty: 0, reserved_qty: 0, reorder_level: 0 }
    });
  }

  const currentOnHand = parseFloat(inventory.on_hand_qty);
  const currentReserved = parseFloat(inventory.reserved_qty);
  const newOnHand = currentOnHand - parseFloat(qty);
  const newReserved = currentReserved - parseFloat(qty);

  validateStockLevels(product, newOnHand, newReserved);

  const updatedInv = await prisma.inventory.update({
    where: { product_id_warehouse_id: { product_id: productId, warehouse_id: whId } },
    data: { 
      on_hand_qty: newOnHand,
      reserved_qty: newReserved,
      last_movement_at: new Date()
    }
  });

  if (sourceId) {
    await prisma.stockReservation.updateMany({
      where: {
        product_id: productId,
        warehouse_id: whId,
        source_id: sourceId,
        status: 'ACTIVE'
      },
      data: { status: 'CONSUMED' }
    });
  }

  await prisma.stockLedger.create({
    data: {
      product_id: productId,
      warehouse_id: whId,
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

  await checkReorderLevel(prisma, productId, whId);
  return updatedInv;
}

async function addStockOnReceipt(prisma, productId, qty, sourceType = 'GOODS_RECEIPT', sourceId = null, remarks = null, warehouseId = null) {
  const whId = await resolveWarehouseId(prisma, productId, warehouseId);
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new BusinessLogicError(`Product ${productId} not found`);

  let inventory = await prisma.inventory.findUnique({
    where: { product_id_warehouse_id: { product_id: productId, warehouse_id: whId } }
  });
  if (!inventory) {
    inventory = await prisma.inventory.create({
      data: { product_id: productId, warehouse_id: whId, on_hand_qty: 0, reserved_qty: 0, reorder_level: 0 }
    });
  }

  const currentOnHand = parseFloat(inventory.on_hand_qty);
  const currentReserved = parseFloat(inventory.reserved_qty);
  const newOnHand = currentOnHand + parseFloat(qty);

  validateStockLevels(product, newOnHand, currentReserved);

  const updatedInv = await prisma.inventory.update({
    where: { product_id_warehouse_id: { product_id: productId, warehouse_id: whId } },
    data: { 
      on_hand_qty: newOnHand,
      last_movement_at: new Date()
    }
  });

  await prisma.stockLedger.create({
    data: {
      product_id: productId,
      warehouse_id: whId,
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

async function consumeComponentStock(prisma, productId, qty, sourceType = 'MANUFACTURING_ORDER', sourceId = null, remarks = null, warehouseId = null) {
  const whId = await resolveWarehouseId(prisma, productId, warehouseId);
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new BusinessLogicError(`Product ${productId} not found`);

  let inventory = await prisma.inventory.findUnique({
    where: { product_id_warehouse_id: { product_id: productId, warehouse_id: whId } }
  });
  if (!inventory) {
    inventory = await prisma.inventory.create({
      data: { product_id: productId, warehouse_id: whId, on_hand_qty: 0, reserved_qty: 0, reorder_level: 0 }
    });
  }

  const currentOnHand = parseFloat(inventory.on_hand_qty);
  const currentReserved = parseFloat(inventory.reserved_qty);
  const newOnHand = currentOnHand - parseFloat(qty);
  const newReserved = currentReserved - parseFloat(qty);

  validateStockLevels(product, newOnHand, newReserved);

  const updatedInv = await prisma.inventory.update({
    where: { product_id_warehouse_id: { product_id: productId, warehouse_id: whId } },
    data: { 
      on_hand_qty: newOnHand,
      reserved_qty: newReserved,
      last_movement_at: new Date()
    }
  });

  if (sourceId) {
    await prisma.stockReservation.updateMany({
      where: {
        product_id: productId,
        warehouse_id: whId,
        source_id: sourceId,
        status: 'ACTIVE'
      },
      data: { status: 'CONSUMED' }
    });
  }

  await prisma.stockLedger.create({
    data: {
      product_id: productId,
      warehouse_id: whId,
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

  await checkReorderLevel(prisma, productId, whId);
  return updatedInv;
}

async function produceFinishedGoods(prisma, productId, qty, sourceType = 'MANUFACTURING_ORDER', sourceId = null, remarks = null, warehouseId = null) {
  const whId = await resolveWarehouseId(prisma, productId, warehouseId);
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new BusinessLogicError(`Product ${productId} not found`);

  let inventory = await prisma.inventory.findUnique({
    where: { product_id_warehouse_id: { product_id: productId, warehouse_id: whId } }
  });
  if (!inventory) {
    inventory = await prisma.inventory.create({
      data: { product_id: productId, warehouse_id: whId, on_hand_qty: 0, reserved_qty: 0, reorder_level: 0 }
    });
  }

  const currentOnHand = parseFloat(inventory.on_hand_qty);
  const currentReserved = parseFloat(inventory.reserved_qty);
  const newOnHand = currentOnHand + parseFloat(qty);

  validateStockLevels(product, newOnHand, currentReserved);

  const updatedInv = await prisma.inventory.update({
    where: { product_id_warehouse_id: { product_id: productId, warehouse_id: whId } },
    data: { 
      on_hand_qty: newOnHand,
      last_movement_at: new Date()
    }
  });

  await prisma.stockLedger.create({
    data: {
      product_id: productId,
      warehouse_id: whId,
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
