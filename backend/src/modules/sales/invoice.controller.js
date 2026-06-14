const PDFDocument = require('pdfkit');
const prisma = require('../../config/db');

async function generateInvoicePDF(req, res) {
  try {
    const { id } = req.params;

    const order = await prisma.salesOrder.findUniqueOrThrow({
      where: { id },
      include: {
        customer: true,
        user: { select: { id: true, login_id: true } },
        lines: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    const invoiceNo = `INV-${order.id.substring(0, 8).toUpperCase()}`;
    const orderDate = new Date(order.created_at).toLocaleDateString('en-IN');
    const deliveryDate = order.expected_delivery_date
      ? new Date(order.expected_delivery_date).toLocaleDateString('en-IN')
      : 'N/A';
    const total = order.lines.reduce(
      (s, l) => s + Number(l.ordered_qty) * Number(l.unit_price),
      0
    );

    // --- Build PDF ---
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${invoiceNo}.pdf"`
    );
    doc.pipe(res);

    // ─── Header Band ──────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 100).fill('#1a1a2e');
    doc.fill('#ffffff')
      .fontSize(26)
      .font('Helvetica-Bold')
      .text('NEXUS ERP', 50, 30);
    doc.fontSize(10)
      .font('Helvetica')
      .fill('#a0a8c0')
      .text('Commercial Invoice', 50, 62);
    doc.fill('#ffffff')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(invoiceNo, doc.page.width - 180, 40, { width: 130, align: 'right' });
    doc.font('Helvetica')
      .fill('#a0a8c0')
      .fontSize(9)
      .text(`Date: ${orderDate}`, doc.page.width - 180, 58, { width: 130, align: 'right' });

    doc.y = 120;

    // ─── Bill To / Order Info ─────────────────────────────────────────────────
    const colLeft = 50;
    const colRight = 310;

    doc.fill('#1a1a2e').fontSize(9).font('Helvetica-Bold').text('BILLED TO', colLeft, doc.y);
    doc.fill('#1a1a2e').fontSize(9).font('Helvetica-Bold').text('ORDER INFO', colRight, doc.y - doc.currentLineHeight());

    doc.moveDown(0.4);
    const infoY = doc.y;

    doc.fill('#2d2d2d').font('Helvetica').fontSize(11)
      .text(order.customer?.name || 'N/A', colLeft, infoY, { width: 240 });
    doc.fontSize(9).fill('#555555')
      .text(order.customer?.address || order.customer_address || 'N/A', colLeft, doc.y, { width: 240 });
    if (order.customer?.gst_no) {
      doc.text(`GST: ${order.customer.gst_no}`, colLeft, doc.y, { width: 240 });
    }

    doc.fontSize(10).fill('#2d2d2d').font('Helvetica-Bold').text(order.order_number, colRight, infoY);
    doc.font('Helvetica').fontSize(9).fill('#555555')
      .text(`Status: ${order.status.toUpperCase()}`, colRight, doc.y)
      .text(`Order Date: ${orderDate}`, colRight, doc.y)
      .text(`Deliver By: ${deliveryDate}`, colRight, doc.y)
      .text(`Ship To: ${order.customer_address || 'N/A'}`, colRight, doc.y);

    doc.y = Math.max(doc.y, infoY + 80) + 20;

    // ─── Divider ─────────────────────────────────────────────────────────────
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor('#e0e0e0').lineWidth(1).stroke();
    doc.y += 12;

    // ─── Items Table Header ───────────────────────────────────────────────────
    const tableTop = doc.y;
    doc.rect(50, tableTop, doc.page.width - 100, 22).fill('#1a1a2e');
    doc.fill('#ffffff').fontSize(9).font('Helvetica-Bold');
    doc.text('#', 58, tableTop + 7, { width: 20 });
    doc.text('Product', 82, tableTop + 7, { width: 200 });
    doc.text('Qty', 290, tableTop + 7, { width: 50, align: 'right' });
    doc.text('Unit Price', 345, tableTop + 7, { width: 80, align: 'right' });
    doc.text('Amount', 430, tableTop + 7, { width: 100, align: 'right' });

    doc.y = tableTop + 28;

    // ─── Items Rows ───────────────────────────────────────────────────────────
    order.lines.forEach((line, idx) => {
      const rowY = doc.y;
      const rowBg = idx % 2 === 0 ? '#f8f9ff' : '#ffffff';
      doc.rect(50, rowY - 4, doc.page.width - 100, 22).fill(rowBg);

      const lineTotal = Number(line.ordered_qty) * Number(line.unit_price);

      doc.fill('#333333').font('Helvetica').fontSize(9);
      doc.text(`${idx + 1}`, 58, rowY, { width: 20 });
      doc.text(line.product?.name || 'Item', 82, rowY, { width: 200 });
      doc.text(String(line.ordered_qty), 290, rowY, { width: 50, align: 'right' });
      doc.text(`Rs.${Number(line.unit_price).toLocaleString('en-IN')}`, 345, rowY, { width: 80, align: 'right' });
      doc.fill('#1a1a2e').font('Helvetica-Bold')
        .text(`Rs.${lineTotal.toLocaleString('en-IN')}`, 430, rowY, { width: 100, align: 'right' });

      doc.y = rowY + 22;
    });

    doc.y += 6;

    // ─── Totals Block ─────────────────────────────────────────────────────────
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor('#e0e0e0').stroke();
    doc.y += 10;

    const subtotal = total;
    const tax = 0; // Can be extended later
    const grandTotal = subtotal + tax;

    const totX = 380;
    const totW = 160;

    doc.fill('#555555').font('Helvetica').fontSize(9)
      .text('Subtotal:', totX, doc.y, { width: totW - 60, align: 'right' });
    doc.fill('#222222').font('Helvetica-Bold')
      .text(`Rs.${subtotal.toLocaleString('en-IN')}`, totX + totW - 60, doc.y - doc.currentLineHeight(), { width: 60, align: 'right' });

    doc.y += 4;
    doc.fill('#555555').font('Helvetica').fontSize(9)
      .text('Tax (GST):', totX, doc.y, { width: totW - 60, align: 'right' });
    doc.fill('#222222').font('Helvetica-Bold')
      .text('Included', totX + totW - 60, doc.y - doc.currentLineHeight(), { width: 60, align: 'right' });

    doc.y += 8;
    doc.rect(totX - 10, doc.y - 4, totW + 10, 26).fill('#1a1a2e');
    doc.fill('#ffffff').fontSize(11).font('Helvetica-Bold')
      .text('TOTAL:', totX, doc.y + 3, { width: totW - 60, align: 'right' });
    doc.text(`Rs.${grandTotal.toLocaleString('en-IN')}`, totX + totW - 60, doc.y + 3, { width: 60, align: 'right' });

    doc.y += 40;

    // ─── Remarks ─────────────────────────────────────────────────────────────
    if (order.remarks) {
      doc.fill('#555555').font('Helvetica').fontSize(8)
        .text(`Remarks: ${order.remarks}`, 50, doc.y, { width: 400 });
      doc.y += 20;
    }

    // ─── Footer ───────────────────────────────────────────────────────────────
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor('#e0e0e0').stroke();
    doc.y += 10;
    doc.fill('#888888').fontSize(8).font('Helvetica')
      .text(
        'This is a computer-generated invoice and does not require a physical signature.',
        50, doc.y, { align: 'center', width: doc.page.width - 100 }
      );
    doc.text('Nexus ERP — Powered by AI-driven operations', 50, doc.y + 12, {
      align: 'center',
      width: doc.page.width - 100,
    });

    doc.end();
  } catch (err) {
    console.error('Invoice PDF generation error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate invoice PDF' });
    }
  }
}

module.exports = { generateInvoicePDF };
