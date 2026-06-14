const prisma = require('../../config/db');
const salesService = require('./sales.service');

async function getAllQuotations() {
  return await prisma.salesQuotation.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      customer: { select: { id: true, name: true, email: true } },
    },
  });
}

async function getQuotationById(id) {
  return await prisma.salesQuotation.findUniqueOrThrow({
    where: { id },
    include: {
      customer: true,
      lines: {
        include: { product: { select: { id: true, name: true, sku: true } } },
      },
    },
  });
}

async function createQuotation(data) {
  return await prisma.$transaction(async (tx) => {
    const qtnNum = `QTN-2026-${Date.now().toString().slice(-4)}`;
    const qtn = await tx.salesQuotation.create({
      data: {
        quotation_number: qtnNum,
        customer_id: data.customer_id,
        expiry_date: new Date(data.expiry_date),
        amount: data.amount,
        status: data.status || 'Draft',
        remarks: data.remarks,
        lines: {
          create: data.lines.map((line) => ({
            product_id: line.product_id,
            qty: line.qty,
            price: line.price,
            discount: line.discount || 0,
            tax: line.tax || 18,
            total: line.total,
          })),
        },
      },
      include: { lines: true },
    });
    return qtn;
  });
}

async function updateQuotation(id, data) {
  return await prisma.salesQuotation.update({
    where: { id },
    data,
  });
}

async function convertToOrder(id, userId) {
  return await prisma.$transaction(async (tx) => {
    const qtn = await tx.salesQuotation.findUniqueOrThrow({
      where: { id },
      include: {
        customer: true,
        lines: true,
      },
    });

    if (qtn.status === 'Approved') {
      const error = new Error(`Quotation ${qtn.quotation_number} is already converted to an order.`);
      error.name = 'BusinessLogicError';
      throw error;
    }

    // Mark quotation as Approved
    await tx.salesQuotation.update({
      where: { id },
      data: { status: 'Approved' },
    });

    // Map lines to sales order lines
    const soLines = qtn.lines.map((line) => {
      // unit_price in SalesOrderLine is the price after discount and including tax
      const unitPrice = parseFloat(line.total) / parseFloat(line.qty);
      return {
        product_id: line.product_id,
        ordered_qty: parseFloat(line.qty),
        unit_price: unitPrice,
      };
    });

    // Create the Sales Order as draft first
    const orderNum = `SO-2026-${Date.now().toString().slice(-4)}`;
    const so = await tx.salesOrder.create({
      data: {
        order_number: orderNum,
        customer_id: qtn.customer_id,
        created_by: userId,
        status: 'draft',
        expected_delivery_date: qtn.expiry_date,
        customer_address: qtn.customer.address || 'Client Office Delivery',
        remarks: `Converted from Quotation ${qtn.quotation_number}. ${qtn.remarks || ''}`,
        lines: {
          create: soLines.map((line) => ({
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

module.exports = {
  getAllQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  convertToOrder,
};
