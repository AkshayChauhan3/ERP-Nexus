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
      user: { select: { id: true, login_id: true } },
      lines: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              inventory: {
                select: {
                  on_hand_qty: true,
                  reserved_qty: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

async function getSalesOrderById(id) {
  return await prisma.salesOrder.findUniqueOrThrow({
    where: { id },
    include: {
      customer: true,
      user: { select: { id: true, login_id: true } },
      lines: {
        include: { product: { select: { id: true, name: true, inventory: { select: { on_hand_qty: true, reserved_qty: true } } } } },
      },
    },
  });
}

async function createSalesOrder(data, userId) {
  return await prisma.$transaction(async (tx) => {
    const orderNum = data.order_number || `SO-${Date.now().toString().slice(-6)}`;
    const so = await tx.salesOrder.create({
      data: {
        order_number: orderNum,
        customer_id: data.customer_id,
        created_by: userId,
        status: 'draft',
        expected_delivery_date: data.expected_delivery_date ? new Date(data.expected_delivery_date) : null,
        customer_address: data.customer_address,
        remarks: data.remarks,
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

const { autoProcure } = require('../../utils/procurementAutomation');

async function confirmSalesOrder(id, userId) {
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
      const product = await tx.product.findUnique({
        where: { id: line.product_id },
        include: { inventory: true }
      });

      if (!product) {
        throw new Error(`Product ${line.product_id} not found`);
      }

      const onHand = parseFloat(product.inventory?.on_hand_qty || 0);
      const reserved = parseFloat(product.inventory?.reserved_qty || 0);
      const available = Math.max(0, onHand - reserved);
      const orderedQty = parseFloat(line.ordered_qty);

      let shortage = 0;
      let qtyToReserve = orderedQty;

      if (orderedQty > available) {
        shortage = orderedQty - available;
        qtyToReserve = available;
      }

      if (shortage > 0) {
        const canProcure = product.procure_on_demand || product.procurement_type === 'MTO';
        if (!canProcure) {
          const error = new Error(`Insufficient stock for product "${product.name}" and auto-replenishment is disabled.`);
          error.name = 'BusinessLogicError';
          throw error;
        }

        // Update sales order line with shortage_qty
        await tx.salesOrderLine.update({
          where: { id: line.id },
          data: { shortage_qty: shortage }
        });

        // Trigger automatic procurement
        await autoProcure(tx, product, shortage, so.created_by || userId, so.id);
      }

      if (qtyToReserve > 0) {
        await reserveStock(tx, line.product_id, qtyToReserve, 'SALES_ORDER', id, `Reserved for SO ${id}`);
      }
    }

    // Create a corresponding SalesDelivery record automatically
    const deliveryNum = `DLV-2026-${Date.now().toString().slice(-4)}`;
    await tx.salesDelivery.create({
      data: {
        delivery_number: deliveryNum,
        so_id: id,
        customer_id: so.customer_id,
        delivery_date: updatedSo.expected_delivery_date || new Date(),
        status: 'Pending',
        shipping_address: updatedSo.customer_address || 'Customer Registered Address',
        lines: {
          create: updatedSo.lines.map(l => ({
            product_id: l.product_id,
            qty: l.ordered_qty,
          })),
        },
      },
    });

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

      // Deduct stock (on_hand AND reserved)
      await deductStockOnDelivery(tx, line.product_id, line.ordered_qty, 'SALES_ORDER', id, `Delivered for SO ${id}`);
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
        await releaseReservation(tx, line.product_id, line.ordered_qty, 'SALES_ORDER', id, `Released due to SO cancel`);
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
