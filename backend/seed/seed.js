const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Seed: Starting comprehensive database seeding...');

  console.log('Seed: Clearing existing database records...');
  await prisma.auditLog.deleteMany({});
  await prisma.riskAlert.deleteMany({});
  await prisma.procurementSuggestion.deleteMany({});
  await prisma.stockReservation.deleteMany({});
  await prisma.stockAdjustment.deleteMany({});
  await prisma.stockTransfer.deleteMany({});
  await prisma.stockLedger.deleteMany({});
  await prisma.inventory.deleteMany({});
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
  await prisma.refreshToken.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.warehouse.deleteMany({});
  await prisma.module.deleteMany({});

  // 1. Seed Modules
  console.log('Seed: Initializing ERP Modules...');
  const modulesToSeed = [
    { name: 'sales', desc: 'Sales Order management and Customer relations' },
    { name: 'purchase', desc: 'Purchase Order management, Vendors and Goods Receipts' },
    { name: 'manufacturing', desc: 'Bill of Materials, Operations and Manufacturing Orders' },
    { name: 'inventory', desc: 'Stock Ledger, Warehousing and Stock status tracking' },
  ];
  const moduleMap = {};
  for (const item of modulesToSeed) {
    const mod = await prisma.module.create({
      data: {
        module_name: item.name,
        description: item.desc,
        is_active: true,
      },
    });
    moduleMap[item.name] = mod;
  }
  console.log(`Seed: Mapped ${Object.keys(moduleMap).length} modules.`);

  // 2. Seed Users & Profiles
  console.log('Seed: Seeding Users...');
  const adminHash = await bcrypt.hash('admin', 10);
  const ownerHash = await bcrypt.hash('owner', 10);
  const userHash = await bcrypt.hash('SecurePassword123!', 10);

  const adminUser = await prisma.user.create({
    data: {
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

  const ownerUser = await prisma.user.create({
    data: {
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

  const testUsers = [
    { login: 'akshaypur', email: 'akshaypur@erp-nexus.local', name: 'Akshay Purchase', pos: 'Purchase Manager', role: 'purchase' },
    { login: 'akshaysal', email: 'akshaysal@erp-nexus.local', name: 'Akshay Sales', pos: 'Sales Representative', role: 'sales' },
    { login: 'akshayinv', email: 'akshayinv@erp-nexus.local', name: 'Akshay Inventory', pos: 'Inventory Specialist', role: 'inventory' },
    { login: 'akshaymfg', email: 'akshaymfg@erp-nexus.local', name: 'Akshay Manufacturing', pos: 'Production Supervisor', role: 'manufacturing' },
  ];

  const userMap = { admin: adminUser, owner: ownerUser };
  for (const tu of testUsers) {
    const user = await prisma.user.create({
      data: {
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
    userMap[tu.login] = user;

    const m = moduleMap[tu.role];
    if (m) {
      await prisma.userModuleAccess.create({
        data: {
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
    const whRecord = await prisma.warehouse.create({
      data: {
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
  const vendors = [
    { name: 'Timberland Woods Co.', email: 'sales@timberlandwoods.com', phone: '+91 98765 43210', address: '12 Forest Depot, Nagpur' },
    { name: 'Steel & Alloy Suppliers', email: 'orders@steelalloys.com', phone: '+91 98765 43211', address: 'Plot 45 Industrial Area, Pune' },
    { name: 'Foam & Fabric Industries', email: 'supply@foamfabrics.in', phone: '+91 98765 43212', address: '77 Textile Park, Ahmedabad' },
  ];
  const vendorMap = {};
  for (const v of vendors) {
    const vRec = await prisma.vendor.create({
      data: { ...v, is_active: true },
    });
    vendorMap[v.name] = vRec;
  }

  // 5. Seed Customers
  console.log('Seed: Seeding Customers...');
  const customers = [
    { code: 'CUST-001', name: 'Sterling Office Furnishings', email: 'procure@sterlingoffices.com', phone: '+91 99887 76655', address: '101 Corporate tower, Bandra Complex, Mumbai' },
    { code: 'CUST-002', name: 'DecoSpace Designs', email: 'design@decospace.in', phone: '+91 91234 56789', address: '44 Residency Road, Bangalore' },
    { code: 'CUST-003', name: 'Horizon Hotels & Resorts', email: 'procurement@horizonhotels.com', phone: '+91 98765 12345', address: '22 Marine Drive, Mumbai' },
  ];
  const customerMap = {};
  for (const c of customers) {
    const cRec = await prisma.customer.create({
      data: {
        customer_code: c.code,
        name: c.name,
        email: c.email,
        phone: c.phone,
        address: c.address,
        is_active: true,
      },
    });
    customerMap[c.code] = cRec;
  }

  // 6. Seed Products
  console.log('Seed: Seeding Products...');
  const productsToSeed = [
    { sku: 'RM-OAK-01', name: 'Oak Wood Board', type: 'RAW_MATERIAL', cost: 1200, sales: 0, unit: 'pcs', wh: 'WH-002', onHand: 120, reserved: 20, reorder: 250, vendor: 'Timberland Woods Co.', method: 'PURCHASE', ptype: 'MTS' },
    { sku: 'RM-STL-02', name: 'Steel Frame', type: 'RAW_MATERIAL', cost: 1200, sales: 0, unit: 'pcs', wh: 'WH-002', onHand: 80, reserved: 10, reorder: 15, vendor: 'Steel & Alloy Suppliers', method: 'PURCHASE', ptype: 'MTS' },
    { sku: 'RM-FOM-03', name: 'Cushion Foam', type: 'RAW_MATERIAL', cost: 800, sales: 0, unit: 'pcs', wh: 'WH-002', onHand: 90, reserved: 15, reorder: 10, vendor: 'Foam & Fabric Industries', method: 'PURCHASE', ptype: 'MTS' },
    { sku: 'RM-FAB-04', name: 'Fabric Cover', type: 'RAW_MATERIAL', cost: 500, sales: 0, unit: 'pcs', wh: 'WH-002', onHand: 70, reserved: 5, reorder: 10, vendor: 'Foam & Fabric Industries', method: 'PURCHASE', ptype: 'MTS' },
    { sku: 'RM-LTH-09', name: 'Premium Leather Roll', type: 'RAW_MATERIAL', cost: 4500, sales: 0, unit: 'rolls', wh: 'WH-003', onHand: 18, reserved: 4, reorder: 10, vendor: 'Foam & Fabric Industries', method: 'PURCHASE', ptype: 'MTS' },
    { sku: 'RM-STL-44', name: 'Steel Framing Screws', type: 'CONSUMABLE', cost: 95, sales: 0, unit: 'boxes', wh: 'WH-004', onHand: 1500, reserved: 120, reorder: 5000, vendor: 'Steel & Alloy Suppliers', method: 'PURCHASE', ptype: 'MTS' },
    { sku: 'PK-BOX-02', name: 'Heavy Duty Shipping Box', type: 'CONSUMABLE', cost: 45, sales: 0, unit: 'pcs', wh: 'WH-001', onHand: 800, reserved: 0, reorder: 1000, method: 'PURCHASE', ptype: 'MTS' },
    { sku: 'FG-TAB-12', name: 'Artisan Oak Dining Table', type: 'FINISHED_GOOD', cost: 18000, sales: 42000, unit: 'pcs', wh: 'WH-001', onHand: 5, reserved: 2, reorder: 0, method: 'MANUFACTURING', ptype: 'MTO' },
    { sku: 'FG-CHR-21', name: 'Executive Swivel Chair', type: 'FINISHED_GOOD', cost: 5500, sales: 18500, unit: 'pcs', wh: 'WH-001', onHand: 45, reserved: 18, reorder: 50, method: 'MANUFACTURING', ptype: 'MTS' },
    { sku: 'FG-SOF-09', name: 'Comfort Cushion Sofa', type: 'FINISHED_GOOD', cost: 22000, sales: 45000, unit: 'pcs', wh: 'WH-001', onHand: 12, reserved: 5, reorder: 20, method: 'MANUFACTURING', ptype: 'MTS' },
  ];

  const productRecords = {};
  for (const p of productsToSeed) {
    const whRecord = whMap[p.wh];
    const vendorRecord = p.vendor ? vendorMap[p.vendor] : null;

    const prod = await prisma.product.create({
      data: {
        sku: p.sku,
        name: p.name,
        type: p.type,
        cost_price: p.cost,
        sales_price: p.sales,
        unit: p.unit,
        procurement_method: p.method,
        procurement_type: p.ptype,
        procure_on_demand: p.ptype === 'MTO',
        warehouse_id: whRecord ? whRecord.id : null,
        vendor_id: vendorRecord ? vendorRecord.id : null,
      },
    });

    productRecords[p.sku] = prod;

    if (whRecord) {
      await prisma.inventory.create({
        data: {
          product_id: prod.id,
          warehouse_id: whRecord.id,
          on_hand_qty: p.onHand,
          reserved_qty: p.reserved,
          reorder_level: p.reorder,
        },
      });
    }
  }

  // 7. Seed BOMs (Bill of Materials)
  console.log('Seed: Seeding BOMs...');
  const diningTable = productRecords['FG-TAB-12'];
  const officeChair = productRecords['FG-CHR-21'];
  const sofa = productRecords['FG-SOF-09'];
  const oakWood = productRecords['RM-OAK-01'];
  const steelFrame = productRecords['RM-STL-02'];
  const cushionFoam = productRecords['RM-FOM-03'];
  const fabricCover = productRecords['RM-FAB-04'];
  const leatherRoll = productRecords['RM-LTH-09'];

  const tableBom = await prisma.billOfMaterials.create({
    data: {
      product_id: diningTable.id,
      lines: {
        create: [
          { component_product_id: oakWood.id, qty_per_unit: 4, operation: 'Timber Cutting', expected_duration_mins: 30, work_center: 'Wood Shop' },
          { component_product_id: steelFrame.id, qty_per_unit: 1, operation: 'Frame Assembly', expected_duration_mins: 45, work_center: 'Metal Shop' },
        ],
      },
    },
  });

  const chairBom = await prisma.billOfMaterials.create({
    data: {
      product_id: officeChair.id,
      lines: {
        create: [
          { component_product_id: steelFrame.id, qty_per_unit: 1, operation: 'Base Structure Welding', expected_duration_mins: 20, work_center: 'Metal Shop' },
          { component_product_id: cushionFoam.id, qty_per_unit: 1, operation: 'Cushioning & Padding', expected_duration_mins: 15, work_center: 'Assembly Line' },
          { component_product_id: fabricCover.id, qty_per_unit: 1, operation: 'Upholstery Fitting', expected_duration_mins: 25, work_center: 'Assembly Line' },
        ],
      },
    },
  });

  const sofaBom = await prisma.billOfMaterials.create({
    data: {
      product_id: sofa.id,
      lines: {
        create: [
          { component_product_id: oakWood.id, qty_per_unit: 2, operation: 'Base Framing', expected_duration_mins: 40, work_center: 'Wood Shop' },
          { component_product_id: cushionFoam.id, qty_per_unit: 4, operation: 'Cushion Stuffing', expected_duration_mins: 30, work_center: 'Assembly Line' },
          { component_product_id: leatherRoll.id, qty_per_unit: 2, operation: 'Leather Wrapping', expected_duration_mins: 60, work_center: 'Assembly Line' },
        ],
      },
    },
  });

  // Update products default bom_id
  await prisma.product.update({ where: { id: diningTable.id }, data: { bom_id: tableBom.id } });
  await prisma.product.update({ where: { id: officeChair.id }, data: { bom_id: chairBom.id } });
  await prisma.product.update({ where: { id: sofa.id }, data: { bom_id: sofaBom.id } });

  // 8. Seed Sales Quotations
  console.log('Seed: Seeding Sales Quotations...');
  const qtn1 = await prisma.salesQuotation.create({
    data: {
      quotation_number: 'QTN-2026-001',
      customer_id: customerMap['CUST-001'].id,
      date: new Date('2026-06-01'),
      expiry_date: new Date('2026-06-30'),
      amount: 185000,
      status: 'Approved',
      remarks: 'Bulk commercial discount of 10% included.',
      lines: {
        create: [
          { product_id: officeChair.id, qty: 10, price: 18500, discount: 10, tax: 18, total: 196560 }
        ]
      }
    }
  });

  const qtn2 = await prisma.salesQuotation.create({
    data: {
      quotation_number: 'QTN-2026-002',
      customer_id: customerMap['CUST-002'].id,
      date: new Date('2026-06-05'),
      expiry_date: new Date('2026-06-25'),
      amount: 42000,
      status: 'Draft',
      remarks: 'Awaiting architectural specification confirmation.',
      lines: {
        create: [
          { product_id: diningTable.id, qty: 1, price: 42000, discount: 0, tax: 18, total: 49560 }
        ]
      }
    }
  });

  const qtn3 = await prisma.salesQuotation.create({
    data: {
      quotation_number: 'QTN-2026-003',
      customer_id: customerMap['CUST-003'].id,
      date: new Date('2026-06-08'),
      expiry_date: new Date('2026-07-08'),
      amount: 168000,
      status: 'Sent',
      remarks: 'Proposed furniture for lobby refresh.',
      lines: {
        create: [
          { product_id: diningTable.id, qty: 4, price: 42000, discount: 5, tax: 18, total: 188350 }
        ]
      }
    }
  });

  // 9. Seed Sales Orders & Lines
  console.log('Seed: Seeding Sales Orders...');
  const so1 = await prisma.salesOrder.create({
    data: {
      order_number: 'SO-2026-001',
      customer_id: customerMap['CUST-001'].id,
      order_date: new Date('2026-06-02'),
      expected_delivery_date: new Date('2026-06-18'),
      status: 'confirmed',
      remarks: 'Deliver to 4th floor offices.',
      customer_address: customerMap['CUST-001'].address,
      created_by: userMap['admin'].id,
      salesperson_id: userMap['akshaysal'].id,
      lines: {
        create: [
          { product_id: officeChair.id, ordered_qty: 10, unit_price: 18500 }
        ]
      }
    }
  });

  const so2 = await prisma.salesOrder.create({
    data: {
      order_number: 'SO-2026-002',
      customer_id: customerMap['CUST-002'].id,
      order_date: new Date('2026-06-05'),
      expected_delivery_date: new Date('2026-06-15'),
      status: 'delivered',
      remarks: 'Client requested quick delivery.',
      customer_address: customerMap['CUST-002'].address,
      created_by: userMap['admin'].id,
      salesperson_id: userMap['akshaysal'].id,
      lines: {
        create: [
          { product_id: officeChair.id, ordered_qty: 5, unit_price: 18500, delivered_qty: 5 }
        ]
      }
    }
  });

  const so3 = await prisma.salesOrder.create({
    data: {
      order_number: 'SO-2026-003',
      customer_id: customerMap['CUST-003'].id,
      order_date: new Date('2026-06-08'),
      expected_delivery_date: new Date('2026-06-25'),
      status: 'dispatched',
      remarks: 'Deliver via cargo team.',
      customer_address: customerMap['CUST-003'].address,
      created_by: userMap['admin'].id,
      salesperson_id: userMap['akshaysal'].id,
      lines: {
        create: [
          { product_id: officeChair.id, ordered_qty: 8, unit_price: 18500, delivered_qty: 0 }
        ]
      }
    }
  });

  const so4 = await prisma.salesOrder.create({
    data: {
      order_number: 'SO-2026-004',
      customer_id: customerMap['CUST-001'].id,
      order_date: new Date('2026-06-10'),
      expected_delivery_date: new Date('2026-07-05'),
      status: 'draft',
      remarks: 'Draft order for office expansion.',
      customer_address: customerMap['CUST-001'].address,
      created_by: userMap['admin'].id,
      salesperson_id: userMap['akshaysal'].id,
      lines: {
        create: [
          { product_id: officeChair.id, ordered_qty: 5, unit_price: 17500 },
          { product_id: diningTable.id, ordered_qty: 2, unit_price: 40000 }
        ]
      }
    }
  });

  const so5 = await prisma.salesOrder.create({
    data: {
      order_number: 'SO-2026-005',
      customer_id: customerMap['CUST-002'].id,
      order_date: new Date('2026-06-12'),
      expected_delivery_date: new Date('2026-06-29'),
      status: 'in_production',
      remarks: 'MTO manufacturing triggered.',
      customer_address: customerMap['CUST-002'].address,
      created_by: userMap['admin'].id,
      salesperson_id: userMap['akshaysal'].id,
      lines: {
        create: [
          { product_id: diningTable.id, ordered_qty: 1, unit_price: 42000 }
        ]
      }
    }
  });

  // 10. Seed Sales Deliveries & lines
  console.log('Seed: Seeding Sales Deliveries...');
  const dlv1 = await prisma.salesDelivery.create({
    data: {
      delivery_number: 'DLV-001',
      so_id: so1.id,
      customer_id: customerMap['CUST-001'].id,
      delivery_date: new Date('2026-06-18'),
      status: 'Pending',
      shipping_address: customerMap['CUST-001'].address,
      lines: {
        create: [
          { product_id: officeChair.id, qty: 10 }
        ]
      }
    }
  });

  const dlv2 = await prisma.salesDelivery.create({
    data: {
      delivery_number: 'DLV-002',
      so_id: so2.id,
      customer_id: customerMap['CUST-002'].id,
      delivery_date: new Date('2026-06-14'),
      status: 'Delivered',
      shipping_address: customerMap['CUST-002'].address,
      dispatch_date: new Date('2026-06-13'),
      lines: {
        create: [
          { product_id: officeChair.id, qty: 5 }
        ]
      }
    }
  });

  const dlv3 = await prisma.salesDelivery.create({
    data: {
      delivery_number: 'DLV-003',
      so_id: so3.id,
      customer_id: customerMap['CUST-003'].id,
      delivery_date: new Date('2026-06-25'),
      status: 'Dispatched',
      shipping_address: customerMap['CUST-003'].address,
      dispatch_date: new Date('2026-06-14'),
      lines: {
        create: [
          { product_id: officeChair.id, qty: 8 }
        ]
      }
    }
  });

  // 11. Seed Purchase Orders & lines
  console.log('Seed: Seeding Purchase Orders...');
  const po1 = await prisma.purchaseOrder.create({
    data: {
      po_number: 'PO-2026-001',
      vendor_id: vendorMap['Timberland Woods Co.'].id,
      status: 'draft',
      remarks: 'Replenish timber stock.',
      created_by: userMap['admin'].id,
      responsible_person_id: userMap['akshaypur'].id,
      vendor_address: vendorMap['Timberland Woods Co.'].address,
      lines: {
        create: [
          { product_id: oakWood.id, ordered_qty: 100, unit_price: 1200 }
        ]
      }
    }
  });

  const po2 = await prisma.purchaseOrder.create({
    data: {
      po_number: 'PO-2026-002',
      vendor_id: vendorMap['Steel & Alloy Suppliers'].id,
      status: 'confirmed',
      remarks: 'Urgent framing structures.',
      created_by: userMap['admin'].id,
      responsible_person_id: userMap['akshaypur'].id,
      vendor_address: vendorMap['Steel & Alloy Suppliers'].address,
      lines: {
        create: [
          { product_id: steelFrame.id, ordered_qty: 50, unit_price: 1200 }
        ]
      }
    }
  });

  const po3 = await prisma.purchaseOrder.create({
    data: {
      po_number: 'PO-2026-003',
      vendor_id: vendorMap['Foam & Fabric Industries'].id,
      status: 'received',
      remarks: 'Padding and upholstery supplies.',
      created_by: userMap['admin'].id,
      responsible_person_id: userMap['akshaypur'].id,
      vendor_address: vendorMap['Foam & Fabric Industries'].address,
      lines: {
        create: [
          { product_id: cushionFoam.id, ordered_qty: 30, unit_price: 800, received_qty: 30 },
          { product_id: fabricCover.id, ordered_qty: 30, unit_price: 500, received_qty: 30 }
        ]
      }
    }
  });

  const po4 = await prisma.purchaseOrder.create({
    data: {
      po_number: 'PO-2026-004',
      vendor_id: vendorMap['Foam & Fabric Industries'].id,
      status: 'partially_received',
      remarks: 'Bulk leather order.',
      created_by: userMap['admin'].id,
      responsible_person_id: userMap['akshaypur'].id,
      vendor_address: vendorMap['Foam & Fabric Industries'].address,
      lines: {
        create: [
          { product_id: leatherRoll.id, ordered_qty: 10, unit_price: 4500, received_qty: 5 }
        ]
      }
    }
  });

  // 12. Seed Goods Receipts
  console.log('Seed: Seeding Goods Receipts...');
  const gr1 = await prisma.goodsReceipt.create({
    data: {
      receipt_number: 'GR-2026-001',
      po_id: po3.id,
      delivery_note_ref: 'DN-9932-FOAM',
      received_by: userMap['akshayinv'].id,
      received_at: new Date('2026-06-10'),
      lines: {
        create: [
          { product_id: cushionFoam.id, po_line_id: (await prisma.purchaseOrderLine.findFirst({ where: { po_id: po3.id, product_id: cushionFoam.id } })).id, qty_received: 30, remarks: 'Delivered in perfect condition.' },
          { product_id: fabricCover.id, po_line_id: (await prisma.purchaseOrderLine.findFirst({ where: { po_id: po3.id, product_id: fabricCover.id } })).id, qty_received: 30, remarks: 'Verified package count matches.' }
        ]
      }
    }
  });

  const gr2 = await prisma.goodsReceipt.create({
    data: {
      receipt_number: 'GR-2026-002',
      po_id: po4.id,
      delivery_note_ref: 'DN-8491-LTHR',
      received_by: userMap['akshayinv'].id,
      received_at: new Date('2026-06-12'),
      lines: {
        create: [
          { product_id: leatherRoll.id, po_line_id: (await prisma.purchaseOrderLine.findFirst({ where: { po_id: po4.id, product_id: leatherRoll.id } })).id, qty_received: 5, remarks: 'Remaining 5 rolls backordered.' }
        ]
      }
    }
  });

  // 13. Seed Vendor Bills
  console.log('Seed: Seeding Vendor Bills...');
  const bill1 = await prisma.vendorBill.create({
    data: {
      bill_number: 'BILL-2026-001',
      po_id: po3.id,
      vendor_id: vendorMap['Foam & Fabric Industries'].id,
      invoice_date: new Date('2026-06-10'),
      due_date: new Date('2026-07-10'),
      subtotal: 39000,
      tax: 7020,
      total_amount: 46020,
      status: 'pending_payment',
    }
  });

  const bill2 = await prisma.vendorBill.create({
    data: {
      bill_number: 'BILL-2026-002',
      po_id: po2.id,
      vendor_id: vendorMap['Steel & Alloy Suppliers'].id,
      invoice_date: new Date('2026-06-05'),
      due_date: new Date('2026-07-05'),
      subtotal: 60000,
      tax: 10800,
      total_amount: 70800,
      status: 'paid',
      payment_reference: 'TXN-94829104',
      paid_at: new Date('2026-06-08'),
      paid_by: userMap['owner'].id,
    }
  });

  // 14. Seed Manufacturing Orders
  console.log('Seed: Seeding Manufacturing Orders...');
  const mo1 = await prisma.manufacturingOrder.create({
    data: {
      mo_number: 'MO-2026-001',
      product_id: officeChair.id,
      bom_id: chairBom.id,
      quantity: 5,
      produced_qty: 5,
      status: 'completed',
      created_by: userMap['akshaymfg'].id,
      created_at: new Date('2026-06-04'),
      work_orders: {
        create: [
          { operation: 'Base Structure Welding', work_center: 'Metal Shop', duration_mins: 100, real_duration_mins: 110, status: 'completed', started_at: new Date('2026-06-04T09:00:00Z'), completed_at: new Date('2026-06-04T10:50:00Z') },
          { operation: 'Cushioning & Padding', work_center: 'Assembly Line', duration_mins: 75, real_duration_mins: 70, status: 'completed', started_at: new Date('2026-06-04T11:00:00Z'), completed_at: new Date('2026-06-04T12:10:00Z') },
          { operation: 'Upholstery Fitting', work_center: 'Assembly Line', duration_mins: 125, real_duration_mins: 130, status: 'completed', started_at: new Date('2026-06-04T13:00:00Z'), completed_at: new Date('2026-06-04T15:10:00Z') }
        ]
      }
    }
  });

  const mo2 = await prisma.manufacturingOrder.create({
    data: {
      mo_number: 'MO-2026-002',
      product_id: diningTable.id,
      bom_id: tableBom.id,
      quantity: 1,
      produced_qty: 0,
      status: 'in_progress',
      so_id: so5.id,
      created_by: userMap['akshaymfg'].id,
      created_at: new Date('2026-06-13'),
      work_orders: {
        create: [
          { operation: 'Timber Cutting', work_center: 'Wood Shop', duration_mins: 30, real_duration_mins: 32, status: 'completed', started_at: new Date('2026-06-13T09:00:00Z'), completed_at: new Date('2026-06-13T09:32:00Z') },
          { operation: 'Frame Assembly', work_center: 'Metal Shop', duration_mins: 45, status: 'in_progress', started_at: new Date('2026-06-14T08:00:00Z') }
        ]
      }
    }
  });

  const mo3 = await prisma.manufacturingOrder.create({
    data: {
      mo_number: 'MO-2026-003',
      product_id: sofa.id,
      bom_id: sofaBom.id,
      quantity: 2,
      produced_qty: 0,
      status: 'confirmed',
      created_by: userMap['akshaymfg'].id,
      created_at: new Date('2026-06-14'),
      work_orders: {
        create: [
          { operation: 'Base Framing', work_center: 'Wood Shop', duration_mins: 80, status: 'pending' },
          { operation: 'Cushion Stuffing', work_center: 'Assembly Line', duration_mins: 60, status: 'pending' },
          { operation: 'Leather Wrapping', work_center: 'Assembly Line', duration_mins: 120, status: 'pending' }
        ]
      }
    }
  });

  // 15. Seed Stock Reservations
  console.log('Seed: Seeding Stock Reservations...');
  await prisma.stockReservation.createMany({
    data: [
      { product_id: officeChair.id, warehouse_id: whMap['WH-001'].id, source_type: 'SALES_ORDER', source_id: so1.id, reserved_qty: 10, status: 'ACTIVE' },
      { product_id: officeChair.id, warehouse_id: whMap['WH-001'].id, source_type: 'SALES_ORDER', source_id: so3.id, reserved_qty: 8, status: 'ACTIVE' },
      { product_id: diningTable.id, warehouse_id: whMap['WH-001'].id, source_type: 'SALES_ORDER', source_id: so5.id, reserved_qty: 1, status: 'ACTIVE' },
      { product_id: oakWood.id, warehouse_id: whMap['WH-002'].id, source_type: 'MANUFACTURING_ORDER', source_id: mo2.id, reserved_qty: 4, status: 'ACTIVE' },
      { product_id: steelFrame.id, warehouse_id: whMap['WH-002'].id, source_type: 'MANUFACTURING_ORDER', source_id: mo2.id, reserved_qty: 1, status: 'ACTIVE' }
    ]
  });

  // 16. Seed Stock Ledgers
  console.log('Seed: Seeding Stock Ledgers...');
  await prisma.stockLedger.createMany({
    data: [
      { product_id: oakWood.id, warehouse_id: whMap['WH-002'].id, movement_type: 'INITIAL_STOCK', direction: 'IN', quantity: 120, stock_before: 0, stock_after: 120, remarks: 'Opening stock balance.' },
      { product_id: steelFrame.id, warehouse_id: whMap['WH-002'].id, movement_type: 'INITIAL_STOCK', direction: 'IN', quantity: 80, stock_before: 0, stock_after: 80, remarks: 'Opening stock balance.' },
      { product_id: cushionFoam.id, warehouse_id: whMap['WH-002'].id, movement_type: 'INITIAL_STOCK', direction: 'IN', quantity: 60, stock_before: 0, stock_after: 60, remarks: 'Opening stock balance.' },
      { product_id: cushionFoam.id, warehouse_id: whMap['WH-002'].id, movement_type: 'PURCHASE_RECEIPT', direction: 'IN', reference_type: 'GOODS_RECEIPT', reference_id: gr1.id, quantity: 30, stock_before: 60, stock_after: 90, remarks: 'Receipt against PO-2026-003.' },
      { product_id: fabricCover.id, warehouse_id: whMap['WH-002'].id, movement_type: 'INITIAL_STOCK', direction: 'IN', quantity: 40, stock_before: 0, stock_after: 40, remarks: 'Opening stock balance.' },
      { product_id: fabricCover.id, warehouse_id: whMap['WH-002'].id, movement_type: 'PURCHASE_RECEIPT', direction: 'IN', reference_type: 'GOODS_RECEIPT', reference_id: gr1.id, quantity: 30, stock_before: 40, stock_after: 70, remarks: 'Receipt against PO-2026-003.' },
      { product_id: leatherRoll.id, warehouse_id: whMap['WH-003'].id, movement_type: 'INITIAL_STOCK', direction: 'IN', quantity: 13, stock_before: 0, stock_after: 13, remarks: 'Opening stock balance.' },
      { product_id: leatherRoll.id, warehouse_id: whMap['WH-003'].id, movement_type: 'PURCHASE_RECEIPT', direction: 'IN', reference_type: 'GOODS_RECEIPT', reference_id: gr2.id, quantity: 5, stock_before: 13, stock_after: 18, remarks: 'Receipt against PO-2026-004.' },
      { product_id: officeChair.id, warehouse_id: whMap['WH-001'].id, movement_type: 'INITIAL_STOCK', direction: 'IN', quantity: 45, stock_before: 0, stock_after: 45, remarks: 'Opening stock balance.' },
      { product_id: officeChair.id, warehouse_id: whMap['WH-001'].id, movement_type: 'SALES_DELIVERY', direction: 'OUT', reference_type: 'SALES_ORDER', reference_id: so2.id, quantity: 5, stock_before: 45, stock_after: 40, remarks: 'Delivered to DecoSpace Designs.' }
    ]
  });

  // 17. Seed Stock Transfers & Adjustments
  console.log('Seed: Seeding Transfers and Adjustments...');
  await prisma.stockTransfer.create({
    data: {
      transfer_number: 'TRF-001',
      source_warehouse_id: whMap['WH-002'].id,
      destination_warehouse_id: whMap['WH-001'].id,
      product_id: oakWood.id,
      qty: 20,
      status: 'Completed',
      reason: 'Replenishing front warehouse.',
      created_by: userMap['akshayinv'].id,
      date: new Date('2026-06-10'),
    }
  });

  await prisma.stockTransfer.create({
    data: {
      transfer_number: 'TRF-002',
      source_warehouse_id: whMap['WH-003'].id,
      destination_warehouse_id: whMap['WH-001'].id,
      product_id: leatherRoll.id,
      qty: 2,
      status: 'Pending',
      reason: 'Urgent request for premium upholstery project.',
      created_by: userMap['akshayinv'].id,
      date: new Date('2026-06-14'),
    }
  });

  await prisma.stockAdjustment.create({
    data: {
      adjustment_number: 'ADJ-001',
      product_id: oakWood.id,
      warehouse_id: whMap['WH-002'].id,
      old_qty: 122,
      new_qty: 120,
      reason: 'Water damage during cleaning.',
      created_by: userMap['akshayinv'].id,
    }
  });

  // 18. Seed Procurement Suggestions
  console.log('Seed: Seeding Procurement Suggestions...');
  await prisma.procurementSuggestion.createMany({
    data: [
      { product_id: oakWood.id, so_id: so4.id, current_stock: 120, shortage_qty: 130, procurement_source: 'PURCHASE', status: 'PENDING', reason: 'Oak Wood stock falls below safety levels.' },
      { product_id: diningTable.id, so_id: so5.id, current_stock: 5, shortage_qty: 1, procurement_source: 'MANUFACTURING', status: 'MO_CREATED', reason: 'Make-to-Order fulfillment trigger.' }
    ]
  });

  // 19. Seed Risk Alerts
  console.log('Seed: Seeding Risk Alerts...');
  await prisma.riskAlert.createMany({
    data: [
      { product_id: oakWood.id, current_stock: 120, required_stock: 250, deficit: 130, severity: 'HIGH', recommended_supplier: 'Timberland Woods Co.', lead_time_days: 5, is_resolved: false },
      { product_id: leatherRoll.id, current_stock: 18, required_stock: 22, deficit: 4, severity: 'MEDIUM', recommended_supplier: 'Foam & Fabric Industries', lead_time_days: 7, is_resolved: false }
    ]
  });

  // 20. Seed Audit Logs
  console.log('Seed: Seeding Audit Logs...');
  await prisma.auditLog.createMany({
    data: [
      { user_id: userMap['admin'].id, model_name: 'Product', record_id: officeChair.id, action: 'create', new_value: { name: officeChair.name, sku: officeChair.sku, price: officeChair.sales_price } },
      { user_id: userMap['akshaysal'].id, model_name: 'SalesOrder', record_id: so1.id, action: 'create', new_value: { order_number: so1.order_number, total: 185000 } },
      { user_id: userMap['akshaysal'].id, model_name: 'SalesOrder', record_id: so1.id, action: 'status_change', old_value: { status: 'draft' }, new_value: { status: 'confirmed' } }
    ]
  });

  console.log('Seed: Database seeding successfully complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
