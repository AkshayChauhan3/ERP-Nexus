const prisma = require('../../config/db');
const {
  reserveStock,
  deductStockOnDelivery,
  releaseReservation,
} = require('../../utils/stockMutations');

async function getAllSalesOrders() {
  return await prisma.salesOrder.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      customer: { select: { id: true, name: true } },
      user: { select: { id: true, name: true } },
    },
  });
}

async function getSalesOrderById(id) {
  return await prisma.salesOrder.findUniqueOrThrow({
    where: { id },
    include: {
      customer: true,
      user: { select: { id: true, name: true } },
      lines: {
        include: { product: { select: { id: true, name: true, on_hand_qty: true, reserved_qty: true } } },
      },
    },
  });
}

async function createSalesOrder(data, userId) {
  return await prisma.$transaction(async (tx) => {
    const so = await tx.salesOrder.create({
      data: {
        customer_id: data.customer_id,
        created_by: userId,
        status: 'draft',
        lines: {
          create: data.lines.map((line) => ({
            product_id: line.product_id,
            ordered_qty: line.ordered_qty,
            unit_price: line.unit_price,
          })),
        },
      },
      include: { lines: true },
    });
    return so;
  });
}

async function confirmSalesOrder(id) {
  return await prisma.$transaction(async (tx) => {
    const so = await tx.salesOrder.findUniqueOrThrow({
      where: { id },
      include: { lines: true },
    });

    if (so.status !== 'draft') {
      const error = new Error(`Cannot confirm SO in status: ${so.status}`);
      error.name = 'BusinessLogicError';
      throw error;
    }
    const updatedSo = await tx.salesOrder.update({
      where: { id },
      data: { status: 'confirmed' },
      include: { lines: true },
    });
    for (const line of updatedSo.lines) {
      await reserveStock(tx, line.product_id, line.ordered_qty);
    }

    return updatedSo;
  });
}

async function deliverSalesOrder(id) {
  return await prisma.$transaction(async (tx) => {
    const so = await tx.salesOrder.findUniqueOrThrow({
      where: { id },
      include: { lines: true },
    });

    if (so.status !== 'confirmed') {
      const error = new Error(`Cannot deliver SO in status: ${so.status}. Must be confirmed first.`);
      error.name = 'BusinessLogicError';
      throw error;
    }
    const updatedSo = await tx.salesOrder.update({
      where: { id },
      data: { status: 'delivered' },
    });

    for (const line of so.lines) {
      await tx.salesOrderLine.update({
        where: { id: line.id },
        data: { delivered_qty: line.ordered_qty },
      });
      await deductStockOnDelivery(tx, line.product_id, line.ordered_qty);
    }

    return updatedSo;
  });
}

async function cancelSalesOrder(id) {
  return await prisma.$transaction(async (tx) => {
    const so = await tx.salesOrder.findUniqueOrThrow({
      where: { id },
      include: { lines: true },
    });

    if (so.status === 'delivered' || so.status === 'cancelled') {
      const error = new Error(`Cannot cancel SO in status: ${so.status}`);
      error.name = 'BusinessLogicError';
      throw error;
    }

    const updatedSo = await tx.salesOrder.update({
      where: { id },
      data: { status: 'cancelled' },
    });
    if (so.status === 'confirmed') {
      for (const line of so.lines) {
        await releaseReservation(tx, line.product_id, line.ordered_qty);
      }
    }

    return updatedSo;
  });
}

module.exports = {
  getAllSalesOrders,
  getSalesOrderById,
  createSalesOrder,
  confirmSalesOrder,
  deliverSalesOrder,
  cancelSalesOrder,
};
