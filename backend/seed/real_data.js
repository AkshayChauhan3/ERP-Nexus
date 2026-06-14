const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Real Seed: Starting comprehensive database seeding for Shiv Furniture Works (20-30 records per table)...');

  // 1. Fetch non-default users to preserve them
  const defaultLogins = ['admin', 'owner', 'akshaypur', 'akshaysal', 'akshayinv', 'akshaymfg'];
  const usersToReset = await prisma.user.findMany({
    where: { login_id: { in: defaultLogins } },
    select: { id: true }
  });
  const resetUserIds = usersToReset.map(u => u.id);

  console.log('Real Seed: Clearing existing transactional and operational records...');
  // Clear in correct dependency order to prevent FK violations
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
  await prisma.workOrder.deleteMany({});
  await prisma.manufacturingOrder.deleteMany({});
  await prisma.bOMLine.deleteMany({});
  await prisma.billOfMaterials.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.vendor.deleteMany({});
  await prisma.warehouse.deleteMany({});

  console.log('Real Seed: Deleting default test users (preserving custom accounts)...');
  await prisma.userModuleAccess.deleteMany({ where: { user_id: { in: resetUserIds } } });
  await prisma.userProfile.deleteMany({ where: { user_id: { in: resetUserIds } } });
  await prisma.refreshToken.deleteMany({ where: { user_id: { in: resetUserIds } } });
  await prisma.passwordResetToken.deleteMany({ where: { user_id: { in: resetUserIds } } });
  await prisma.user.deleteMany({ where: { id: { in: resetUserIds } } });

  // 2. Ensure Core Modules Exist (Do not delete module table to preserve custom user access)
  console.log('Real Seed: Syncing ERP Modules...');
  const modulesToSeed = [
    { name: 'sales', desc: 'Sales Order management and Customer relations' },
    { name: 'purchase', desc: 'Purchase Order management, Vendors and Goods Receipts' },
    { name: 'manufacturing', desc: 'Bill of Materials, Operations and Manufacturing Orders' },
    { name: 'inventory', desc: 'Stock Ledger, Warehousing and Stock status tracking' },
  ];
  const moduleMap = {};
  for (const item of modulesToSeed) {
    let mod = await prisma.module.findUnique({
      where: { module_name: item.name }
    });
    if (!mod) {
      mod = await prisma.module.create({
        data: {
          module_name: item.name,
          description: item.desc,
          is_active: true,
        }
      });
    }
    moduleMap[item.name] = mod;
  }

  // 3. Re-create Default Users
  console.log('Real Seed: Re-creating default users...');
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

  const userList = Object.values(userMap);

  // 4. Seed 20 Warehouses (Maharashtra & Gujarat hubs)
  console.log('Real Seed: Seeding 20 Warehouses...');
  const cities = [
    'Mumbai', 'Surat', 'Pune', 'Nagpur', 'Nashik', 
    'Thane', 'Ahmedabad', 'Vadodara', 'Aurangabad', 'Solapur', 
    'Kolhapur', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Jalgaon', 
    'Amravati', 'Nanded', 'Sangli', 'Akola', 'Gandhinagar'
  ];
  const whMap = {};
  const whList = [];
  for (let i = 0; i < 20; i++) {
    const city = cities[i];
    const code = `WH-${city.substring(0, 3).toUpperCase()}-${String(i + 1).padStart(2, '0')}`;
    const wh = await prisma.warehouse.create({
      data: {
        warehouse_code: code,
        name: `${city} Logistical Hub`,
        location: `Plot ${100 + i * 7}, Industrial Area Phase ${1 + (i % 3)}, ${city}`,
        manager: `Manager ${i + 1}`,
        capacity: 2000 + i * 200,
        status: 'Active',
      },
    });
    whMap[code] = wh;
    whList.push(wh);
  }

  // 5. Seed 25 Vendors
  console.log('Real Seed: Seeding 25 Vendors...');
  const vendorNames = [
    'Century Ply & Boards Ltd', 'Gujarat Timber Depot', 'Mahalaxmi Hardwares', 'Reliance Foam & Fabrics', 'Asian Paints Ltd (Adhesives)',
    'National Timber Mart', 'Apex Hardware House', 'Durian Veneers', 'Greenply Industries', 'Pidilite Adhesives Group',
    'Godrej Upholstery Supplies', 'Surat Wood Logs Supplier', 'JK Cement & Fillers', 'Thane Mirror & Glass Works', 'Bombay Polish Depot',
    'Krishna Steel Brackets', 'Navneet Packaging Solutions', 'Radhe Plywood Depot', 'Balaji Wood Veneer', 'Ambika Drawer Slides',
    'Shree Wood Varnishes', 'Royal Upholstery Fabrics', 'Premium Fastener Supplies', 'Vikas Timber Mills', 'Karan Wood Carvers'
  ];
  const vendorList = [];
  for (let i = 0; i < 25; i++) {
    const name = vendorNames[i];
    const vendoadd atlest 20-30 real data in each tabler = await prisma.vendor.create({
      data: {
        name,
        email: `sales@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.co.in`,
        phone: `+91 22 ${5000 + i * 13}-${String(1000 + i * 7).substring(0, 4)}`,
        address: `GIDC Industrial Estate, Shop No. ${20 + i}, Surat/Mumbai`,
        is_active: true,
      },
    });
    vendorList.push(vendor);
  }

  // 6. Seed 25 Customers
  console.log('Real Seed: Seeding 25 Customers...');
  const customerNames = [
    'Taj Hotels & Resorts Ltd', 'Aarti Office Systems Pvt Ltd', 'Mehta Residencies (Villa Project)', 'Walk-in Retail Customer',
    'ITC Grand Maratha Hotel', 'Oberoi Realty Group', 'TCS Tech Park Hinjewadi', 'Infosys Campus Pune', 'HDFC Bank Corporate Office',
    'Marriott Suites Pune', 'Lodha Luxury Villas', 'Rohan Builders Pvt Ltd', 'Goel Ganga Developers', 'K Raheja Corp Office',
    'Godrej Properties Pune', 'Reliance Corporate Park', 'Birla Centurion office', 'Patel Residential Tower', 'Sharma Villa Juhu',
    'Desai Luxury Apartments', 'Indiabulls Finance Centre', 'Panchshil Realty Pune', 'Phoenix Marketcity Showroom', 'Saraswat Bank Office',
    'Chauhan Residency Colaba'
  ];
  const customerList = [];
  for (let i = 0; i < 25; i++) {
    const name = customerNames[i];
    const code = `CUST-${String(i + 1).padStart(3, '0')}`;
    const customer = await prisma.customer.create({
      data: {
        customer_code: code,
        name,
        email: `contact@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        phone: `+91 98${200 + i * 5} ${String(10000 + i * 17).substring(0, 5)}`,
        address: `Apartment ${5 + i}, Sector ${12 + (i % 5)}, Mumbai/Pune`,
        is_active: true,
      },
    });
    customerList.push(customer);
  }

  // 7. Seed 30 Products (15 Raw Materials/Consumables, 15 Finished Goods)
  console.log('Real Seed: Seeding 30 Products...');
  const rawMaterials = [
    { sku: 'RM-TEK-01', name: 'Teak Wood Log', unit: 'CFT', cost: 3500 },
    { sku: 'RM-SHM-02', name: 'Sheesham Wood Board', unit: 'CFT', cost: 1800 },
    { sku: 'RM-PLY-18', name: '18mm Marine Plywood', unit: 'sheets', cost: 1200 },
    { sku: 'RM-PLY-12', name: '12mm Commercial Plywood', unit: 'sheets', cost: 800 },
    { sku: 'RM-PLY-06', name: '6mm Backing Plywood', unit: 'sheets', cost: 450 },
    { sku: 'RM-VEN-01', name: 'Premium Oak Veneer', unit: 'sheets', cost: 600 },
    { sku: 'RM-LAM-01', name: 'Glossy Laminate Sheet', unit: 'sheets', cost: 500 },
    { sku: 'RM-GLU-01', name: 'Fevicol SH Adhesive 10kg', unit: 'cans', cost: 1500 },
    { sku: 'RM-HNG-01', name: 'Soft-Close Cabinet Hinge', unit: 'pcs', cost: 120 },
    { sku: 'RM-RUN-01', name: 'Telescopic Drawer Runner', unit: 'pairs', cost: 350 },
    { sku: 'RM-HDL-01', name: 'Wooden Wardrobe Handle', unit: 'pcs', cost: 90 },
    { sku: 'RM-VAR-01', name: 'PU Wood Varnish 5L', unit: 'cans', cost: 1250 },
    { sku: 'RM-FOM-01', name: 'High-Density Upholstery Foam', unit: 'pcs', cost: 1500 },
    { sku: 'RM-FAB-01', name: 'Designer Upholstery Fabric', unit: 'metres', cost: 1200 },
    { sku: 'RM-SCR-01', name: 'Steel Wood Screws Box', unit: 'boxes', cost: 150 },
  ];

  const finishedGoods = [
    { sku: 'FG-BED-01', name: 'Teakwood Royal King Bed', cost: 24000, sales: 52000, ptype: 'MTS' },
    { sku: 'FG-BED-02', name: 'Sheesham Queen Size Bed', cost: 18000, sales: 39000, ptype: 'MTS' },
    { sku: 'FG-DIN-02', name: 'Sheesham 6-Seater Dining Table', cost: 14000, sales: 32000, ptype: 'MTS' },
    { sku: 'FG-DIN-04', name: 'Teakwood 4-Seater Dining Set', cost: 16000, sales: 37000, ptype: 'MTS' },
    { sku: 'FG-WRD-03', name: '4-Door Modern Plywood Wardrobe', cost: 16000, sales: 36000, ptype: 'MTS' },
    { sku: 'FG-WRD-02', name: '2-Door Compact Laminate Wardrobe', cost: 10000, sales: 22000, ptype: 'MTS' },
    { sku: 'FG-KIT-04', name: 'Modular Plywood Kitchen Cabinet Set', cost: 35000, sales: 78000, ptype: 'MTO' },
    { sku: 'FG-SOF-05', name: 'L-Shape Cushion Sofa Set', cost: 22000, sales: 48000, ptype: 'MTS' },
    { sku: 'FG-SOF-03', name: 'Premium 3-Seater Fabric Sofa', cost: 12000, sales: 26000, ptype: 'MTS' },
    { sku: 'FG-DSK-06', name: 'Solid Wood Executive Office Desk', cost: 11000, sales: 24500, ptype: 'MTS' },
    { sku: 'FG-DSK-03', name: 'Compact Plywood Study Table', cost: 5000, sales: 11500, ptype: 'MTS' },
    { sku: 'FG-CHR-01', name: 'Upholstered Cushion Dining Chair', cost: 3000, sales: 6800, ptype: 'MTS' },
    { sku: 'FG-CHR-02', name: 'Solid Wood Office Chair', cost: 4500, sales: 9800, ptype: 'MTS' },
    { sku: 'FG-TVU-01', name: 'Modern Veneer TV Console Unit', cost: 8000, sales: 17500, ptype: 'MTS' },
    { sku: 'FG-SHO-01', name: 'Laminated Closed Shoe Cabinet', cost: 4000, sales: 9000, ptype: 'MTS' },
    { sku: 'FG-CHR-03', name: 'Ergonomic Mesh Office Chair', cost: 4000, sales: 8500, ptype: 'MTS' },
    { sku: 'FG-TAB-03', name: 'Veneered Coffee Table', cost: 5000, sales: 11000, ptype: 'MTS' },
    { sku: 'FG-SOF-02', name: 'Leatherette 2-Seater Sofa', cost: 14000, sales: 30000, ptype: 'MTS' },
    { sku: 'FG-WRD-01', name: 'Sliding Door Wardrobe', cost: 22000, sales: 49000, ptype: 'MTS' },
    { sku: 'FG-DSK-01', name: 'L-Shaped Executive Desk', cost: 15000, sales: 33000, ptype: 'MTS' },
    { sku: 'FG-CAB-01', name: 'Solid Wood Credenza Sideboard', cost: 9500, sales: 21000, ptype: 'MTS' },
  ];

  const productRecords = {};
  const rmRecords = [];
  const fgRecords = [];

  // Seed Raw Materials
  for (let i = 0; i < rawMaterials.length; i++) {
    const rm = rawMaterials[i];
    const wh = whList[i % whList.length];
    const vendor = vendorList[i % vendorList.length];

    const prod = await prisma.product.create({
      data: {
        sku: rm.sku,
        name: rm.name,
        type: rm.sku === 'RM-SCR-01' ? 'CONSUMABLE' : 'RAW_MATERIAL',
        cost_price: rm.cost,
        sales_price: 0,
        unit: rm.unit,
        procurement_method: 'PURCHASE',
        procurement_type: 'MTS',
        procure_on_demand: false,
        warehouse_id: wh.id,
        vendor_id: vendor.id,
      },
    });

    productRecords[rm.sku] = prod;
    rmRecords.push(prod);

    await prisma.inventory.create({
      data: {
        product_id: prod.id,
        warehouse_id: wh.id,
        on_hand_qty: 300 + i * 50,
        reserved_qty: 0,
        reorder_level: 50 + i * 10,
      },
    });
  }

  // Seed Finished Goods
  for (let i = 0; i < finishedGoods.length; i++) {
    const fg = finishedGoods[i];
    const wh = whList[(i + 10) % whList.length];

    const prod = await prisma.product.create({
      data: {
        sku: fg.sku,
        name: fg.name,
        type: 'FINISHED_GOOD',
        cost_price: fg.cost,
        sales_price: fg.sales,
        unit: fg.sku === 'FG-KIT-04' ? 'sets' : 'pcs',
        procurement_method: 'MANUFACTURING',
        procurement_type: fg.ptype,
        procure_on_demand: fg.ptype === 'MTO',
        warehouse_id: wh.id,
      },
    });

    productRecords[fg.sku] = prod;
    fgRecords.push(prod);

    await prisma.inventory.create({
      data: {
        product_id: prod.id,
        warehouse_id: wh.id,
        on_hand_qty: fg.ptype === 'MTO' ? 0 : 5 + i,
        reserved_qty: 0,
        reorder_level: fg.ptype === 'MTO' ? 0 : 2,
      },
    });
  }

  // 8. Seed 15 BOMs (for each finished good)
  console.log('Real Seed: Seeding 15 BOMs...');
  const bomMap = {};
  for (let i = 0; i < fgRecords.length; i++) {
    const fg = fgRecords[i];
    const isTeak = fg.sku.includes('TEK') || fg.sku.includes('BED') || fg.sku.includes('KIT');
    const isSheesham = fg.sku.includes('SHM') || fg.sku.includes('DIN') || fg.sku.includes('DSK') || fg.sku.includes('CHR');

    const mainWood = isTeak ? productRecords['RM-TEK-01'] : (isSheesham ? productRecords['RM-SHM-02'] : productRecords['RM-PLY-18']);
    const backingWood = productRecords['RM-PLY-06'];
    const glue = productRecords['RM-GLU-01'];
    const screws = productRecords['RM-SCR-01'];
    const varnish = productRecords['RM-VAR-01'];

    const lines = [
      { component_product_id: mainWood.id, qty_per_unit: 4 + (i % 4), operation: 'Wood Slicing & Panel Cutting', expected_duration_mins: 60, work_center: 'Wood Shop' },
      { component_product_id: glue.id, qty_per_unit: 0.2 + (i * 0.05), operation: 'Joining & Glueing', expected_duration_mins: 30, work_center: 'Assembly Line' },
      { component_product_id: screws.id, qty_per_unit: 0.5 + (i * 0.1), operation: 'Fittings & Dowel Insertion', expected_duration_mins: 20, work_center: 'Assembly Line' },
      { component_product_id: varnish.id, qty_per_unit: 0.3 + (i * 0.05), operation: 'Sanding & Melamine Polish', expected_duration_mins: 120, work_center: 'Polish Cabin' },
    ];

    if (fg.sku.includes('BED') || fg.sku.includes('WRD') || fg.sku.includes('TVU') || fg.sku.includes('SHO')) {
      lines.push({ component_product_id: backingWood.id, qty_per_unit: 1.5, operation: 'Backpanel Stiffening', expected_duration_mins: 40, work_center: 'Assembly Line' });
    }
    if (fg.sku.includes('BED') || fg.sku.includes('WRD') || fg.sku.includes('KIT')) {
      lines.push({ component_product_id: productRecords['RM-HNG-01'].id, qty_per_unit: 6, operation: 'Hinges Fitting', expected_duration_mins: 40, work_center: 'Assembly Line' });
      lines.push({ component_product_id: productRecords['RM-HDL-01'].id, qty_per_unit: 4, operation: 'Handle Mounting', expected_duration_mins: 15, work_center: 'Assembly Line' });
    }
    if (fg.sku.includes('SOF') || fg.sku.includes('CHR-01')) {
      lines.push({ component_product_id: productRecords['RM-FOM-01'].id, qty_per_unit: 3, operation: 'Foam padding padding', expected_duration_mins: 60, work_center: 'Upholstery Shop' });
      lines.push({ component_product_id: productRecords['RM-FAB-01'].id, qty_per_unit: 8, operation: 'Fabric covering & wrapping', expected_duration_mins: 120, work_center: 'Upholstery Shop' });
    }

    const bom = await prisma.billOfMaterials.create({
      data: {
        product_id: fg.id,
        lines: {
          create: lines,
        },
      },
    });

    bomMap[fg.id] = bom;
    await prisma.product.update({
      where: { id: fg.id },
      data: { bom_id: bom.id },
    });
  }

  // 9. Seed 25 Sales Quotations
  console.log('Real Seed: Seeding 25 Sales Quotations...');
  const quotationList = [];
  for (let i = 0; i < 25; i++) {
    const cust = customerList[i % customerList.length];
    const fg = fgRecords[i % fgRecords.length];
    const qty = 2 + (i % 5);
    const amount = Number(fg.sales_price) * qty;

    const qtn = await prisma.salesQuotation.create({
      data: {
        quotation_number: `QTN-2026-R${String(i + 1).padStart(3, '0')}`,
        customer_id: cust.id,
        date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
        expiry_date: new Date(Date.now() + (10 + i) * 24 * 60 * 60 * 1000),
        amount: amount,
        status: i % 3 === 0 ? 'Approved' : (i % 3 === 1 ? 'Sent' : 'Draft'),
        remarks: `Standard project quotation for ${fg.name}`,
        lines: {
          create: [
            {
              product_id: fg.id,
              qty: qty,
              price: fg.sales_price,
              discount: i % 5 === 0 ? 10 : 0,
              tax: 18,
              total: amount * 1.18 * (i % 5 === 0 ? 0.9 : 1.0)
            }
          ]
        }
      }
    });
    quotationList.push(qtn);
  }

  // 10. Seed 25 Sales Orders
  console.log('Real Seed: Seeding 25 Sales Orders...');
  const soList = [];
  for (let i = 0; i < 25; i++) {
    const cust = customerList[(i + 5) % customerList.length];
    const fg = fgRecords[(i + 3) % fgRecords.length];
    const qty = 3 + (i % 4);
    const statusVal = i % 6 === 0 ? 'draft' : (i % 6 === 1 ? 'confirmed' : (i % 6 === 2 ? 'in_production' : (i % 6 === 3 ? 'ready_to_dispatch' : (i % 6 === 4 ? 'dispatched' : 'delivered'))));

    const so = await prisma.salesOrder.create({
      data: {
        order_number: `SO-2026-R${String(i + 1).padStart(3, '0')}`,
        customer_id: cust.id,
        order_date: new Date(Date.now() - (25 - i) * 24 * 60 * 60 * 1000),
        expected_delivery_date: new Date(Date.now() + (5 + i) * 24 * 60 * 60 * 1000),
        status: statusVal,
        remarks: `Delivery to ${cust.name} site.`,
        customer_address: cust.address,
        created_by: adminUser.id,
        salesperson_id: userMap['akshaysal'].id,
        lines: {
          create: [
            {
              product_id: fg.id,
              ordered_qty: qty,
              delivered_qty: statusVal === 'delivered' ? qty : 0,
              unit_price: fg.sales_price,
            }
          ]
        }
      }
    });
    soList.push(so);
  }

  // 11. Seed 25 Sales Deliveries
  console.log('Real Seed: Seeding 25 Sales Deliveries...');
  const deliveryList = [];
  for (let i = 0; i < 25; i++) {
    const so = soList[i];
    const soLine = await prisma.salesOrderLine.findFirst({ where: { so_id: so.id } });
    const statusVal = so.status === 'delivered' ? 'Delivered' : (so.status === 'dispatched' ? 'Dispatched' : 'Pending');

    const dlv = await prisma.salesDelivery.create({
      data: {
        delivery_number: `DLV-REAL-${String(i + 1).padStart(3, '0')}`,
        so_id: so.id,
        customer_id: so.customer_id,
        delivery_date: so.expected_delivery_date || new Date(),
        status: statusVal,
        shipping_address: so.customer_address || '',
        dispatch_date: statusVal !== 'Pending' ? new Date(so.order_date.getTime() + 5 * 24 * 60 * 60 * 1000) : null,
        lines: {
          create: [
            {
              product_id: soLine.product_id,
              qty: soLine.ordered_qty,
            }
          ]
        }
      }
    });
    deliveryList.push(dlv);
  }

  // 12. Seed 35 Purchase Orders
  console.log('Real Seed: Seeding 35 Purchase Orders...');
  const poList = [];
  for (let i = 0; i < 35; i++) {
    const vendor = vendorList[i % vendorList.length];
    const rm = rmRecords[i % rmRecords.length];
    const qty = 50 + i * 5;
    const statusVal = i % 7 === 0 ? 'draft' : (i % 7 === 1 ? 'cancelled' : (i % 7 === 2 ? 'confirmed' : (i % 2 === 0 ? 'partially_received' : 'received')));

    const po = await prisma.purchaseOrder.create({
      data: {
        po_number: `PO-2026-R${String(i + 1).padStart(3, '0')}`,
        vendor_id: vendor.id,
        status: statusVal,
        remarks: `Material bulk buy for factory.`,
        created_by: adminUser.id,
        responsible_person_id: userMap['akshaypur'].id,
        vendor_address: vendor.address,
        lines: {
          create: [
            {
              product_id: rm.id,
              ordered_qty: qty,
              received_qty: (statusVal === 'received' ? qty : (statusVal === 'partially_received' ? Math.floor(qty / 2) : 0)),
              unit_price: rm.cost_price,
            }
          ]
        }
      }
    });
    poList.push(po);
  }

  // 13. Seed 35 Goods Receipts
  console.log('Real Seed: Seeding 35 Goods Receipts...');
  const grList = [];
  for (let i = 0; i < 35; i++) {
    const po = poList[i];
    const poLine = await prisma.purchaseOrderLine.findFirst({ where: { po_id: po.id } });
    if (po.status === 'received' || po.status === 'partially_received') {
      const qtyRec = po.status === 'received' ? poLine.ordered_qty : poLine.ordered_qty.dividedBy(2);
      const gr = await prisma.goodsReceipt.create({
        data: {
          receipt_number: `GR-REAL-${String(i + 1).padStart(3, '0')}`,
          po_id: po.id,
          delivery_note_ref: `DN-VNDR-${i + 100}`,
          received_by: userMap['akshayinv'].id,
          received_at: new Date(po.created_at.getTime() + 3 * 24 * 60 * 60 * 1000),
          lines: {
            create: [
              {
                product_id: poLine.product_id,
                po_line_id: poLine.id,
                qty_received: qtyRec,
                remarks: 'Verified physical package arrived securely.'
              }
            ]
          }
        }
      });
      grList.push(gr);
    }
  }

  // 14. Seed 35 Vendor Bills
  console.log('Real Seed: Seeding 35 Vendor Bills...');
  const billList = [];
  for (let i = 0; i < 35; i++) {
    const po = poList[i];
    const poLine = await prisma.purchaseOrderLine.findFirst({ where: { po_id: po.id } });
    const subtotal = Number(poLine.unit_price) * Number(poLine.ordered_qty);
    const tax = subtotal * 0.18;
    const total = subtotal + tax;
    const statusVal = i % 4 === 0 ? 'paid' : (i % 4 === 1 ? 'pending_payment' : (i % 4 === 2 ? 'approved_for_payment' : 'void'));

    const bill = await prisma.vendorBill.create({
      data: {
        bill_number: `BILL-REAL-${String(i + 1).padStart(3, '0')}`,
        po_id: po.id,
        vendor_id: po.vendor_id,
        invoice_date: new Date(po.created_at.getTime() + 4 * 24 * 60 * 60 * 1000),
        due_date: new Date(po.created_at.getTime() + 34 * 24 * 60 * 60 * 1000),
        subtotal: subtotal,
        tax: tax,
        total_amount: total,
        status: statusVal,
        payment_reference: statusVal === 'paid' ? `TXN-P${i + 500}A` : null,
        paid_at: statusVal === 'paid' ? new Date(po.created_at.getTime() + 8 * 24 * 60 * 60 * 1000) : null,
        paid_by: statusVal === 'paid' ? ownerUser.id : null,
      }
    });
    billList.push(bill);
  }

  // 15. Seed 25 Manufacturing Orders (producing active work orders)
  console.log('Real Seed: Seeding 25 Manufacturing Orders...');
  const moList = [];
  for (let i = 0; i < 25; i++) {
    const fg = fgRecords[i % fgRecords.length];
    const bom = bomMap[fg.id];
    const qty = 5 + (i % 5);
    const statusVal = i % 5 === 0 ? 'draft' : (i % 5 === 1 ? 'confirmed' : (i % 5 === 2 ? 'in_progress' : (i % 5 === 3 ? 'completed' : 'cancelled')));

    const mo = await prisma.manufacturingOrder.create({
      data: {
        mo_number: `MO-REAL-${String(i + 1).padStart(3, '0')}`,
        product_id: fg.id,
        bom_id: bom.id,
        quantity: qty,
        produced_qty: statusVal === 'completed' ? qty : 0,
        status: statusVal,
        so_id: i % 2 === 0 ? soList[i % soList.length].id : null,
        created_by: userMap['akshaymfg'].id,
        created_at: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000),
        work_orders: {
          create: [
            {
              operation: 'Panel Cutting & Prep',
              work_center: 'Wood Shop',
              duration_mins: 120,
              real_duration_mins: statusVal === 'completed' ? 125 : 0,
              status: statusVal === 'completed' ? 'completed' : (statusVal === 'in_progress' ? 'completed' : 'pending'),
              started_at: statusVal !== 'draft' ? new Date() : null,
              completed_at: statusVal === 'completed' ? new Date() : null,
            },
            {
              operation: 'Main Frame Assembly',
              work_center: 'Assembly Line',
              duration_mins: 180,
              real_duration_mins: statusVal === 'completed' ? 175 : 0,
              status: statusVal === 'completed' ? 'completed' : (statusVal === 'in_progress' ? 'in_progress' : 'pending'),
              started_at: statusVal === 'in_progress' ? new Date() : null,
              completed_at: statusVal === 'completed' ? new Date() : null,
            }
          ]
        }
      }
    });
    moList.push(mo);
  }

  // 16. Seed 25 Stock Reservations
  console.log('Real Seed: Seeding 25 Stock Reservations...');
  for (let i = 0; i < 25; i++) {
    const mo = moList[i];
    const isCompletedOrCancelled = mo.status === 'completed' || mo.status === 'cancelled';
    const statusVal = isCompletedOrCancelled ? 'RELEASED' : 'ACTIVE';

    await prisma.stockReservation.create({
      data: {
        product_id: mo.product_id,
        warehouse_id: whList[i % whList.length].id,
        source_type: 'MANUFACTURING_ORDER',
        source_id: mo.id,
        reserved_qty: 2 + (i % 3),
        status: statusVal,
      }
    });
  }

  // 17. Seed 30 Stock Ledger Entries
  console.log('Real Seed: Seeding 30 Stock Ledgers...');
  const ledgerData = [];
  for (let i = 0; i < 30; i++) {
    const prod = i % 2 === 0 ? rmRecords[i % rmRecords.length] : fgRecords[i % fgRecords.length];
    const wh = whList[i % whList.length];
    const qty = 10 + i;
    
    ledgerData.push({
      product_id: prod.id,
      warehouse_id: wh.id,
      movement_type: i % 3 === 0 ? 'INITIAL_STOCK' : (i % 3 === 1 ? 'PURCHASE_RECEIPT' : 'MANUFACTURING_CONSUMPTION'),
      direction: i % 2 === 0 ? 'IN' : 'OUT',
      reference_type: i % 3 === 0 ? null : (i % 3 === 1 ? 'GOODS_RECEIPT' : 'MANUFACTURING_ORDER'),
      quantity: qty,
      stock_before: 100,
      stock_after: i % 2 === 0 ? 100 + qty : 100 - qty,
      remarks: `Automated ledger update ${i + 1}`,
      created_by: adminUser.id,
      created_at: new Date(Date.now() - (40 - i) * 24 * 60 * 60 * 1000)
    });
  }
  await prisma.stockLedger.createMany({ data: ledgerData });

  // 18. Seed 20 Stock Transfers
  console.log('Real Seed: Seeding 20 Stock Transfers...');
  for (let i = 0; i < 20; i++) {
    const sourceWh = whList[i % whList.length];
    const destWh = whList[(i + 1) % whList.length];
    const prod = rmRecords[i % rmRecords.length];
    
    await prisma.stockTransfer.create({
      data: {
        transfer_number: 'TRF-REAL-' + String(i + 1).padStart(3, '0'),
        source_warehouse_id: sourceWh.id,
        destination_warehouse_id: destWh.id,
        product_id: prod.id,
        qty: 5 + i,
        status: i % 2 === 0 ? 'Completed' : 'Pending',
        reason: 'Redistribute raw materials to balance capacity.',
        created_by: userMap['akshayinv'].id,
        date: new Date()
      }
    });
  }

  // 19. Seed 20 Stock Adjustments
  console.log('Real Seed: Seeding 20 Stock Adjustments...');
  for (let i = 0; i < 20; i++) {
    const wh = whList[i % whList.length];
    const prod = rmRecords[i % rmRecords.length];
    const oldQty = 150 + i * 5;
    
    await prisma.stockAdjustment.create({
      data: {
        adjustment_number: 'ADJ-REAL-' + String(i + 1).padStart(3, '0'),
        product_id: prod.id,
        warehouse_id: wh.id,
        old_qty: oldQty,
        new_qty: oldQty - (i % 3 === 0 ? 2 : -2),
        reason: i % 2 === 0 ? 'Shrinkage discovered during manual count' : 'Extra items found behind rack',
        created_by: userMap['akshayinv'].id,
      }
    });
  }

  // 20. Seed 25 Procurement Suggestions
  console.log('Real Seed: Seeding 25 Procurement Suggestions...');
  const suggestionsData = [];
  for (let i = 0; i < 25; i++) {
    const prod = rmRecords[i % rmRecords.length];
    const so = soList[i % soList.length];
    suggestionsData.push({
      product_id: prod.id,
      so_id: so.id,
      current_stock: 12 + i,
      shortage_qty: 30 + i * 2,
      procurement_source: i % 2 === 0 ? 'PURCHASE' : 'MANUFACTURING',
      status: i % 3 === 0 ? 'PENDING' : (i % 3 === 1 ? 'PO_CREATED' : 'MO_CREATED'),
      reason: `Automated threshold reorder check.`,
    });
  }
  await prisma.procurementSuggestion.createMany({ data: suggestionsData });

  // 21. Seed 20 Risk Alerts
  console.log('Real Seed: Seeding 20 Risk Alerts...');
  const allProductsForAlerts = rmRecords.concat(fgRecords);
  for (let i = 0; i < 20; i++) {
    const prod = allProductsForAlerts[i];
    const vendor = vendorList[i % vendorList.length];
    await prisma.riskAlert.create({
      data: {
        product_id: prod.id,
        current_stock: 10 + i,
        required_stock: 50 + i * 5,
        deficit: 40 + i * 4,
        severity: i % 3 === 0 ? 'HIGH' : (i % 3 === 1 ? 'MEDIUM' : 'LOW'),
        recommended_supplier: vendor.name,
        lead_time_days: 3 + (i % 7),
        is_resolved: i % 2 === 0,
      }
    });
  }

  // 22. Seed 30 Audit Logs
  console.log('Real Seed: Seeding 30 Audit Logs...');
  const auditData = [];
  for (let i = 0; i < 30; i++) {
    const user = userList[i % userList.length] || adminUser;
    auditData.push({
      user_id: user.id,
      model_name: i % 2 === 0 ? 'SalesOrder' : 'PurchaseOrder',
      record_id: soList[i % soList.length].id,
      action: i % 4 === 0 ? 'create' : (i % 4 === 1 ? 'update' : (i % 4 === 2 ? 'status_change' : 'delete')),
      old_value: { status: 'draft' },
      new_value: { status: 'confirmed' },
      created_at: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000)
    });
  }
  await prisma.auditLog.createMany({ data: auditData });

  console.log('Real Seed: Database seeding successfully complete!');
}

main()
  .catch((e) => {
    console.error('Real Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
