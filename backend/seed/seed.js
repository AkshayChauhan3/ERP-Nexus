const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Seed: Starting database seeding...');

  // 1. Seed Modules
  const modulesToSeed = [
    { name: 'sales', desc: 'Sales Order management and Customer relations' },
    { name: 'purchase', desc: 'Purchase Order management, Vendors and Goods Receipts' },
    { name: 'manufacturing', desc: 'Bill of Materials, Operations and Manufacturing Orders' },
    { name: 'inventory', desc: 'Stock Ledger, Warehousing and Stock status tracking' },
  ];

  console.log('Seed: Initializing ERP Modules...');
  for (const item of modulesToSeed) {
    await prisma.module.upsert({
      where: { module_name: item.name },
      update: { description: item.desc },
      create: {
        module_name: item.name,
        description: item.desc,
        is_active: true,
      },
    });
  }
  console.log(`Seed: Mapped ${modulesToSeed.length} modules.`);

  // 2. Seed Admin & Owner
  const adminPasswordHash = await bcrypt.hash('admin', 10);
  const ownerPasswordHash = await bcrypt.hash('owner', 10);
  
  console.log('Seed: Seeding Admin User...');
  const adminUser = await prisma.user.upsert({
    where: { login_id: 'admin' },
    update: {
      password: adminPasswordHash,
      is_admin: true,
      status: 'APPROVED',
    },
    create: {
      login_id: 'admin',
      email: 'admin@erp-nexus.local',
      password: adminPasswordHash,
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

  console.log('Seed: Seeding Owner User...');
  const ownerUser = await prisma.user.upsert({
    where: { login_id: 'owner' },
    update: {
      password: ownerPasswordHash,
      is_admin: true,
      status: 'APPROVED',
    },
    create: {
      login_id: 'owner',
      email: 'owner@erp-nexus.local',
      password: ownerPasswordHash,
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

  // 3. Seed Vendors
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

  // 4. Seed Customers
  console.log('Seed: Seeding Customers...');
  await prisma.customer.upsert({
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

  await prisma.customer.upsert({
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

  // 5. Seed Products
  console.log('Seed: Seeding Raw Materials...');
  const oakWood = await prisma.product.upsert({
    where: { sku: 'RM-OAK-01' },
    update: {},
    create: {
      name: 'Oak Wood Board',
      sku: 'RM-OAK-01',
      type: 'RAW_MATERIAL',
      sales_price: 0,
      cost_price: 2500,
      procurement_type: 'MTS',
      procurement_method: 'PURCHASE',
      procure_on_demand: true,
      vendor_id: timberland.id,
      inventory: {
        create: {
          on_hand_qty: 50,
          reserved_qty: 0,
          reorder_level: 20,
        },
      },
    },
  });

  const steelFrame = await prisma.product.upsert({
    where: { sku: 'RM-STL-02' },
    update: {},
    create: {
      name: 'Steel Frame',
      sku: 'RM-STL-02',
      type: 'RAW_MATERIAL',
      sales_price: 0,
      cost_price: 1200,
      procurement_type: 'MTS',
      procurement_method: 'PURCHASE',
      procure_on_demand: true,
      vendor_id: steelalloys.id,
      inventory: {
        create: {
          on_hand_qty: 30,
          reserved_qty: 0,
          reorder_level: 15,
        },
      },
    },
  });

  const cushionFoam = await prisma.product.upsert({
    where: { sku: 'RM-FOM-03' },
    update: {},
    create: {
      name: 'Cushion Foam',
      sku: 'RM-FOM-03',
      type: 'RAW_MATERIAL',
      sales_price: 0,
      cost_price: 800,
      procurement_type: 'MTS',
      procurement_method: 'PURCHASE',
      procure_on_demand: true,
      vendor_id: foamfabrics.id,
      inventory: {
        create: {
          on_hand_qty: 40,
          reserved_qty: 0,
          reorder_level: 10,
        },
      },
    },
  });

  const fabricCover = await prisma.product.upsert({
    where: { sku: 'RM-FAB-04' },
    update: {},
    create: {
      name: 'Fabric Cover',
      sku: 'RM-FAB-04',
      type: 'RAW_MATERIAL',
      sales_price: 0,
      cost_price: 500,
      procurement_type: 'MTS',
      procurement_method: 'PURCHASE',
      procure_on_demand: true,
      vendor_id: foamfabrics.id,
      inventory: {
        create: {
          on_hand_qty: 25,
          reserved_qty: 0,
          reorder_level: 10,
        },
      },
    },
  });

  console.log('Seed: Seeding Finished Goods...');
  const diningTable = await prisma.product.upsert({
    where: { sku: 'FG-TAB-12' },
    update: {},
    create: {
      name: 'Artisan Oak Dining Table',
      sku: 'FG-TAB-12',
      type: 'FINISHED_GOOD',
      sales_price: 42000,
      cost_price: 18000,
      procurement_type: 'MTO',
      procurement_method: 'MANUFACTURING',
      procure_on_demand: true,
      inventory: {
        create: {
          on_hand_qty: 0,
          reserved_qty: 0,
          reorder_level: 0,
        },
      },
    },
  });

  const officeChair = await prisma.product.upsert({
    where: { sku: 'FG-CHR-21' },
    update: {},
    create: {
      name: 'Ergonomic Office Chair',
      sku: 'FG-CHR-21',
      type: 'FINISHED_GOOD',
      sales_price: 18500,
      cost_price: 8500,
      procurement_type: 'MTS',
      procurement_method: 'MANUFACTURING',
      procure_on_demand: true,
      inventory: {
        create: {
          on_hand_qty: 2,
          reserved_qty: 0,
          reorder_level: 5,
        },
      },
    },
  });

  // 6. Seed Bills of Materials (BOM)
  console.log('Seed: Seeding BOMs...');
  
  // Oak Dining Table BOM
  const tableBomExists = await prisma.billOfMaterials.findUnique({
    where: { product_id: diningTable.id },
  });
  if (!tableBomExists) {
    const tableBom = await prisma.billOfMaterials.create({
      data: {
        product_id: diningTable.id,
        lines: {
          create: [
            {
              component_product_id: oakWood.id,
              qty_per_unit: 4.0,
              operation: 'Assembly',
              expected_duration_mins: 60,
              work_center: 'Assembly Line',
            },
          ],
        },
      },
    });

    // Update table with bom_id
    await prisma.product.update({
      where: { id: diningTable.id },
      data: { bom_id: tableBom.id },
    });
  }

  // Office Chair BOM
  const chairBomExists = await prisma.billOfMaterials.findUnique({
    where: { product_id: officeChair.id },
  });
  if (!chairBomExists) {
    const chairBom = await prisma.billOfMaterials.create({
      data: {
        product_id: officeChair.id,
        lines: {
          create: [
            {
              component_product_id: steelFrame.id,
              qty_per_unit: 1.0,
              operation: 'Assembly',
              expected_duration_mins: 30,
              work_center: 'Assembly Line',
            },
            {
              component_product_id: cushionFoam.id,
              qty_per_unit: 1.0,
              operation: 'Padding',
              expected_duration_mins: 15,
              work_center: 'Paint Floor',
            },
            {
              component_product_id: fabricCover.id,
              qty_per_unit: 1.0,
              operation: 'Upholstery',
              expected_duration_mins: 20,
              work_center: 'Paint Floor',
            },
          ],
        },
      },
    });

    // Update chair with bom_id
    await prisma.product.update({
      where: { id: officeChair.id },
      data: { bom_id: chairBom.id },
    });
  }

  console.log('Seed: Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
