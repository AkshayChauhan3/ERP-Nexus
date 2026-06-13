const prisma = require('../../config/db');
const { addStockOnReceipt } = require('../../utils/stockMutations');

async function getAllPurchaseOrders() {
  return await prisma.purchaseOrder.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      vendor: { select: { id: true, name: true } },
      user: { select: { id: true, name: true } },
    },
  });
}

async function getPurchaseOrderById(id) {
  return await prisma.purchaseOrder.findUniqueOrThrow({
    where: { id },
    include: {
      vendor: { select: { id: true, name: true, vendor_code: true } },
      user: { select: { id: true, login_id: true } },
      lines: { include: { product: { select: { id: true, name: true, sku: true } } } },
      receipts: true,
      bills: true,
    },
  });
}

async function createPurchaseOrder(data, userId) {
  return await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.create({
      data: {
        vendor_id: data.vendor_id,
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
    return po;
  });
}

async function confirmPurchaseOrder(id) {
  return await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUniqueOrThrow({
      where: { id },
    });

    if (po.status !== 'draft') {
      const error = new Error(`Cannot confirm PO in status: ${po.status}`);
      error.name = 'BusinessLogicError';
      throw error;
    }

    return await tx.purchaseOrder.update({
      where: { id },
      data: { status: 'confirmed' },
      include: { lines: true },
    });
  });
}

async function receivePurchaseOrder(id) {
  return await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUniqueOrThrow({
      where: { id },
      include: { lines: true },
    });

    if (po.status !== 'confirmed') {
      const error = new Error(`Cannot receive PO in status: ${po.status}. Must be confirmed first.`);
      error.name = 'BusinessLogicError';
      throw error;
    }

    const updatedPo = await tx.purchaseOrder.update({
      where: { id },
      data: { status: 'received' },
    });

    for (const line of po.lines) {
      await tx.purchaseOrderLine.update({
        where: { id: line.id },
        data: { received_qty: line.ordered_qty },
      });

      await addStockOnReceipt(tx, line.product_id, line.ordered_qty, 'PURCHASE_ORDER', po.id, 'Direct PO reception');
    }

    return updatedPo;
  });
}

module.exports = {
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  confirmPurchaseOrder,
  receivePurchaseOrder,
};
