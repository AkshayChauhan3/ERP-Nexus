const prisma = require('../../config/db');
const salesService = require('./sales.service');

async function getAllDeliveries() {
  return await prisma.salesDelivery.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      customer: { select: { id: true, name: true } },
      sales_order: { select: { id: true, order_number: true, status: true } },
      lines: {
        include: {
          product: { select: { id: true, name: true, sku: true } }
        }
      }
    },
  });
}

async function getDeliveryById(id) {
  return await prisma.salesDelivery.findUniqueOrThrow({
    where: { id },
    include: {
      customer: true,
      sales_order: true,
      lines: {
        include: { product: { select: { id: true, name: true, sku: true } } },
      },
    },
  });
}

async function updateDeliveryStatus(id, status) {
  return await prisma.$transaction(async (tx) => {
    const delivery = await tx.salesDelivery.findUniqueOrThrow({
      where: { id },
    });

    const updateData = { status };
    if (status === 'Dispatched') {
      updateData.dispatch_date = new Date();
      // Update sales order status to dispatched
      await tx.salesOrder.update({
        where: { id: delivery.so_id },
        data: { status: 'dispatched' },
      });
    }

    const updatedDelivery = await tx.salesDelivery.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true } },
        sales_order: true,
        lines: {
          include: { product: { select: { id: true, name: true } } },
        },
      },
    });

    if (status === 'Delivered') {
      // Trigger the business transaction for delivering sales order (which deducts stock)
      // We pass the transaction client (tx) if we inline it, or call the service.
      // Wait, salesService.deliverSalesOrder starts its own transaction, but since prisma doesn't support nested transactions easily in a neat way unless we pass tx, we can inline the delivery status and stock deduction logic or use interactive transaction.
      // Wait, let's look at what deliverSalesOrder does in sales.service.js:
      // It sets status to delivered, sets delivered_qty, and calls deductStockOnDelivery.
      // Let's implement it inside this transaction directly to be 100% safe and consistent!
      
      const so = await tx.salesOrder.findUniqueOrThrow({
        where: { id: delivery.so_id },
        include: { lines: true },
      });

      if (so.status !== 'delivered' && so.status !== 'cancelled') {
        await tx.salesOrder.update({
          where: { id: so.id },
          data: { status: 'delivered' },
        });

        const { deductStockOnDelivery } = require('../../utils/stockMutations');
        for (const line of so.lines) {
          await tx.salesOrderLine.update({
            where: { id: line.id },
            data: { delivered_qty: line.ordered_qty },
          });

          // Deduct stock (on_hand AND reserved)
          await deductStockOnDelivery(tx, line.product_id, line.ordered_qty, 'SALES_ORDER', so.id, `Delivered for SO ${so.id}`);
        }
      }
    }

    return updatedDelivery;
  });
}

module.exports = {
  getAllDeliveries,
  getDeliveryById,
  updateDeliveryStatus,
};
