const prisma = require('../../config/db');
const {
  reserveStock,
  releaseReservation,
  consumeComponentStock,
  produceFinishedGoods,
} = require('../../utils/stockMutations');

async function getAllMOs() {
  return await prisma.manufacturingOrder.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      product: { select: { id: true, name: true } },
      user: { select: { id: true, login_id: true } },
    },
  });
}

async function getMOById(id) {
  return await prisma.manufacturingOrder.findUniqueOrThrow({
    where: { id },
    include: {
      product: true,
      bom: {
        include: { lines: { include: { component: true } } }
      },
      work_orders: true,
      user: { select: { id: true, login_id: true } },
    },
  });
}

async function createMO(data, userId) {
  const bom = await prisma.billOfMaterials.findUnique({
    where: { product_id: data.product_id },
    include: { lines: true },
  });

  if (!bom) {
    const error = new Error('Product does not have a Bill of Materials');
    error.name = 'BusinessLogicError';
    throw error;
  }

  if (bom.lines.length === 0) {
    const error = new Error('BOM has no components');
    error.name = 'BusinessLogicError';
    throw error;
  }

  return await prisma.manufacturingOrder.create({
    data: {
      product_id: data.product_id,
      bom_id: bom.id,
      quantity: data.quantity,
      status: 'draft',
      created_by: userId,
    },
  });
}

async function confirmMO(id) {
  return await prisma.$transaction(async (tx) => {
    const mo = await tx.manufacturingOrder.findUniqueOrThrow({
      where: { id },
      include: { bom: { include: { lines: true } } },
    });

    if (mo.status !== 'draft') {
      const error = new Error(`Cannot confirm MO in status: ${mo.status}`);
      error.name = 'BusinessLogicError';
      throw error;
    }
    for (const line of mo.bom.lines) {
      const requiredQty = parseFloat(line.qty_per_unit) * parseFloat(mo.quantity);
      await reserveStock(tx, line.component_product_id, requiredQty);
    }
    const operations = [...new Set(mo.bom.lines.map(l => l.operation))];
    
    await tx.workOrder.createMany({
      data: operations.map(op => ({
        mo_id: id,
        operation: op,
        work_center: `WC-${op.toUpperCase()}`,
        status: 'pending'
      }))
    });
    return await tx.manufacturingOrder.update({
      where: { id },
      data: { status: 'confirmed' },
      include: { work_orders: true },
    });
  });
}

async function completeMO(id) {
  return await prisma.$transaction(async (tx) => {
    const mo = await tx.manufacturingOrder.findUniqueOrThrow({
      where: { id },
      include: { bom: { include: { lines: true } } },
    });

    if (mo.status !== 'confirmed' && mo.status !== 'in_progress') {
      const error = new Error(`Cannot complete MO in status: ${mo.status}. Must be confirmed or in_progress.`);
      error.name = 'BusinessLogicError';
      throw error;
    }
    for (const line of mo.bom.lines) {
      const requiredQty = parseFloat(line.qty_per_unit) * parseFloat(mo.quantity);
      await consumeComponentStock(tx, line.component_product_id, requiredQty);
    }
    await produceFinishedGoods(tx, mo.product_id, mo.quantity);
    await tx.workOrder.updateMany({
      where: { mo_id: id, status: { not: 'completed' } },
      data: { status: 'completed', completed_at: new Date() }
    });
    return await tx.manufacturingOrder.update({
      where: { id },
      data: { status: 'completed' },
    });
  });
}

async function cancelMO(id) {
  return await prisma.$transaction(async (tx) => {
    const mo = await tx.manufacturingOrder.findUniqueOrThrow({
      where: { id },
      include: { bom: { include: { lines: true } } },
    });

    if (mo.status === 'completed' || mo.status === 'cancelled') {
      const error = new Error(`Cannot cancel MO in status: ${mo.status}`);
      error.name = 'BusinessLogicError';
      throw error;
    }
    if (mo.status === 'confirmed' || mo.status === 'in_progress') {
      for (const line of mo.bom.lines) {
        const requiredQty = parseFloat(line.qty_per_unit) * parseFloat(mo.quantity);
        await releaseReservation(tx, line.component_product_id, requiredQty);
      }
    }
    await tx.workOrder.deleteMany({
      where: { mo_id: id }
    });

    return await tx.manufacturingOrder.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  });
}

module.exports = {
  getAllMOs,
  getMOById,
  createMO,
  confirmMO,
  completeMO,
  cancelMO,
};
