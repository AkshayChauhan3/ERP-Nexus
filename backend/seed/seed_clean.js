const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Seed Clean: Starting database clean seeding...');

  console.log('Seed Clean: Clearing existing database records...');
  await prisma.stockAdjustment.deleteMany({});
  await prisma.stockTransfer.deleteMany({});
  await prisma.stockReservation.deleteMany({});
  await prisma.stockLedger.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.riskAlert.deleteMany({});
  await prisma.procurementSuggestion.deleteMany({});
  await prisma.goodsReceiptLine.deleteMany({});
  await prisma.goodsReceipt.deleteMany({});
  await prisma.vendorBill.deleteMany({});
  await prisma.purchaseOrderLine.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.salesDeliveryLine.deleteMany({});
  await prisma.salesDelivery.deleteMany({});
  await prisma.salesQuotationLine.deleteMany({});
  await prisma.salesQuotation.deleteMany({});
  await prisma.salesOrderLine.deleteMany({});
  await prisma.salesOrder.deleteMany({});
  await prisma.bOMLine.deleteMany({});
  await prisma.billOfMaterials.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.vendor.deleteMany({});
  await prisma.userModuleAccess.deleteMany({});
  await prisma.userProfile.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.warehouse.deleteMany({});

  // 1. Seed Modules
  const modulesToSeed = [
    { name: 'sales', desc: 'Sales Order management and Customer relations' },
    { name: 'purchase', desc: 'Purchase Order management, Vendors and Goods Receipts' },
    { name: 'manufacturing', desc: 'Bill of Materials, Operations and Manufacturing Orders' },
    { name: 'inventory', desc: 'Stock Ledger, Warehousing and Stock status tracking' },
  ];

  console.log('Seed: Initializing ERP Modules...');
  const moduleMap = {};
  for (const item of modulesToSeed) {
    const mod = await prisma.module.upsert({
      where: { module_name: item.name },
      update: { description: item.desc },
      create: {
        module_name: item.name,
        description: item.desc,
        is_active: true,
      },
    });
    moduleMap[item.name] = mod;
  }

  // 2. Seed Users
  const adminHash = await bcrypt.hash('admin', 10);
  const ownerHash = await bcrypt.hash('owner', 10);
  const userHash = await bcrypt.hash('SecurePassword123!', 10);

  console.log('Seed: Seeding Users...');
  const adminUser = await prisma.user.upsert({
    where: { login_id: 'admin' },
    update: { password: adminHash, is_admin: true, status: 'APPROVED' },
    create: {
      login_id: 'admin',
      email: 'admin@erp-nexus.local',
      password: adminHash,
      is_admin: true,
      status: 'APPROVED',
      profile: {
        create: {
          full_name: 'System Administrator',
          position: 'Administrator',
          email_display: 'admin@erp-nexus.local',
        },
      },
    },
  });

  const ownerUser = await prisma.user.upsert({
    where: { login_id: 'owner' },
    update: { password: ownerHash, is_admin: true, status: 'APPROVED' },
    create: {
      login_id: 'owner',
      email: 'owner@erp-nexus.local',
      password: ownerHash,
      is_admin: true,
      status: 'APPROVED',
      profile: {
        create: {
          full_name: 'Business Owner',
          position: 'Owner',
          email_display: 'owner@erp-nexus.local',
        },
      },
    },
  });

  // Seed AKSHAY test users
  const testUsers = [
    { login: 'akshaypur', email: 'akshaypur@erp-nexus.local', name: 'Akshay Purchase', pos: 'Purchase Manager', role: 'purchase' },
    { login: 'akshaysal', email: 'akshaysal@erp-nexus.local', name: 'Akshay Sales', pos: 'Sales Representative', role: 'sales' },
    { login: 'akshayinv', email: 'akshayinv@erp-nexus.local', name: 'Akshay Inventory', pos: 'Inventory Specialist', role: 'inventory' },
    { login: 'akshaymfg', email: 'akshaymfg@erp-nexus.local', name: 'Akshay Manufacturing', pos: 'Production Supervisor', role: 'manufacturing' },
  ];

  for (const tu of testUsers) {
    const user = await prisma.user.upsert({
      where: { login_id: tu.login },
      update: { password: userHash, status: 'APPROVED' },
      create: {
        login_id: tu.login,
        email: tu.email,
        password: userHash,
        is_admin: false,
        status: 'APPROVED',
        profile: {
          create: {
            full_name: tu.name,
            position: tu.pos,
            email_display: tu.email,
          },
        },
      },
    });

    const m = moduleMap[tu.role];
    if (m) {
      await prisma.userModuleAccess.upsert({
        where: { user_id_module_id: { user_id: user.id, module_id: m.id } },
        update: {},
        create: {
          user_id: user.id,
          module_id: m.id,
          granted_by: adminUser.id,
        },
      });
    }
  }

  // 3. Seed Warehouses
  console.log('Seed: Seeding Warehouses...');
  const whs = [
    { code: 'WH-001', name: 'Main Fulfillment Center', location: 'Industrial Area Zone A, Mumbai', manager: 'Amit Sharma', capacity: 5000 },
    { code: 'WH-002', name: 'Raw Material Warehouse', location: 'Phase II Logistics Yard, Bangalore', manager: 'Kiran Kumar', capacity: 3000 },
    { code: 'WH-003', name: 'Surat Textile Depot', location: 'Textile Park, Surat', manager: 'Dinesh Patel', capacity: 1500 },
    { code: 'WH-004', name: 'Secondary Fastener Hub', location: 'Industrial Zone B, Ahmedabad', manager: 'Sanjay Shah', capacity: 1000 },
  ];

  const whMap = {};
  for (const w of whs) {
    const whRecord = await prisma.warehouse.upsert({
      where: { warehouse_code: w.code },
      update: {
        name: w.name,
        location: w.location,
        manager: w.manager,
        capacity: w.capacity,
      },
      create: {
        warehouse_code: w.code,
        name: w.name,
        location: w.location,
        manager: w.manager,
        capacity: w.capacity,
        status: 'Active',
      },
    });
    whMap[w.code] = whRecord;
  }

  // 4. Seed Vendors
  console.log('Seed: Seeding Vendors...');
  const timberland = await prisma.vendor.upsert({
    where: { email: 'sales@timberlandwoods.com' },
    update: {},
    create: {
      name: 'Timberland Woods Co.',
      email: 'sales@timberlandwoods.com',
      phone: '+91 98765 43210',
      address: '12 Forest Depot, Nagpur',
      is_active: true,
    },
  });

  const steelalloys = await prisma.vendor.upsert({
    where: { email: 'orders@steelalloys.com' },
    update: {},
    create: {
      name: 'Steel & Alloy Suppliers',
      email: 'orders@steelalloys.com',
      phone: '+91 98765 43211',
      address: 'Plot 45 Industrial Area, Pune',
      is_active: true,
    },
  });

  const foamfabrics = await prisma.vendor.upsert({
    where: { email: 'supply@foamfabrics.in' },
    update: {},
    create: {
      name: 'Foam & Fabric Industries',
      email: 'supply@foamfabrics.in',
      phone: '+91 98765 43212',
      address: '77 Textile Park, Ahmedabad',
      is_active: true,
    },
  });

  // 5. Seed Customers
  console.log('Seed: Seeding Customers...');
  const custSterling = await prisma.customer.upsert({
    where: { email: 'procure@sterlingoffices.com' },
    update: {},
    create: {
      customer_code: 'CUST-001',
      name: 'Sterling Office Furnishings',
      email: 'procure@sterlingoffices.com',
      phone: '+91 99887 76655',
      address: '101 Corporate tower, Bandra Complex, Mumbai',
      is_active: true,
    },
  });

  const custDeco = await prisma.customer.upsert({
    where: { email: 'design@decospace.in' },
    update: {},
    create: {
      customer_code: 'CUST-002',
      name: 'DecoSpace Designs',
      email: 'design@decospace.in',
      phone: '+91 91234 56789',
      address: '44 Residency Road, Bangalore',
      is_active: true,
    },
  });

  // 6. Seed Products
  console.log('Seed: Seeding Products...');
  const productsToSeed = [
    { sku: 'RM-OAK-01', name: 'Oak Wood Board', type: 'RAW_MATERIAL', cost: 1200, sales: 0, unit: 'pcs', wh: 'WH-002', onHand: 120, reserved: 80, reorder: 250, vendor: timberland.id },
    { sku: 'RM-FOM-02', name: 'Foam Padding Sheet', type: 'RAW_MATERIAL', cost: 350, sales: 0, unit: 'meters', wh: 'WH-002', onHand: 30, reserved: 30, reorder: 150, vendor: foamfabrics.id },
    { sku: 'RM-STL-44', name: 'Steel Framing Screws', type: 'CONSUMABLE', cost: 95, sales: 0, unit: 'boxes', wh: 'WH-004', onHand: 1500, reserved: 120, reorder: 5000, vendor: steelalloys.id },
    { sku: 'RM-LTH-09', name: 'Premium Leather Roll', type: 'RAW_MATERIAL', cost: 4500, sales: 0, unit: 'rolls', wh: 'WH-003', onHand: 18, reserved: 4, reorder: 10, vendor: foamfabrics.id },
    { sku: 'FG-SOF-09', name: 'Comfort Cushion Sofa', type: 'FINISHED_GOOD', cost: 22000, sales: 45000, unit: 'pcs', wh: 'WH-001', onHand: 12, reserved: 5, reorder: 20 },
    { sku: 'FG-CHR-21', name: 'Executive Swivel Chair', type: 'FINISHED_GOOD', cost: 5500, sales: 18500, unit: 'pcs', wh: 'WH-001', onHand: 45, reserved: 10, reorder: 50 },
    { sku: 'PK-BOX-02', name: 'Heavy Duty Shipping Box', type: 'CONSUMABLE', cost: 45, sales: 0, unit: 'pcs', wh: 'WH-001', onHand: 800, reserved: 0, reorder: 1000 },
    // Carry over seed.js references
    { sku: 'RM-STL-02', name: 'Steel Frame', type: 'RAW_MATERIAL', cost: 1200, sales: 0, unit: 'pcs', wh: 'WH-002', onHand: 30, reserved: 0, reorder: 15, vendor: steelalloys.id },
    { sku: 'RM-FOM-03', name: 'Cushion Foam', type: 'RAW_MATERIAL', cost: 800, sales: 0, unit: 'pcs', wh: 'WH-002', onHand: 40, reserved: 0, reorder: 10, vendor: foamfabrics.id },
    { sku: 'RM-FAB-04', name: 'Fabric Cover', type: 'RAW_MATERIAL', cost: 500, sales: 0, unit: 'pcs', wh: 'WH-002', onHand: 25, reserved: 0, reorder: 10, vendor: foamfabrics.id },
    { sku: 'FG-TAB-12', name: 'Artisan Oak Dining Table', type: 'FINISHED_GOOD', cost: 18000, sales: 42000, unit: 'pcs', wh: 'WH-001', onHand: 0, reserved: 0, reorder: 0 },
  ];

  const productRecords = {};
  for (const p of productsToSeed) {
    const whRecord = whMap[p.wh];
    const prod = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        type: p.type,
        cost_price: p.cost,
        sales_price: p.sales,
        unit: p.unit,
        warehouse_id: whRecord ? whRecord.id : null,
        vendor_id: p.vendor || null,
      },
      create: {
        sku: p.sku,
        name: p.name,
        type: p.type,
        cost_price: p.cost,
        sales_price: p.sales,
        unit: p.unit,
        warehouse_id: whRecord ? whRecord.id : null,
        vendor_id: p.vendor || null,
      },
    });

    productRecords[p.sku] = prod;

    if (whRecord) {
      await prisma.inventory.upsert({
        where: { product_id_warehouse_id: { product_id: prod.id, warehouse_id: whRecord.id } },
        update: {
          on_hand_qty: p.onHand,
          reserved_qty: p.reserved,
          reorder_level: p.reorder,
        },
        create: {
          product_id: prod.id,
          warehouse_id: whRecord.id,
          on_hand_qty: p.onHand,
          reserved_qty: p.reserved,
          reorder_level: p.reorder,
        },
      });
    }
  }

  // 7. Seed BOMs
  console.log('Seed: Seeding BOMs...');
  const diningTable = productRecords['FG-TAB-12'];
  const officeChair = productRecords['FG-CHR-21'];
  const oakWood = productRecords['RM-OAK-01'];
  const steelFrame = productRecords['RM-STL-02'];
  const cushionFoam = productRecords['RM-FOM-03'];
  const fabricCover = productRecords['RM-FAB-04'];

  const tableBom = await prisma.billOfMaterials.create({
    data: {
      product_id: diningTable.id,
      lines: {
        create: [
          { component_product_id: oakWood.id, qty_per_unit: 4, operation: 'Timber Cutting', expected_duration_mins: 30 },
          { component_product_id: steelFrame.id, qty_per_unit: 1, operation: 'Frame Assembly', expected_duration_mins: 45 },
        ],
      },
    },
  });

  const chairBom = await prisma.billOfMaterials.create({
    data: {
      product_id: officeChair.id,
      lines: {
        create: [
          { component_product_id: steelFrame.id, qty_per_unit: 1, operation: 'Base Structure Welding', expected_duration_mins: 20 },
          { component_product_id: cushionFoam.id, qty_per_unit: 2, operation: 'Cushioning & Padding', expected_duration_mins: 15 },
          { component_product_id: fabricCover.id, qty_per_unit: 1.5, operation: 'Upholstery Fitting', expected_duration_mins: 25 },
        ],
      },
    },
  });

  // 8. Seed Stock Ledger default entries
  console.log('Seed: Seeding Stock Ledger entries...');
  const ledgersToSeed = [
    { sku: 'RM-OAK-01', wh: 'WH-002', type: 'INITIAL_STOCK', direction: 'IN', qty: 120, before: 0, after: 120, remarks: 'Opening stock balances.' },
    { sku: 'RM-FOM-02', wh: 'WH-002', type: 'INITIAL_STOCK', direction: 'IN', qty: 30, before: 0, after: 30, remarks: 'Opening stock balances.' },
    { sku: 'RM-STL-44', wh: 'WH-004', type: 'INITIAL_STOCK', direction: 'IN', qty: 1500, before: 0, after: 1500, remarks: 'Opening stock balances.' },
    { sku: 'RM-LTH-09', wh: 'WH-003', type: 'INITIAL_STOCK', direction: 'IN', qty: 18, before: 0, after: 18, remarks: 'Opening stock balances.' },
    { sku: 'FG-SOF-09', wh: 'WH-001', type: 'INITIAL_STOCK', direction: 'IN', qty: 12, before: 0, after: 12, remarks: 'Opening stock balances.' },
    { sku: 'FG-CHR-21', wh: 'WH-001', type: 'INITIAL_STOCK', direction: 'IN', qty: 45, before: 0, after: 45, remarks: 'Opening stock balances.' },
  ];

  for (const l of ledgersToSeed) {
    const prod = productRecords[l.sku];
    const whRecord = whMap[l.wh];
    if (prod && whRecord) {
      await prisma.stockLedger.create({
        data: {
          product_id: prod.id,
          warehouse_id: whRecord.id,
          movement_type: l.type,
          direction: l.direction,
          quantity: l.qty,
          stock_before: l.before,
          stock_after: l.after,
          remarks: l.remarks,
          created_by: adminUser.id,
        },
      });
    }
  }

  // 9. Seed some Transfers and Adjustments for history logs
  console.log('Seed: Seeding Stock Transfers and Adjustments...');
  const transfer = await prisma.stockTransfer.create({
    data: {
      transfer_number: 'TRF-001',
      source_warehouse_id: whMap['WH-002'].id,
      destination_warehouse_id: whMap['WH-001'].id,
      product_id: oakWood.id,
      qty: 50,
      status: 'Completed',
      reason: 'Replenishment for Assembly Line',
      created_by: adminUser.id,
      date: new Date('2026-06-10'),
    },
  });

  await prisma.stockTransfer.create({
    data: {
      transfer_number: 'TRF-002',
      source_warehouse_id: whMap['WH-003'].id,
      destination_warehouse_id: whMap['WH-001'].id,
      product_id: productRecords['RM-LTH-09'].id,
      qty: 2,
      status: 'Pending',
      reason: 'Leather stock transfer for Sofa manufacturing',
      created_by: adminUser.id,
      date: new Date('2026-06-13'),
    },
  });

  const adjustment = await prisma.stockAdjustment.create({
    data: {
      adjustment_number: 'ADJ-001',
      product_id: oakWood.id,
      warehouse_id: whMap['WH-002'].id,
      old_qty: 125,
      new_qty: 120,
      reason: 'Damage',
      created_by: adminUser.id,
      created_at: new Date('2026-06-12'),
    },
  });

  console.log('Seed Clean: Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
