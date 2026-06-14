const prisma = require('../../config/db');

async function getWarehouses() {
  return await prisma.warehouse.findMany({
    orderBy: { warehouse_code: 'asc' },
  });
}

async function createWarehouse(data) {
  const count = await prisma.warehouse.count();
  const code = `WH-${String(count + 1).padStart(3, '0')}`;
  return await prisma.warehouse.create({
    data: {
      warehouse_code: code,
      name: data.name,
      location: data.location,
      manager: data.manager,
      capacity: parseInt(data.capacity) || 1000,
      status: data.status || 'Active',
    }
  });
}

async function getInventory(filters = {}) {
  const where = {};
  if (filters.warehouse_id && filters.warehouse_id !== 'All') {
    where.warehouse_id = filters.warehouse_id;
  }
  if (filters.product_id) {
    where.product_id = filters.product_id;
  }

  // Fetch all inventory records matching filters
  const inventoryList = await prisma.inventory.findMany({
    where,
    include: {
      product: true,
      warehouse: true,
    },
    orderBy: [
      { product: { name: 'asc' } }
    ]
  });

  // Map to flat schema expected by frontend
  return inventoryList.map(inv => ({
    id: inv.product.id,
    inventoryId: inv.id,
    productId: inv.product.id,
    code: inv.product.sku,
    name: inv.product.name,
    category: inv.product.type === 'RAW_MATERIAL' ? 'Raw Materials' :
              inv.product.type === 'FINISHED_GOOD' ? 'Finished Goods' :
              inv.product.type === 'CONSUMABLE' ? 'Consumables' : 'Packaging Materials',
    warehouseId: inv.warehouse.warehouse_code, // client key maps to code like WH-001/WH-002
    warehouseUuid: inv.warehouse.id,
    currentStock: parseFloat(inv.on_hand_qty),
    reservedStock: parseFloat(inv.reserved_qty),
    reorderLevel: parseFloat(inv.reorder_level),
    unit: inv.product.unit || 'pcs',
    costPrice: parseFloat(inv.product.cost_price),
  }));
}

async function getTransfers() {
  const transfers = await prisma.stockTransfer.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      product: true,
      source_warehouse: true,
      destination_warehouse: true,
    }
  });

  return transfers.map(t => ({
    id: t.transfer_number,
    uuid: t.id,
    source: t.source_warehouse.warehouse_code,
    destination: t.destination_warehouse.warehouse_code,
    productId: t.product_id,
    productName: t.product.name,
    qty: parseFloat(t.qty),
    status: t.status,
    date: t.date.toISOString().split('T')[0],
    reason: t.reason,
  }));
}

async function createTransfer(data, userId) {
  return await prisma.$transaction(async (tx) => {
    // Resolve warehouses by code
    const src = await tx.warehouse.findUnique({ where: { warehouse_code: data.source } });
    const dest = await tx.warehouse.findUnique({ where: { warehouse_code: data.destination } });
    if (!src || !dest) throw new Error('Invalid source or destination warehouse code');

    const count = await tx.stockTransfer.count();
    const trfNum = `TRF-${String(count + 1).padStart(3, '0')}`;

    return await tx.stockTransfer.create({
      data: {
        transfer_number: trfNum,
        source_warehouse_id: src.id,
        destination_warehouse_id: dest.id,
        product_id: data.productId,
        qty: parseFloat(data.qty),
        status: 'Pending',
        reason: data.reason || '',
        created_by: userId,
      }
    });
  });
}

async function completeTransfer(transferNumber, userId) {
  return await prisma.$transaction(async (tx) => {
    const trf = await tx.stockTransfer.findUnique({
      where: { transfer_number: transferNumber },
      include: { product: true }
    });
    if (!trf) throw new Error('Transfer request not found');
    if (trf.status !== 'Pending') throw new Error('Transfer is not pending');

    const qty = parseFloat(trf.qty);

    // 1. Source warehouse deduction
    let srcInv = await tx.inventory.findUnique({
      where: { product_id_warehouse_id: { product_id: trf.product_id, warehouse_id: trf.source_warehouse_id } }
    });
    if (!srcInv) {
      srcInv = await tx.inventory.create({
        data: { product_id: trf.product_id, warehouse_id: trf.source_warehouse_id, on_hand_qty: 0, reserved_qty: 0 }
      });
    }

    const srcOldQty = parseFloat(srcInv.on_hand_qty);
    if (srcOldQty < qty) {
      throw new Error(`Insufficient stock in source warehouse. Available: ${srcOldQty}, Required: ${qty}`);
    }

    const srcNewQty = srcOldQty - qty;
    if (parseFloat(srcInv.reserved_qty) > srcNewQty) {
      throw new Error(`Cannot transfer stock because some units are reserved. Reserved: ${srcInv.reserved_qty}`);
    }

    await tx.inventory.update({
      where: { product_id_warehouse_id: { product_id: trf.product_id, warehouse_id: trf.source_warehouse_id } },
      data: { on_hand_qty: srcNewQty, last_movement_at: new Date() }
    });

    await tx.stockLedger.create({
      data: {
        product_id: trf.product_id,
        warehouse_id: trf.source_warehouse_id,
        movement_type: 'STOCK_TRANSFER_OUT',
        direction: 'OUT',
        reference_type: 'STOCK_TRANSFER',
        reference_id: trf.id,
        quantity: qty,
        stock_before: srcOldQty,
        stock_after: srcNewQty,
        remarks: trf.reason || `Stock transfer out to ${trf.destination_warehouse_id}`,
        created_by: userId
      }
    });

    // 2. Destination warehouse addition
    let destInv = await tx.inventory.findUnique({
      where: { product_id_warehouse_id: { product_id: trf.product_id, warehouse_id: trf.destination_warehouse_id } }
    });
    if (!destInv) {
      destInv = await tx.inventory.create({
        data: { product_id: trf.product_id, warehouse_id: trf.destination_warehouse_id, on_hand_qty: 0, reserved_qty: 0 }
      });
    }

    const destOldQty = parseFloat(destInv.on_hand_qty);
    const destNewQty = destOldQty + qty;

    await tx.inventory.update({
      where: { product_id_warehouse_id: { product_id: trf.product_id, warehouse_id: trf.destination_warehouse_id } },
      data: { on_hand_qty: destNewQty, last_movement_at: new Date() }
    });

    await tx.stockLedger.create({
      data: {
        product_id: trf.product_id,
        warehouse_id: trf.destination_warehouse_id,
        movement_type: 'STOCK_TRANSFER_IN',
        direction: 'IN',
        reference_type: 'STOCK_TRANSFER',
        reference_id: trf.id,
        quantity: qty,
        stock_before: destOldQty,
        stock_after: destNewQty,
        remarks: trf.reason || `Stock transfer in from ${trf.source_warehouse_id}`,
        created_by: userId
      }
    });

    // 3. Update status
    return await tx.stockTransfer.update({
      where: { id: trf.id },
      data: { status: 'Completed', updated_at: new Date() }
    });
  });
}

async function getAdjustments() {
  const adjustments = await prisma.stockAdjustment.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      product: true,
      warehouse: true,
      user: { select: { email: true } },
    }
  });

  return adjustments.map(adj => ({
    id: adj.adjustment_number,
    productId: adj.product_id,
    productName: adj.product.name,
    warehouseId: adj.warehouse.warehouse_code,
    oldQty: parseFloat(adj.old_qty),
    newQty: parseFloat(adj.new_qty),
    reason: adj.reason,
    createdBy: adj.user?.email || 'System',
    date: adj.created_at.toISOString().split('T')[0],
  }));
}

async function createAdjustment(data, userId) {
  return await prisma.$transaction(async (tx) => {
    // Resolve warehouse by code
    const wh = await tx.warehouse.findUnique({ where: { warehouse_code: data.warehouseId } });
    if (!wh) throw new Error('Warehouse not found');

    let inv = await tx.inventory.findUnique({
      where: { product_id_warehouse_id: { product_id: data.productId, warehouse_id: wh.id } }
    });
    if (!inv) {
      inv = await tx.inventory.create({
        data: { product_id: data.productId, warehouse_id: wh.id, on_hand_qty: 0, reserved_qty: 0 }
      });
    }

    const oldQty = parseFloat(inv.on_hand_qty);
    const newQty = parseFloat(data.adjustedQuantity);
    const diff = newQty - oldQty;

    if (newQty < 0) throw new Error('Adjusted quantity cannot be negative.');
    if (parseFloat(inv.reserved_qty) > newQty) {
      throw new Error(`Cannot adjust stock below reserved quantity (${inv.reserved_qty})`);
    }

    // Update inventory
    await tx.inventory.update({
      where: { product_id_warehouse_id: { product_id: data.productId, warehouse_id: wh.id } },
      data: { on_hand_qty: newQty, last_movement_at: new Date() }
    });

    // Log adjustment
    const count = await tx.stockAdjustment.count();
    const adjNum = `ADJ-${String(count + 1).padStart(3, '0')}`;
    const adj = await tx.stockAdjustment.create({
      data: {
        adjustment_number: adjNum,
        product_id: data.productId,
        warehouse_id: wh.id,
        old_qty: oldQty,
        new_qty: newQty,
        reason: data.reason || 'Physical Count Correction',
        created_by: userId
      }
    });

    // Ledger entry
    await tx.stockLedger.create({
      data: {
        product_id: data.productId,
        warehouse_id: wh.id,
        movement_type: 'STOCK_ADJUSTMENT',
        direction: diff >= 0 ? 'IN' : 'OUT',
        reference_type: 'STOCK_ADJUSTMENT',
        reference_id: adj.id,
        quantity: Math.abs(diff),
        stock_before: oldQty,
        stock_after: newQty,
        remarks: data.reason || 'Physical stock adjustment',
        created_by: userId
      }
    });

    return adj;
  });
}

async function getStockLedger(filters = {}) {
  const where = {};
  if (filters.product_id) {
    where.product_id = filters.product_id;
  }
  if (filters.warehouse_id && filters.warehouse_id !== 'All') {
    // Lookup by code or UUID
    const wh = await prisma.warehouse.findFirst({
      where: {
        OR: [
          { id: filters.warehouse_id },
          { warehouse_code: filters.warehouse_id }
        ]
      }
    });
    if (wh) where.warehouse_id = wh.id;
  }
  if (filters.movement_type) {
    where.movement_type = filters.movement_type;
  }

  const ledger = await prisma.stockLedger.findMany({
    where,
    orderBy: { created_at: 'desc' },
    include: {
      product: true,
      warehouse: true,
      user: { select: { email: true } },
    }
  });

  return ledger.map(entry => ({
    id: entry.id,
    date: entry.created_at.toISOString().split('T')[0],
    productId: entry.product_id,
    productName: entry.product.name,
    productCode: entry.product.sku,
    warehouseId: entry.warehouse.warehouse_code,
    type: entry.movement_type.replace(/_/g, ' '),
    qty: entry.direction === 'OUT' || entry.movement_type === 'STOCK_TRANSFER_OUT' ? -parseFloat(entry.quantity) : parseFloat(entry.quantity),
    prevStock: parseFloat(entry.stock_before),
    newStock: parseFloat(entry.stock_after),
    refNo: entry.reference_id || 'N/A',
    createdBy: entry.user?.email || 'System',
  }));
}

async function getReservedStock() {
  const reservations = await prisma.stockReservation.findMany({
    where: { status: 'ACTIVE' },
    include: {
      product: {
        include: {
          inventory: true
        }
      },
      warehouse: true,
    }
  });

  return reservations.map(res => {
    // find inventory for this reservation's product and warehouse
    const whInv = res.product.inventory.find(i => i.warehouse_id === res.warehouse_id);
    const onHand = whInv ? parseFloat(whInv.on_hand_qty) : 0;
    const reserved = whInv ? parseFloat(whInv.reserved_qty) : 0;

    return {
      id: res.id,
      productId: res.product_id,
      productName: res.product.name,
      productCode: res.product.sku,
      warehouse: res.warehouse?.warehouse_code || 'N/A',
      currentStock: onHand,
      reservedStock: reserved,
      availableStock: onHand - reserved,
      reservedFor: res.source_type.replace(/_/g, ' '),
      refNo: res.source_id,
    };
  });
}

module.exports = {
  getWarehouses,
  createWarehouse,
  getInventory,
  getTransfers,
  createTransfer,
  completeTransfer,
  getAdjustments,
  createAdjustment,
  getStockLedger,
  getReservedStock,
};
