const prisma = require('../../config/db');
const { BusinessLogicError, addStockOnReceipt } = require('../../utils/stockMutations');

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
    const po = await tx.purchaseOrder.findUniqueOrThrow({
      where: { id: data.po_id },
      include: { lines: true },
    });

    if (po.status !== 'confirmed') {
      throw new BusinessLogicError(`Cannot receive goods for PO in status: ${po.status}`);
    }
    const receiptNumber = `GRN-${Date.now()}`;
    const receipt = await tx.goodsReceipt.create({
      data: {
        receipt_number: receiptNumber,
        po_id: data.po_id,
        received_by: userId,
        delivery_note_ref: data.delivery_note_ref,
      },
    });
    for (const item of data.items) {
      const poLine = item.po_line_id
        ? po.lines.find(l => l.id === item.po_line_id)
        : po.lines.find(l => l.product_id === item.product_id);
      if (!poLine) {
        throw new BusinessLogicError(`Product/PO Line reference is not part of this PO`);
      }

      const qtyReceived = parseFloat(item.quantity_received);
      if (qtyReceived <= 0) continue;
      await tx.goodsReceiptLine.create({
        data: {
          receipt_id: receipt.id,
          product_id: item.product_id,
          po_line_id: poLine.id,
          qty_received: qtyReceived,
          remarks: item.remarks,
        }
      });
      await tx.purchaseOrderLine.update({
        where: { id: poLine.id },
        data: { received_qty: { increment: qtyReceived } }
      });

      // c) Increment Product on_hand_qty and log in ledger via stockMutations
      await addStockOnReceipt(tx, item.product_id, qtyReceived, 'GOODS_RECEIPT', receipt.id, item.remarks);
    }
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
