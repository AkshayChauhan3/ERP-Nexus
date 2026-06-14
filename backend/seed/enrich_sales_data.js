/**
 * Sales Data Enrichment Script
 * Adds additional quotations, orders, and deliveries with varied statuses
 * so all Sales pages have meaningful data to display.
 * Safe to run multiple times (uses upsert/findFirst checks).
 */
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
  console.log('Enrich: Starting sales data enrichment...');

  // Fetch existing reference data
  const adminUser = await prisma.user.findUnique({ where: { login_id: 'admin' } });
  const custSterling = await prisma.customer.findFirst({ where: { customer_code: 'CUST-001' } });
  const custDeco = await prisma.customer.findFirst({ where: { customer_code: 'CUST-002' } });
  const officeChair = await prisma.product.findUnique({ where: { sku: 'FG-CHR-21' } });
  const diningTable = await prisma.product.findUnique({ where: { sku: 'FG-TAB-12' } });

  if (!adminUser || !custSterling || !custDeco || !officeChair || !diningTable) {
    throw new Error('Required seed data not found. Run seed.js first.');
  }

  // ─── Add a 3rd customer ────────────────────────────────────────────────────
  console.log('Enrich: Adding third customer...');
  const custHorizon = await prisma.customer.upsert({
    where: { email: 'procurement@horizonhotels.com' },
    update: {},
    create: {
      customer_code: 'CUST-003',
      name: 'Horizon Hotels & Resorts',
      email: 'procurement@horizonhotels.com',
      phone: '+91 98765 12345',
      address: '22 Marine Drive, Mumbai',
      is_active: true,
    },
  });
  console.log(`  Added: ${custHorizon.name}`);

  // ─── Extra Quotations ──────────────────────────────────────────────────────
  console.log('Enrich: Adding quotations...');

  await prisma.salesQuotation.upsert({
    where: { quotation_number: 'QTN-2026-003' },
    update: {},
    create: {
      quotation_number: 'QTN-2026-003',
      customer_id: custHorizon.id,
      date: new Date('2026-06-08'),
      expiry_date: new Date('2026-07-08'),
      amount: 196560,
      status: 'Sent',
      remarks: 'Bulk order for hotel lobby renovation.',
      lines: {
        create: [
          { product_id: diningTable.id, qty: 4, price: 42000, discount: 0, tax: 18, total: 197760 },
        ],
      },
    },
  });

  await prisma.salesQuotation.upsert({
    where: { quotation_number: 'QTN-2026-004' },
    update: {},
    create: {
      quotation_number: 'QTN-2026-004',
      customer_id: custSterling.id,
      date: new Date('2026-06-10'),
      expiry_date: new Date('2026-06-25'),
      amount: 37000,
      status: 'Draft',
      remarks: 'Needs approval from procurement head.',
      lines: {
        create: [
          { product_id: officeChair.id, qty: 2, price: 18500, discount: 0, tax: 18, total: 43660 },
        ],
      },
    },
  });

  await prisma.salesQuotation.upsert({
    where: { quotation_number: 'QTN-2026-005' },
    update: {},
    create: {
      quotation_number: 'QTN-2026-005',
      customer_id: custDeco.id,
      date: new Date('2026-06-12'),
      expiry_date: new Date('2026-07-12'),
      amount: 99120,
      status: 'Sent',
      remarks: 'New interior design project - showroom display units.',
      lines: {
        create: [
          { product_id: diningTable.id, qty: 2, price: 42000, discount: 0, tax: 18, total: 99120 },
        ],
      },
    },
  });
  console.log('  Added quotations QTN-2026-003, 004, 005');

  // ─── Extra Sales Orders ────────────────────────────────────────────────────
  console.log('Enrich: Adding sales orders...');

  const so3 = await prisma.salesOrder.upsert({
    where: { order_number: 'SO-2026-003' },
    update: {},
    create: {
      order_number: 'SO-2026-003',
      customer_id: custHorizon.id,
      order_date: new Date('2026-06-08'),
      expected_delivery_date: new Date('2026-06-28'),
      status: 'dispatched',
      remarks: 'Hotel lobby project — priority delivery.',
      customer_address: '22 Marine Drive, Mumbai',
      created_by: adminUser.id,
      lines: {
        create: [
          { product_id: officeChair.id, ordered_qty: 8, unit_price: 18500, delivered_qty: 0 },
        ],
      },
    },
  });

  // Reserve 8 chairs for SO3
  const invChairReserve = await prisma.inventory.findFirst({ where: { product_id: officeChair.id } });
  if (invChairReserve) {
    await prisma.inventory.update({
      where: { id: invChairReserve.id },
      data: { reserved_qty: { increment: 8 } },
    });
  }
  await prisma.stockReservation.create({
    data: {
      product_id: officeChair.id,
      source_type: 'SALES_ORDER',
      source_id: so3.id,
      reserved_qty: 8,
      status: 'ACTIVE',
    },
  });

  await prisma.salesDelivery.upsert({
    where: { delivery_number: 'DLV-003' },
    update: {},
    create: {
      delivery_number: 'DLV-003',
      so_id: so3.id,
      customer_id: custHorizon.id,
      delivery_date: new Date('2026-06-28'),
      status: 'Dispatched',
      shipping_address: '22 Marine Drive, Mumbai',
      dispatch_date: new Date('2026-06-13'),
      lines: {
        create: [{ product_id: officeChair.id, qty: 8 }],
      },
    },
  });
  console.log('  Added SO-2026-003 (dispatched) with DLV-003');

  const so4 = await prisma.salesOrder.upsert({
    where: { order_number: 'SO-2026-004' },
    update: {},
    create: {
      order_number: 'SO-2026-004',
      customer_id: custSterling.id,
      order_date: new Date('2026-06-13'),
      expected_delivery_date: new Date('2026-07-10'),
      status: 'draft',
      remarks: 'Office expansion - new wing.',
      customer_address: '101 Corporate tower, Bandra Complex, Mumbai',
      created_by: adminUser.id,
      lines: {
        create: [
          { product_id: officeChair.id, ordered_qty: 5, unit_price: 17390 },
          { product_id: diningTable.id, ordered_qty: 2, unit_price: 49560 },
        ],
      },
    },
  });
  console.log('  Added SO-2026-004 (draft) with 2 line items');

  // ─── Update inventory to reflect enriched data realistically ─────────────
  console.log('Enrich: Setting realistic inventory levels...');
  const invChair = await prisma.inventory.findFirst({ where: { product_id: officeChair.id } });
  if (invChair) {
    await prisma.inventory.update({
      where: { id: invChair.id },
      data: { on_hand_qty: 50 },
    });
  }

  const invTable = await prisma.inventory.findFirst({ where: { product_id: diningTable.id } });
  if (invTable) {
    await prisma.inventory.update({
      where: { id: invTable.id },
      data: { on_hand_qty: 8, reserved_qty: 0 },
    });
  }

  console.log('Enrich: Sales data enrichment complete!');
  console.log('\nDatabase summary:');
  const qtnCount = await prisma.salesQuotation.count();
  const soCount = await prisma.salesOrder.count();
  const dlvCount = await prisma.salesDelivery.count();
  const custCount = await prisma.customer.count();
  console.log(`  Customers:   ${custCount}`);
  console.log(`  Quotations:  ${qtnCount}`);
  console.log(`  Orders:      ${soCount}`);
  console.log(`  Deliveries:  ${dlvCount}`);
}

main()
  .catch((e) => {
    console.error('Enrich error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
