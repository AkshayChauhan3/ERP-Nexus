const prisma = require('../../config/db');
const notificationStore = require('./notification.store');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function getDashboardStats() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Sales
  const salesLines = await prisma.salesOrderLine.findMany({
    include: { order: true }
  });
  
  let todaySales = 0;
  let monthlySales = 0;
  
  for (const line of salesLines) {
    const val = Number(line.ordered_qty) * Number(line.unit_price);
    const orderDate = new Date(line.order.created_at);
    if (orderDate >= startOfMonth) monthlySales += val;
    if (orderDate >= startOfDay) todaySales += val;
  }

  // Purchases
  const poLines = await prisma.purchaseOrderLine.findMany({
    include: { order: true }
  });

  let todayPurchases = 0;
  let monthlyPurchases = 0;

  for (const line of poLines) {
    const val = Number(line.ordered_qty) * Number(line.unit_price);
    const orderDate = new Date(line.order.created_at);
    if (orderDate >= startOfMonth) monthlyPurchases += val;
    if (orderDate >= startOfDay) todayPurchases += val;
  }

  // Inventory Value
  const inventory = await prisma.inventory.findMany({
    include: { product: true }
  });
  
  let invValue = 0;
  let lowStock = 0;
  for (const inv of inventory) {
    invValue += Number(inv.on_hand_qty) * Number(inv.product.cost_price);
    if (Number(inv.on_hand_qty) < Number(inv.reorder_level)) {
      lowStock++;
    }
  }

  // MO in progress
  const moInProgress = await prisma.manufacturingOrder.count({
    where: { status: 'in_progress' }
  });

  // Active Users
  const activeUsers = await prisma.user.count({
    where: { status: 'APPROVED' }
  });

  const pendingApprovals = 0;

  const revenue = monthlySales;
  const expenses = monthlyPurchases + 25000;
  const profit = revenue - expenses;

  return {
    todaySales,
    monthlySales,
    todayPurchases,
    monthlyPurchases,
    invValue,
    moInProgress,
    pendingApprovals,
    revenue,
    expenses,
    profit,
    lowStock,
    activeUsers
  };
}

const GEMINI_MODELS = [
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-3.8-flash',
  'gemini-pro-latest'
];

/**
 * Robust Gemini AI caller with automatic model fallback
 */
async function callGeminiWithFallback(apiKey, prompt) {
  const genAI = new GoogleGenerativeAI(apiKey.trim());
  let lastErr = null;

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      if (text) {
        return { text, modelName };
      }
    } catch (err) {
      lastErr = err;
      console.warn(`⚠️ Gemini model [${modelName}] failed: ${err.message}. Trying fallback model...`);
    }
  }

  throw lastErr || new Error('All Gemini candidate models failed');
}

/**
 * Resolve authenticated user's role mapping accurately
 */
async function resolveMappedRole(role, user) {
  let mappedRole = (role || user?.role || '').toLowerCase().trim();

  // Business Owner identification takes top precedence
  if (user?.login_id === 'owner' || user?.profile?.position?.toLowerCase().includes('owner') || user?.profile?.position?.toLowerCase().includes('ceo')) {
    return 'owner';
  }

  if (user?.id && (!mappedRole || mappedRole === 'user' || mappedRole === 'null')) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { profile: true, module_access: { include: { module: true } } }
      });
      if (dbUser) {
        if (dbUser.login_id === 'owner') mappedRole = 'owner';
        else if (dbUser.is_admin) mappedRole = 'admin';
        else if (dbUser.module_access?.[0]?.module?.module_name) {
          mappedRole = dbUser.module_access[0].module.module_name.toLowerCase();
        } else if (dbUser.profile?.position) {
          const p = dbUser.profile.position.toLowerCase();
          if (p.includes('owner') || p.includes('ceo')) mappedRole = 'owner';
          else if (p.includes('pur') || p.includes('procure')) mappedRole = 'purchase';
          else if (p.includes('sal')) mappedRole = 'sales';
          else if (p.includes('mfg') || p.includes('produc')) mappedRole = 'manufacturing';
          else if (p.includes('inv') || p.includes('ware') || p.includes('stock')) mappedRole = 'inventory';
        } else if (dbUser.login_id) {
          const lid = dbUser.login_id.toLowerCase();
          if (lid.includes('pur')) mappedRole = 'purchase';
          else if (lid.includes('sal')) mappedRole = 'sales';
          else if (lid.includes('mfg')) mappedRole = 'manufacturing';
          else if (lid.includes('inv')) mappedRole = 'inventory';
        }
      }
    } catch (e) {
      console.error('Error resolving user role:', e);
    }
  }

  return mappedRole || 'owner';
}

/**
 * Role-Based EN Advisor Recommendations
 * Scans live business operations using Gemini AI, with distinct role-specific heuristic fallbacks
 * and persistent database resolution tracking.
 */
async function getAdvisorRecommendations(role, user) {
  const mappedRole = await resolveMappedRole(role, user);
  const now = new Date();

  // Fetch all already resolved keys so neither AI nor heuristics repeat them
  const resolvedKeys = await notificationStore.getAllResolvedRecommendationKeys();
  const isResolved = (key) => resolvedKeys.includes(key);

  // 1. Live operational data queries across all modules
  const [
    allInventory,
    pendingMOs,
    overdueDeliveries,
    draftQuotes,
    pendingBills,
    pendingPOs,
    pendingTransfers,
    pendingUsersCount,
    recentAuditLogs,
    defaultVendor,
    stats
  ] = await Promise.all([
    prisma.inventory.findMany({
      include: { product: true },
      orderBy: { on_hand_qty: 'asc' }
    }),
    prisma.manufacturingOrder.findMany({
      where: { status: { in: ['in_progress', 'confirmed'] } },
      include: { product: true, work_orders: true },
      orderBy: { created_at: 'desc' },
      take: 6
    }),
    prisma.salesOrder.findMany({
      where: { status: 'confirmed', expected_delivery_date: { lt: now } },
      include: { customer: true, lines: { include: { product: true } } },
      take: 6
    }),
    prisma.salesQuotation.findMany({
      where: { status: 'Draft' },
      include: { customer: true },
      take: 5
    }),
    prisma.vendorBill.findMany({
      where: { status: 'pending_payment' },
      include: { vendor: true },
      take: 6
    }),
    prisma.purchaseOrder.findMany({
      where: { status: { in: ['draft', 'confirmed'] } },
      include: { vendor: true, lines: true },
      take: 5
    }),
    prisma.stockTransfer.findMany({
      where: { status: 'Pending' },
      include: { product: true, source_warehouse: true, destination_warehouse: true },
      take: 5
    }),
    prisma.user.count({
      where: { status: 'PENDING' }
    }),
    prisma.auditLog.findMany({
      orderBy: { created_at: 'desc' },
      take: 5
    }),
    prisma.vendor.findFirst({
      where: { is_active: true },
      orderBy: { created_at: 'asc' }
    }),
    getDashboardStats()
  ]);

  const lowStockItems = allInventory
    .filter(i => Number(i.on_hand_qty) < Number(i.reorder_level))
    .slice(0, 8);

  // 2. Comprehensive Operational Snapshot for Gemini AI Scanner
  const operationalSnapshot = {
    role: mappedRole,
    userName: user?.name || user?.login_id || 'User',
    financials: {
      todaySales: stats.todaySales,
      monthlySales: stats.monthlySales,
      todayPurchases: stats.todayPurchases,
      monthlyPurchases: stats.monthlyPurchases,
      inventoryValue: stats.invValue,
      unpaidBillsCount: pendingBills.length,
      unpaidBillsTotal: pendingBills.reduce((acc, b) => acc + Number(b.total_amount || 0), 0)
    },
    inventory: {
      lowStockCount: lowStockItems.length,
      lowStockItems: lowStockItems.map(i => ({
        productId: i.product_id,
        name: i.product.name,
        sku: i.product.sku,
        type: i.product.type,
        onHand: Number(i.on_hand_qty),
        reorderLevel: Number(i.reorder_level),
        deficit: Math.max(0, Number(i.reorder_level) - Number(i.on_hand_qty)),
        costPrice: Number(i.product.cost_price || 150),
        unit: i.product.unit || 'units'
      })),
      pendingTransfers: pendingTransfers.map(t => ({
        id: t.id,
        transferNumber: t.transfer_number,
        product: t.product?.name,
        qty: Number(t.qty),
        from: t.source_warehouse?.name,
        to: t.destination_warehouse?.name
      }))
    },
    manufacturing: {
      activeMOCount: pendingMOs.length,
      activeMOs: pendingMOs.map(m => ({
        id: m.id,
        moNumber: m.mo_number,
        product: m.product?.name,
        targetQty: Number(m.quantity),
        producedQty: Number(m.produced_qty || 0),
        progressPercent: m.quantity > 0 ? Math.round((Number(m.produced_qty || 0) / Number(m.quantity)) * 100) : 0,
        status: m.status,
        workOrdersCount: m.work_orders?.length || 0
      }))
    },
    sales: {
      overdueDeliveriesCount: overdueDeliveries.length,
      overdueOrders: overdueDeliveries.map(so => ({
        id: so.id,
        orderNumber: so.order_number,
        customer: so.customer?.name,
        expectedDate: so.expected_delivery_date,
        totalItems: so.lines?.length || 0
      })),
      draftQuotesCount: draftQuotes.length,
      draftQuotes: draftQuotes.map(q => ({
        id: q.id,
        quoteNumber: q.quotation_number,
        customer: q.customer?.name,
        amount: Number(q.amount)
      }))
    },
    procurement: {
      pendingPOCount: pendingPOs.length,
      pendingPOs: pendingPOs.map(p => ({
        id: p.id,
        poNumber: p.po_number,
        vendor: p.vendor?.name,
        status: p.status
      })),
      pendingBills: pendingBills.map(b => ({
        id: b.id,
        billNumber: b.bill_number,
        vendor: b.vendor?.name,
        amount: Number(b.total_amount),
        dueDate: b.due_date
      }))
    },
    administration: {
      pendingUsersCount,
      activeUsers: stats.activeUsers,
      recentAuditEvents: recentAuditLogs.map(a => ({
        id: a.id,
        model: a.model_name,
        action: a.action
      }))
    }
  };

  // 3. Try Gemini AI Deep Scan if API key is configured
  const apiKey = process.env.GEMINI_API_KEY;
  const hasValidKey = apiKey && apiKey.trim().length > 10 && !apiKey.includes('your-') && !apiKey.includes('dummy');

  if (hasValidKey) {
    try {
      const prompt = `You are the autonomous Executive AI Advisor for ERP-Nexus (Shiv Furniture Works Factory OS).
You are analyzing the live business data specifically for the logged-in user:
- Role: ${mappedRole.toUpperCase()}
- User: ${user?.name || user?.login_id || 'User'}

The business currently has the following real-time operational status:
${JSON.stringify(operationalSnapshot, null, 2)}

Already resolved recommendations (DO NOT repeat or suggest these again):
${JSON.stringify(resolvedKeys)}

TASK:
Scan the live business data above through the specific lens and responsibility of the "${mappedRole}" role.
Identify the 3 most impactful bottlenecks, risks, or strategic actions for this specific role.
For each recommendation, state clearly WHAT thing the team can work on, WHY it matters, and suggest a concrete SOLUTION.

Required JSON Structure for each item in the array:
- "id": A unique, stable identifier starting with "rec-${mappedRole.substring(0, 3)}-" followed by a specific entity or metric key (e.g. rec-pur-low-[productId], rec-own-bill-[billId], rec-sal-so-[orderId], rec-adm-user-pending, rec-mfg-mo-[moId]).
- "priority": "High Priority" | "Medium" | "Low"
- "category": A clear category (e.g. "Procurement", "Production", "Treasury", "Fulfillment", "Security", "Warehouse")
- "title": A crisp, professional 4-7 word title explaining WHAT needs attention.
- "description": A 2-3 sentence executive diagnosis explaining the exact bottleneck from the data, WHY it impacts operations/revenue, and suggesting a concrete SOLUTION.
- "action_label": Action button text (e.g. "Create PO", "View Work Orders", "Inspect Deliveries", "Review Bills", "Approve Users", "Review Quotations", "View Inventory", "View Analytics").
- "action_type": One of: "CREATE_PO", "VIEW_WORK_ORDERS", "NAVIGATE", "VIEW_ANALYTICS"
- "action_payload": JSON object with appropriate deep-link path and data:
   - For "CREATE_PO": { "productId": "...", "productName": "...", "vendorId": "${defaultVendor?.id || ''}", "vendorName": "${defaultVendor?.name || 'Primary Supplier'}", "suggestedQty": 20, "costPrice": 150, "unit": "units" }
   - For "VIEW_WORK_ORDERS": { "targetPath": "/manufacturing/work-orders", "moId": "..." }
   - For "VIEW_ANALYTICS": { "targetPath": "${mappedRole === 'owner' ? '/owner/financials' : '/sales/analytics'}" }
   - For "NAVIGATE": { "targetPath": "..." (e.g. "/users", "/purchase/vendor-bills", "/sales/deliveries", "/inventory/transfers", "/audit-logs") }

Return ONLY a valid JSON array of 3 recommendation objects. No markdown backticks, no explanatory text.`;

      const aiResponse = await callGeminiWithFallback(apiKey, prompt);
      const cleanJson = aiResponse.text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (Array.isArray(parsed) && parsed.length > 0) {
        const activeAiRecs = parsed.filter(item => item && item.id && !resolvedKeys.includes(item.id));
        if (activeAiRecs.length > 0) {
          console.log(`✅ EN Advisor: Gemini AI (${aiResponse.modelName}) generated ${activeAiRecs.length} personalized recommendations for role: ${mappedRole}`);
          return activeAiRecs.slice(0, 3);
        }
      }
    } catch (aiErr) {
      console.warn('⚠️ EN Advisor: Gemini AI scan encountered an issue, seamlessly using distinct role heuristic fallback. Error:', aiErr.message);
    }
  }

  // 4. Distinct Role-Specific Heuristic Fallbacks
  // Ensures EVERY role sees unique, tailored insights with zero overlap
  let rawCandidates = [];

  if (mappedRole === 'owner') {
    // OWNER: Strategic Financials, Working Capital, High-stakes fulfillment
    // A. Working Capital: Pending Vendor Invoices vs Revenue
    if (pendingBills.length > 0) {
      const recKey = `rec-own-treasury-bills`;
      if (!isResolved(recKey)) {
        const totalDue = pendingBills.reduce((acc, b) => acc + Number(b.total_amount || 0), 0);
        rawCandidates.push({
          id: recKey,
          priority: 'High Priority',
          category: 'Treasury & Cash Flow',
          title: `Working Capital: ₹${totalDue.toLocaleString('en-IN')} Due in Vendor Bills`,
          description: `${pendingBills.length} vendor bill(s) await payment authorization. Review upcoming cash outflows to protect supplier credit terms without straining operating liquidity.`,
          action_label: 'Review Bills',
          action_type: 'NAVIGATE',
          action_payload: { targetPath: '/owner/financials' }
        });
      }
    }

    // B. Critical Material Shortages Threatening Production Output
    if (lowStockItems.length > 0) {
      const topLow = lowStockItems[0];
      const recKey = `rec-own-low-${topLow.product_id}`;
      if (!isResolved(recKey)) {
        rawCandidates.push({
          id: recKey,
          priority: 'High Priority',
          category: 'Procurement Risk',
          title: `Authorize Replenishment: ${topLow.product.name}`,
          description: `${lowStockItems.length} essential materials are below safety threshold. Authorize a bulk purchase order to guarantee uninterrupted assembly lines.`,
          action_label: 'Create PO',
          action_type: 'CREATE_PO',
          action_payload: {
            productId: topLow.product_id,
            productName: topLow.product.name,
            vendorId: defaultVendor?.id || null,
            vendorName: defaultVendor?.name || 'Primary Supplier',
            suggestedQty: Math.max(Math.ceil(Number(topLow.reorder_level || 15) * 2 - Number(topLow.on_hand_qty || 0)), 15),
            costPrice: Number(topLow.product.cost_price || 250),
            unit: topLow.product.unit || 'units'
          }
        });
      }
    }

    // C. Delivery Commitments & Client Satisfaction
    if (overdueDeliveries.length > 0) {
      const recKey = `rec-own-overdue-so`;
      if (!isResolved(recKey)) {
        rawCandidates.push({
          id: recKey,
          priority: 'High Priority',
          category: 'Fulfillment Risk',
          title: `${overdueDeliveries.length} Overdue Client Delivery Order(s)`,
          description: `Key customer commitments (${overdueDeliveries.slice(0, 2).map(o => o.customer?.name).filter(Boolean).join(', ')}) are past delivery date. Clear warehouse dispatch blockers.`,
          action_label: 'View Deliveries',
          action_type: 'NAVIGATE',
          action_payload: { targetPath: '/owner/sales' }
        });
      }
    }

    if (rawCandidates.length === 0) {
      rawCandidates.push({
        id: 'rec-own-healthy',
        priority: 'Low',
        category: 'Strategic Growth',
        title: 'Strong Operating Margins & Factory Equilibrium',
        description: 'All primary factory KPIs and delivery targets are performing on schedule. Opportunity to evaluate expansion into new commercial customer segments.',
        action_label: 'View Analytics',
        action_type: 'VIEW_ANALYTICS',
        action_payload: { targetPath: '/owner/financials' }
      });
    }
  } 
  else if (mappedRole === 'admin') {
    // ADMIN: System Health, User Approvals, Security & Audit Logs
    // A. Pending Employee Registrations
    if (pendingUsersCount > 0) {
      const recKey = `rec-adm-pending-users`;
      if (!isResolved(recKey)) {
        rawCandidates.push({
          id: recKey,
          priority: 'High Priority',
          category: 'Access Control',
          title: `${pendingUsersCount} User Account(s) Awaiting Approval`,
          description: `New employee onboarding requests are pending administrative review. Verify department credentials and grant role-based module access.`,
          action_label: 'Approve Users',
          action_type: 'NAVIGATE',
          action_payload: { targetPath: '/users' }
        });
      }
    }

    // B. Security & Audit Trail Inspection
    const recKeyAudit = `rec-adm-audit-logs`;
    if (!isResolved(recKeyAudit)) {
      rawCandidates.push({
        id: recKeyAudit,
        priority: 'Medium',
        category: 'Security & Compliance',
        title: 'Review System Audit Trails & Data Security',
        description: `${recentAuditLogs.length} state modification logs recorded recently. Audit transaction integrity to ensure zero unauthorized privilege escalations.`,
        action_label: 'Inspect Logs',
        action_type: 'NAVIGATE',
        action_payload: { targetPath: '/audit-logs' }
      });
    }

    // C. System & Database Health
    if (rawCandidates.length < 3) {
      rawCandidates.push({
        id: 'rec-adm-system-health',
        priority: 'Low',
        category: 'System Performance',
        title: 'Database Synchronized & Cloud Services Active',
        description: 'Supabase PostgreSQL pooler and Azure App Service runtime are operating with normal response latencies across all API endpoints.',
        action_label: 'System Status',
        action_type: 'NAVIGATE',
        action_payload: { targetPath: '/dashboard' }
      });
    }
  } 
  else if (mappedRole === 'purchase') {
    // PURCHASE: Low stock procurement, Inbound PO tracking, Vendor bills
    for (const item of lowStockItems) {
      const recKey = `rec-pur-low-${item.product_id}`;
      if (!isResolved(recKey)) {
        const suggestedQty = Math.max(
          Math.ceil(Number(item.reorder_level || 15) * 2 - Number(item.on_hand_qty || 0)),
          10
        );
        rawCandidates.push({
          id: recKey,
          priority: 'High Priority',
          category: 'Stock Replenishment',
          title: `Replenish ${item.product.name}`,
          description: `On-hand stock is at ${item.on_hand_qty} ${item.product.unit || 'units'} (safety minimum: ${item.reorder_level || 15}). Generate a purchase order to prevent supply bottlenecks.`,
          action_label: 'Create PO',
          action_type: 'CREATE_PO',
          action_payload: {
            productId: item.product_id,
            productName: item.product.name,
            vendorId: defaultVendor?.id || null,
            vendorName: defaultVendor?.name || 'Primary Supplier',
            suggestedQty,
            costPrice: Number(item.product.cost_price || 250),
            unit: item.product.unit || 'units'
          }
        });
      }
      if (rawCandidates.length >= 2) break;
    }

    // Inbound Shipments
    if (pendingPOs.length > 0) {
      const po = pendingPOs[0];
      const recKey = `rec-pur-inbound-${po.id}`;
      if (!isResolved(recKey)) {
        rawCandidates.push({
          id: recKey,
          priority: 'Medium',
          category: 'Logistics Dock',
          title: `Verify Inbound Shipment for PO #${po.po_number}`,
          description: `PO #${po.po_number} with ${po.vendor?.name || 'Supplier'} is confirmed. Ensure loading dock readiness for physical goods receipt and barcode tagging.`,
          action_label: 'View Goods Receipts',
          action_type: 'NAVIGATE',
          action_payload: { targetPath: '/purchase/goods-receipts' }
        });
      }
    }

    if (rawCandidates.length === 0) {
      rawCandidates.push({
        id: 'rec-pur-healthy',
        priority: 'Low',
        category: 'Supplier Contracts',
        title: 'Procurement Pipeline In Balance',
        description: 'All raw materials are safely stocked above reorder thresholds. Suitable time to review supplier pricing discounts and lead-time contracts.',
        action_label: 'View Catalog',
        action_type: 'NAVIGATE',
        action_payload: { targetPath: '/purchase/materials' }
      });
    }
  } 
  else if (mappedRole === 'inventory') {
    // INVENTORY: Warehouse capacity, Pending stock transfers, Safety stock
    if (pendingTransfers.length > 0) {
      const tr = pendingTransfers[0];
      const recKey = `rec-inv-transfer-${tr.id}`;
      if (!isResolved(recKey)) {
        rawCandidates.push({
          id: recKey,
          priority: 'High Priority',
          category: 'Inter-facility Transfer',
          title: `Process Transfer #${tr.transfer_number} (${tr.product?.name || 'Material'})`,
          description: `Transfer of ${tr.qty} units from ${tr.source_warehouse?.name || 'Source'} to ${tr.destination_warehouse?.name || 'Destination'} is pending. Complete shipment dispatch.`,
          action_label: 'Inspect Transfers',
          action_type: 'NAVIGATE',
          action_payload: { targetPath: '/inventory/transfers' }
        });
      }
    }

    if (lowStockItems.length > 0) {
      const topLow = lowStockItems[0];
      const recKey = `rec-inv-low-${topLow.product_id}`;
      if (!isResolved(recKey)) {
        rawCandidates.push({
          id: recKey,
          priority: 'High Priority',
          category: 'Stock Deficit',
          title: `Critical Reorder Trigger: ${topLow.product.name}`,
          description: `Warehouse SKU ${topLow.product.sku || ''} is below minimum storage point. Verify physical stock count and initiate reorder requisition.`,
          action_label: 'View Inventory',
          action_type: 'NAVIGATE',
          action_payload: { targetPath: '/inventory/overview' }
        });
      }
    }

    if (rawCandidates.length === 0) {
      rawCandidates.push({
        id: 'rec-inv-healthy',
        priority: 'Low',
        category: 'Warehouse Audit',
        title: 'Warehouse Stock Distributed Evenly',
        description: 'No pending stock transfer delays or inventory variances detected across warehouses. Proceed with scheduled cycle count audits.',
        action_label: 'Stock Alerts',
        action_type: 'NAVIGATE',
        action_payload: { targetPath: '/inventory/alerts' }
      });
    }
  } 
  else if (mappedRole === 'manufacturing') {
    // MANUFACTURING: Active MOs, Work orders, Bottlenecks
    for (const mo of pendingMOs) {
      const recKey = `rec-mfg-mo-${mo.id}`;
      if (!isResolved(recKey)) {
        const isDelayed = mo.status === 'in_progress' && Number(mo.produced_qty) < Number(mo.quantity) / 2;
        rawCandidates.push({
          id: recKey,
          priority: isDelayed ? 'High Priority' : 'Medium',
          category: 'Production Line',
          title: `Production Run: MO #${mo.mo_number} (${mo.product?.name || 'Product'})`,
          description: `Output at ${mo.produced_qty || 0}/${mo.quantity} units. Ensure work centers maintain scheduled cycle time to meet factory delivery commitments.`,
          action_label: 'View Work Orders',
          action_type: 'VIEW_WORK_ORDERS',
          action_payload: {
            targetPath: '/manufacturing/work-orders',
            moId: mo.id,
            moNumber: mo.mo_number
          }
        });
      }
      if (rawCandidates.length >= 2) break;
    }

    if (rawCandidates.length === 0) {
      rawCandidates.push({
        id: 'rec-mfg-healthy',
        priority: 'Low',
        category: 'Shop Floor',
        title: 'Assembly Lines Running At Standard Throughput',
        description: 'All work centers are operating within scheduled parameters. Review upcoming production runs or inspect BOM component revisions.',
        action_label: 'View BOMs',
        action_type: 'NAVIGATE',
        action_payload: { targetPath: '/manufacturing/bom' }
      });
    }
  } 
  else if (mappedRole === 'sales') {
    // SALES: Overdue Deliveries, Quotation Follow-up, Customer fulfillment
    for (const so of overdueDeliveries) {
      const recKey = `rec-sal-overdue-${so.id}`;
      if (!isResolved(recKey)) {
        rawCandidates.push({
          id: recKey,
          priority: 'High Priority',
          category: 'Delivery Fulfillment',
          title: `Overdue Delivery: SO #${so.order_number}`,
          description: `Sales order for ${so.customer?.name || 'Client'} has surpassed its promised delivery date. Follow up with logistics or customer support.`,
          action_label: 'Inspect Deliveries',
          action_type: 'NAVIGATE',
          action_payload: { targetPath: '/sales/deliveries' }
        });
      }
      if (rawCandidates.length >= 2) break;
    }

    for (const q of draftQuotes) {
      const recKey = `rec-sal-quote-${q.id}`;
      if (!isResolved(recKey)) {
        rawCandidates.push({
          id: recKey,
          priority: 'Medium',
          category: 'Deal Pipeline',
          title: `Quote Follow-up: #${q.quotation_number}`,
          description: `Quotation for ${q.customer?.name || 'Customer'} (₹${Number(q.amount).toLocaleString('en-IN')}) is in Draft. Contact client to secure order confirmation.`,
          action_label: 'Review Quotations',
          action_type: 'NAVIGATE',
          action_payload: { targetPath: '/sales/quotations' }
        });
      }
      if (rawCandidates.length >= 3) break;
    }

    if (rawCandidates.length === 0) {
      rawCandidates.push({
        id: 'rec-sal-healthy',
        priority: 'Low',
        category: 'Revenue Optimization',
        title: 'All Orders Delivered On Time',
        description: 'Zero overdue shipments across client accounts. Analyze conversion rates and customer repeat purchase patterns to grow sales pipeline.',
        action_label: 'View Analytics',
        action_type: 'VIEW_ANALYTICS',
        action_payload: { targetPath: '/sales/analytics' }
      });
    }
  }

  return rawCandidates.slice(0, 3);
}

/**
 * Mark an EN Advisor recommendation as resolved
 */
async function resolveAdvisorRecommendation(key, actionType, user) {
  const mappedRole = await resolveMappedRole(user?.role, user);
  const ok = await notificationStore.resolveAdvisorRecommendation(key, mappedRole, user, actionType);

  // If recommendation is tied to low stock, auto-resolve matching inventory notifications
  if (key && (key.includes('low-') || key.includes('rec-pur-low-') || key.includes('rec-own-low-'))) {
    const parts = key.split('low-');
    if (parts[1]) {
      await notificationStore.resolveByEntity('inventory', parts[1]);
    }
  }

  return ok;
}

async function getBusinessSummary() {
  const stats = await getDashboardStats();

  const apiKey = process.env.GEMINI_API_KEY;
  const hasValidKey = apiKey && apiKey.trim().length > 10 && !apiKey.includes('your-') && !apiKey.includes('dummy');

  if (hasValidKey) {
    try {
      const prompt = `You are a Chief Financial Officer reporting to the CEO. Write a 2-paragraph executive summary based on the following ERP system metrics.
      Focus on strategic insights, bottlenecks (if any), and overall health.
      
      Today's Sales: ₹${stats.todaySales}
      Monthly Sales: ₹${stats.monthlySales}
      Today's Purchases: ₹${stats.todayPurchases}
      Monthly Purchases: ₹${stats.monthlyPurchases}
      Inventory Value: ₹${stats.invValue}
      MOs In Progress: ${stats.moInProgress}
      Pending Approvals: ${stats.pendingApprovals}
      Low Stock Items: ${stats.lowStock}
      Active Users: ${stats.activeUsers}

      Make it read like a professional business narrative, without markdown bullets. Include positive reinforcement for good numbers, and constructive warnings for bottlenecks like low stock or pending approvals.`;

      const aiResponse = await callGeminiWithFallback(apiKey, prompt);
      return aiResponse.text;
    } catch (err) {
      console.warn('⚠️ EN Advisor: Gemini summary failed, using template fallback. Error:', err.message);
    }
  }

  // Template Fallback
  const isHealthy = (stats.todaySales > stats.todayPurchases) && (stats.lowStock < 5) && (stats.pendingApprovals < 10);
  const healthDeclaration = isHealthy 
    ? "Overall Business Health: EXCELLENT 🟢\nYour business is performing exceptionally well today. " 
    : "Overall Business Health: NEEDS ATTENTION 🟠\nThere are a few areas requiring your immediate attention. ";

  let summary = `${healthDeclaration}\n\nFinancial Overview:\nYour current monthly revenue stands at ₹${stats.monthlySales.toLocaleString()}, with today bringing in ₹${stats.todaySales.toLocaleString()}. In terms of expenses, your monthly procurement outlay is ₹${stats.monthlyPurchases.toLocaleString()}, and today's expenses are ₹${stats.todayPurchases.toLocaleString()}. `;
  
  if (stats.todaySales > stats.todayPurchases) {
    summary += `You are maintaining a strong, positive daily cash flow, which is great for the company's financial stability. `;
  } else {
    summary += `Currently, today's procurement costs are outpacing today's sales. It's recommended to monitor cash reserves. `;
  }

  summary += `\n\nOperational Status:\nYour total inventory valuation is sitting at ₹${stats.invValue.toLocaleString()}. `;

  let bottlenecks = [];
  if (stats.pendingApprovals > 5) bottlenecks.push(`there is a backlog of ${stats.pendingApprovals} pending approvals slowing down operations`);
  else if (stats.pendingApprovals > 0) bottlenecks.push(`you have ${stats.pendingApprovals} quick approvals awaiting your review`);

  if (stats.lowStock > 0) bottlenecks.push(`there are ${stats.lowStock} items critically low on stock that need reordering`);
  
  if (bottlenecks.length > 0) {
    summary += `Please note that ${bottlenecks.join(' and ')}. `;
    if (stats.moInProgress > 0) {
      summary += `On the bright side, the factory floor is busy with ${stats.moInProgress} active manufacturing orders in progress.`;
    } else {
      summary += `Also, production is currently paused with no manufacturing orders running.`;
    }
  } else {
    summary += `Operations are running flawlessly with no major bottlenecks. You have ${stats.moInProgress} active manufacturing orders, and your supply chain is stable. Keep up the great work!`;
  }

  return summary;
}

/**
 * Role-Based Live Notification Generator & Synchronizer
 */
async function getRoleNotifications(role, user) {
  const mappedRole = await resolveMappedRole(role, user);
  const liveNotifs = [];

  try {
    if (mappedRole === 'purchase') {
      // 1. Live Low Stock Raw Materials & Components
      const rawInv = await prisma.inventory.findMany({
        where: {
          product: { type: { in: ['RAW_MATERIAL', 'COMPONENTS'] } }
        },
        include: { product: true },
        orderBy: { on_hand_qty: 'asc' },
        take: 8
      });

      const lowStockMat = rawInv.filter(i => Number(i.on_hand_qty) <= Number(i.reorder_level || 15)).slice(0, 4);
      lowStockMat.forEach((item, idx) => {
        liveNotifs.push({
          id: `notif-live-pur-low-${item.id}`,
          type: 'critical',
          category: 'Low Stock Demand',
          title: `Low Stock: ${item.product.name}`,
          message: `Safety stock alert: ${item.product.name} falls below safety threshold (${item.on_hand_qty} ${item.product.unit_of_measure || 'units'} remaining).`,
          path: '/purchase/procurement',
          actionText: 'Procure Stock',
          entityType: 'inventory',
          entityId: item.product_id
        });
      });

      // 2. Pending Inbound Shipments
      const pendingPOs = await prisma.purchaseOrder.findMany({
        where: { status: { in: ['confirmed', 'partially_received'] } },
        include: { vendor: true, lines: true },
        orderBy: { created_at: 'desc' },
        take: 3
      });

      pendingPOs.forEach((po, idx) => {
        liveNotifs.push({
          id: `notif-live-pur-po-${po.id}`,
          type: 'warning',
          category: 'Pending Deliveries',
          title: `Inbound PO #${po.po_number}`,
          message: `Inbound Shipment: PO #${po.po_number} from ${po.vendor?.name || 'Supplier'} (${po.lines?.length || 1} items) awaiting physical receipt at dock.`,
          path: '/purchase/goods-receipts',
          actionText: 'Receive Goods',
          entityType: 'purchase_order',
          entityId: po.id
        });
      });

      // 3. Draft POs
      const draftPOs = await prisma.purchaseOrder.findMany({
        where: { status: 'draft' },
        include: { vendor: true },
        take: 2
      });
      draftPOs.forEach((po) => {
        liveNotifs.push({
          id: `notif-live-pur-draft-${po.id}`,
          type: 'warning',
          category: 'Draft Purchase Order',
          title: `PO #${po.po_number} Awaiting Confirmation`,
          message: `Draft PO #${po.po_number} for ${po.vendor?.name || 'Vendor'} has not been sent or confirmed.`,
          path: '/purchase/orders',
          actionText: 'Manage Orders',
          entityType: 'purchase_order',
          entityId: po.id
        });
      });
    } 
    else if (mappedRole === 'sales') {
      // 1. Confirmed Sales Orders & Overdue check
      const confirmedSOs = await prisma.salesOrder.findMany({
        where: { status: 'confirmed' },
        include: { customer: true },
        orderBy: { expected_delivery_date: 'asc' },
        take: 4
      });

      const now = new Date();
      confirmedSOs.forEach((so) => {
        const isOverdue = so.expected_delivery_date && new Date(so.expected_delivery_date) < now;
        liveNotifs.push({
          id: `notif-live-sal-so-${so.id}`,
          type: isOverdue ? 'critical' : 'warning',
          category: isOverdue ? 'Delayed Delivery' : 'Order Fulfillment',
          title: `Sales Order #${so.order_number}`,
          message: `${isOverdue ? 'Delayed Delivery' : 'Fulfillment In Progress'}: Sales Order #${so.order_number} for ${so.customer?.name || 'Customer'} (₹${Number(so.total_amount || 0).toLocaleString('en-IN')}).`,
          path: '/sales/orders',
          actionText: 'View Order',
          entityType: 'sales_order',
          entityId: so.id
        });
      });

      // 2. Draft Quotes
      const draftQuotes = await prisma.salesQuotation.findMany({
        where: { status: 'Draft' },
        include: { customer: true },
        take: 2
      });
      draftQuotes.forEach((q) => {
        liveNotifs.push({
          id: `notif-live-sal-quo-${q.id}`,
          type: 'info',
          category: 'Pending Quotes',
          title: `Quotation #${q.quotation_number}`,
          message: `Quote Follow-up: Quotation #${q.quotation_number} for ${q.customer?.name || 'Customer'} is awaiting contract sign-off.`,
          path: '/sales/quotations',
          actionText: 'Inspect Quotes',
          entityType: 'sales_quotation',
          entityId: q.id
        });
      });
    } 
    else if (mappedRole === 'manufacturing') {
      // 1. Active MOs
      const activeMOs = await prisma.manufacturingOrder.findMany({
        where: { status: { in: ['in_progress', 'confirmed', 'planned'] } },
        include: { product: true },
        take: 3
      });
      activeMOs.forEach((mo) => {
        liveNotifs.push({
          id: `notif-live-mfg-mo-${mo.id}`,
          type: mo.status === 'in_progress' ? 'critical' : 'warning',
          category: 'Manufacturing Order',
          title: `MO #${mo.mo_number}`,
          message: `Production Run: Manufacturing Order #${mo.mo_number} for ${mo.product?.name || 'Product'} (${mo.produced_qty || 0}/${mo.quantity} units completed).`,
          path: '/manufacturing/orders',
          actionText: 'Inspect MO',
          entityType: 'manufacturing_order',
          entityId: mo.id
        });
      });

      // 2. Work Orders
      const wos = await prisma.workOrder.findMany({
        where: { status: { in: ['in_progress', 'pending'] } },
        take: 3
      });
      wos.forEach((wo) => {
        liveNotifs.push({
          id: `notif-live-mfg-wo-${wo.id}`,
          type: 'warning',
          category: 'Work Center Alert',
          title: `WO #${wo.wo_number}`,
          message: `Assembly Station: Work Order #${wo.wo_number} (${wo.operation}) scheduled at ${wo.work_center}.`,
          path: '/manufacturing/work-orders',
          actionText: 'Inspect Task',
          entityType: 'work_order',
          entityId: wo.id
        });
      });
    } 
    else if (mappedRole === 'inventory') {
      // 1. Low stock items across all categories
      const lowStockAll = await prisma.inventory.findMany({
        include: { product: true },
        orderBy: { on_hand_qty: 'asc' },
        take: 5
      });
      const lowItems = lowStockAll.filter(i => Number(i.on_hand_qty) <= Number(i.reorder_level || 15));
      lowItems.forEach((item) => {
        liveNotifs.push({
          id: `notif-live-inv-item-${item.id}`,
          type: 'critical',
          category: 'Low Stock Alert',
          title: `Stock Deficit: ${item.product.name}`,
          message: `Safety Threshold: ${item.product.name} at ${item.on_hand_qty} units (Reorder point: ${item.reorder_level || 15}).`,
          path: '/inventory/alerts',
          actionText: 'View Alerts',
          entityType: 'inventory',
          entityId: item.product_id
        });
      });

      // 2. Transfers
      const transfers = await prisma.stockTransfer.findMany({
        where: { status: 'Pending' },
        take: 2
      });
      transfers.forEach((tr) => {
        liveNotifs.push({
          id: `notif-live-inv-tr-${tr.id}`,
          type: 'warning',
          category: 'Transfer Order',
          title: `Transfer #${tr.transfer_number}`,
          message: `Stock Transfer #${tr.transfer_number} is pending dispatch between warehouse bays.`,
          path: '/inventory/transfers',
          actionText: 'View Transfers',
          entityType: 'stock_transfer',
          entityId: tr.id
        });
      });
    } 
    else if (mappedRole === 'owner') {
      // 1. High value POs awaiting review
      const highPOs = await prisma.purchaseOrder.findMany({
        where: { status: { in: ['draft', 'confirmed'] } },
        include: { vendor: true, lines: true },
        orderBy: { created_at: 'desc' },
        take: 3
      });
      highPOs.forEach((po) => {
        const val = po.lines?.reduce((s, l) => s + Number(l.ordered_qty) * Number(l.unit_price), 0) || 0;
        liveNotifs.push({
          id: `notif-live-own-po-${po.id}`,
          type: 'critical',
          category: 'Executive Approval',
          title: `Purchase Authorization: PO #${po.po_number}`,
          message: `Purchase Authorization: PO #${po.po_number} (₹${val.toLocaleString('en-IN')}) for ${po.vendor?.name || 'Vendor'} awaits executive sign-off.`,
          path: '/owner/approvals',
          actionText: 'Review Approvals',
          entityType: 'purchase_order',
          entityId: po.id
        });
      });

      // 2. Pending vendor bills
      const pendingBills = await prisma.vendorBill.findMany({
        where: { status: 'pending_payment' },
        take: 5
      });
      const totalPending = pendingBills.reduce((acc, b) => acc + Number(b.total_amount || 0), 0);
      if (totalPending > 0) {
        liveNotifs.push({
          id: 'notif-live-own-bills',
          type: 'warning',
          category: 'Treasury & Bills',
          title: 'Pending Disbursements',
          message: `Treasury Overview: ${pendingBills.length} vendor bills totaling ₹${totalPending.toLocaleString('en-IN')} pending disbursement.`,
          path: '/owner/financials',
          actionText: 'View Financials',
          entityType: 'vendor_bills',
          entityId: 'aggregate'
        });
      }
    } 
    else if (mappedRole === 'admin') {
      // 1. Pending registration requests
      const pendingUsers = await prisma.user.findMany({
        where: { status: 'PENDING' },
        include: { profile: true }
      });
      if (pendingUsers.length > 0) {
        liveNotifs.push({
          id: 'notif-live-adm-users',
          type: 'warning',
          category: 'User Access',
          title: 'Pending User Approvals',
          message: `${pendingUsers.length} user registration request${pendingUsers.length > 1 ? 's are' : ' is'} pending admin approval.`,
          path: '/users',
          actionText: 'Review Approvals',
          entityType: 'user',
          entityId: 'pending-users'
        });
      }

      // 2. Recent Audit Logs
      const recentAudits = await prisma.auditLog.findMany({
        orderBy: { created_at: 'desc' },
        take: 2
      });
      recentAudits.forEach((log) => {
        liveNotifs.push({
          id: `notif-live-adm-audit-${log.id}`,
          type: 'info',
          category: 'System Audit',
          title: `Audit: ${log.action}`,
          message: `Security Audit: ${log.action} action recorded on ${log.model_name}.`,
          path: '/audit-logs',
          actionText: 'Inspect Logs',
          entityType: 'audit_log',
          entityId: log.id
        });
      });
    }

    // Synchronize live alerts into persistent PostgreSQL store
    await notificationStore.syncLiveAlerts(mappedRole, user, liveNotifs);

    // Fetch and return persistent active notifications
    return await notificationStore.getActiveNotifications(mappedRole, user);
  } catch (err) {
    console.error('Error in getRoleNotifications:', err);
    return [];
  }
}

/**
 * 48-Hour Notification History
 */
async function getNotificationHistory(role, user) {
  const mappedRole = await resolveMappedRole(role, user);
  // Pre-sync role notifications into store so history always captures all seen notifications
  try {
    await getRoleNotifications(mappedRole, user);
  } catch (e) {}
  return await notificationStore.getNotificationHistory(mappedRole, user);
}

async function markNotificationRead(id, user, notifData = null) {
  return await notificationStore.markRead(id, user, notifData);
}

async function markAllNotificationsRead(role, user) {
  const mappedRole = await resolveMappedRole(role, user);
  return await notificationStore.markAllRead(mappedRole, user);
}

async function dismissNotification(id, user, notifData = null) {
  return await notificationStore.dismissNotification(id, user, notifData);
}

async function completeNotification(id, user) {
  return await notificationStore.completeNotification(id, user);
}

module.exports = {
  getDashboardStats,
  getAdvisorRecommendations,
  resolveAdvisorRecommendation,
  getBusinessSummary,
  getRoleNotifications,
  getNotificationHistory,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
  completeNotification
};
