const prisma = require('../../config/db');
const { BusinessLogicError } = require('../../utils/stockMutations');

async function getAllReceipts() {
  return await prisma.goodsReceipt.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      purchase_order: { select: { id: true } },
      user: { select: { id: true, login_id: true } },
    },
  });
}

async function getReceiptById(id) {
  return await prisma.goodsReceipt.findUniqueOrThrow({
    where: { id },
    include: {
      purchase_order: true,
      lines: { include: { product: true } },
      user: { select: { id: true, login_id: true } },
    },
  });
}

async function createReceipt(data, userId) {
  return await prisma.$transaction(async (tx) => {
    // 1. Validate PO
    const po = await tx.purchaseOrder.findUniqueOrThrow({
      where: { id: data.po_id },
      include: { lines: true },
    });

    if (po.status !== 'confirmed') {
      throw new BusinessLogicError(`Cannot receive goods for PO in status: ${po.status}`);
    }

    // 2. Create Receipt Header
    const receiptNumber = `GRN-${Date.now()}`;
    const receipt = await tx.goodsReceipt.create({
      data: {
        receipt_number: receiptNumber,
        po_id: data.po_id,
        received_by: userId,
        delivery_note_ref: data.delivery_note_ref,
      },
    });

    // 3. Process Lines
    for (const item of data.items) {
      // Find the corresponding PO line
      const poLine = po.lines.find(l => l.product_id === item.product_id);
      if (!poLine) {
        throw new BusinessLogicError(`Product ${item.product_id} is not part of this PO`);
      }

      const qtyReceived = parseFloat(item.quantity_received);
      if (qtyReceived <= 0) continue;

      // a) Create receipt line
      await tx.goodsReceiptLine.create({
        data: {
          receipt_id: receipt.id,
          product_id: item.product_id,
          qty_received: qtyReceived,
          remarks: item.remarks,
        }
      });

      // b) Increment PO Line received_qty
      await tx.purchaseOrderLine.update({
        where: { id: poLine.id },
        data: { received_qty: { increment: qtyReceived } }
      });

      // c) Increment Product on_hand_qty
      const product = await tx.product.findUnique({ where: { id: item.product_id } });
      const newOnHand = parseFloat(product.on_hand_qty) + qtyReceived;
      await tx.product.update({
        where: { id: item.product_id },
        data: { on_hand_qty: newOnHand }
      });

      // d) Log to StockLedger
      await tx.stockLedger.create({
        data: {
          product_id: item.product_id,
          movement_type: 'purchase_in',
          qty_change: qtyReceived,
          reference_model: 'GoodsReceipt',
          reference_id: receipt.id,
          created_by: userId,
        }
      });
    }

    // 4. Evaluate PO status
    // Refetch PO lines to get updated quantities
    const updatedPoLines = await tx.purchaseOrderLine.findMany({
      where: { po_id: data.po_id }
    });

    const isFullyReceived = updatedPoLines.every(l => parseFloat(l.received_qty) >= parseFloat(l.ordered_qty));
    
    if (isFullyReceived) {
      await tx.purchaseOrder.update({
        where: { id: data.po_id },
        data: { status: 'received' }
      });
    }

    return await tx.goodsReceipt.findUnique({
      where: { id: receipt.id },
      include: { lines: true }
    });
  });
}

module.exports = {
  getAllReceipts,
  getReceiptById,
  createReceipt,
};
