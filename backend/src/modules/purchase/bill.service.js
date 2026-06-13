const prisma = require('../../config/db');
const { BusinessLogicError } = require('../../utils/stockMutations');

async function getAllBills() {
  return await prisma.vendorBill.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      vendor: { select: { id: true, name: true } },
      purchase_order: { select: { id: true, po_number: true } },
    },
  });
}

async function getBillById(id) {
  return await prisma.vendorBill.findUniqueOrThrow({
    where: { id },
    include: {
      vendor: true,
      purchase_order: true,
      user: { select: { id: true, login_id: true } },
    },
  });
}

async function createBill(data) {
  // Validate PO belongs to Vendor
  const po = await prisma.purchaseOrder.findUniqueOrThrow({
    where: { id: data.po_id },
  });

  if (po.vendor_id !== data.vendor_id) {
    throw new BusinessLogicError('Purchase Order does not belong to the specified Vendor');
  }

  const totalAmount = parseFloat(data.subtotal) + parseFloat(data.tax);

  return await prisma.vendorBill.create({
    data: {
      bill_number: data.bill_number,
      po_id: data.po_id,
      vendor_id: data.vendor_id,
      invoice_date: new Date(data.invoice_date),
      due_date: new Date(data.due_date),
      subtotal: data.subtotal,
      tax: data.tax,
      total_amount: totalAmount,
      attachment_url: data.attachment_url,
      status: 'pending_payment',
    },
  });
}

async function payBill(id, userId, paymentReference) {
  const bill = await prisma.vendorBill.findUniqueOrThrow({ where: { id } });

  if (bill.status === 'paid') {
    throw new BusinessLogicError('This bill is already paid');
  }

  return await prisma.vendorBill.update({
    where: { id },
    data: {
      status: 'paid',
      paid_at: new Date(),
      paid_by: userId,
      payment_reference: paymentReference,
    },
  });
}

module.exports = {
  getAllBills,
  getBillById,
  createBill,
  payBill,
};
