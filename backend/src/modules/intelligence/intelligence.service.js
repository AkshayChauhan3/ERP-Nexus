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

/**
 * Resolve authenticated user's role mapping accurately
 */
async function resolveMappedRole(role, user) {
  let mappedRole = (role || user?.role || '').toLowerCase().trim();

  if (user?.id && (!mappedRole || mappedRole === 'user' || mappedRole === 'null')) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { profile: true, module_access: { include: { module: true } } }
      });
      if (dbUser) {
        if (dbUser.is_admin) mappedRole = 'admin';
        else if (dbUser.login_id === 'owner') mappedRole = 'owner';
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

  return mappedRole || 'admin';
}

/**
 * Role-Based EN Advisor Recommendations
 * Analyzes live database data, queries Gemini if key exists, and provides
 * actionable payloads (e.g. prefilled PO creation) while filtering resolved tasks.
 */
async function getAdvisorRecommendations(role, user) {
  const mappedRole = await resolveMappedRole(role, user);
  const now = new Date();

  // 1. Gather live operational data for the current role
  const allInventory = await prisma.inventory.findMany({
    include: { product: true },
    orderBy: { on_hand_qty: 'asc' }
  });

  const lowStockItems = allInventory
    .filter(i => Number(i.on_hand_qty) < Number(i.reorder_level))
    .slice(0, 8);

  const pendingMOs = await prisma.manufacturingOrder.findMany({
    where: { status: { in: ['in_progress', 'confirmed'] } },
    include: { product: true, work_orders: true },
    orderBy: { created_at: 'desc' },
    take: 6
  });

  const overdueDeliveries = await prisma.salesOrder.findMany({
    where: { status: 'confirmed', expected_delivery_date: { lt: now } },
    include: { customer: true, lines: { include: { product: true } } },
    take: 6
  });

  const defaultVendor = await prisma.vendor.findFirst({
    where: { is_active: true },
    orderBy: { created_at: 'asc' }
  });

  // 2. Build candidate recommendations based on the authenticated role
  let rawCandidates = [];

  if (mappedRole === 'purchase' || mappedRole === 'inventory') {
    // A. Low stock procurement recommendations (Action: Create PO)
    for (const item of lowStockItems) {
      const recKey = `rec-pur-low-${item.product_id}`;
      const isResolved = await notificationStore.isAdvisorRecommendationResolved(recKey, mappedRole);
      if (!isResolved) {
        const suggestedQty = Math.max(
          Math.ceil(Number(item.reorder_level || 15) * 2 - Number(item.on_hand_qty || 0)),
          10
        );
        rawCandidates.push({
          id: recKey,
          priority: 'High Priority',
          title: `Urgent Procurement: ${item.product.name}`,
          description: `Stock has fallen to ${item.on_hand_qty} ${item.product.unit_of_measure || 'units'} (safety threshold: ${item.reorder_level || 15}). Generate a purchase order now to prevent stockouts.`,
          action_label: 'Create PO',
          action_type: 'CREATE_PO',
          action_payload: {
            productId: item.product_id,
            productName: item.product.name,
            vendorId: defaultVendor?.id || null,
            vendorName: defaultVendor?.name || 'Primary Supplier',
            suggestedQty,
            costPrice: Number(item.product.cost_price || 250),
            unit: item.product.unit_of_measure || 'units'
          }
        });
      }
    }

    // B. Pending Inbound Shipments
    const pendingPOs = await prisma.purchaseOrder.findMany({
      where: { status: 'confirmed' },
      include: { vendor: true, lines: true },
      take: 2
    });
    for (const po of pendingPOs) {
      const recKey = `rec-pur-po-${po.id}`;
      const isResolved = await notificationStore.isAdvisorRecommendationResolved(recKey, mappedRole);
      if (!isResolved) {
        rawCandidates.push({
          id: recKey,
          priority: 'Medium',
          title: `Inspect Inbound PO #${po.po_number}`,
          description: `Shipment from ${po.vendor?.name || 'Vendor'} (${po.lines?.length || 1} items) is in transit. Verify loading dock readiness for goods receipt.`,
          action_label: 'View Goods Receipts',
          action_type: 'NAVIGATE',
          action_payload: {
            targetPath: '/purchase/goods-receipts'
          }
        });
      }
    }

    // C. Healthy State Fallback
    if (rawCandidates.length === 0) {
      rawCandidates.push({
        id: 'rec-pur-healthy',
        priority: 'Low',
        title: 'Inventory & Procurement In Balance',
        description: 'All raw materials and components are safely above minimum reorder points. Good time to review vendor pricing contracts.',
        action_label: 'View Catalog',
        action_type: 'NAVIGATE',
        action_payload: { targetPath: '/purchase/materials' }
      });
    }
  } 
  else if (mappedRole === 'manufacturing') {
    // A. Active Manufacturing Orders in progress
    for (const mo of pendingMOs) {
      const recKey = `rec-mfg-mo-${mo.id}`;
      const isResolved = await notificationStore.isAdvisorRecommendationResolved(recKey, mappedRole);
      if (!isResolved) {
        const isDelayed = mo.status === 'in_progress' && Number(mo.produced_qty) < Number(mo.quantity) / 2;
        rawCandidates.push({
          id: recKey,
          priority: isDelayed ? 'High Priority' : 'Medium',
          title: `Production Run: MO #${mo.mo_number} (${mo.product?.name || 'Product'})`,
          description: `Output currently at ${mo.produced_qty || 0}/${mo.quantity} units. Ensure work centers maintain scheduled cycle time to prevent assembly lag.`,
          action_label: 'View Work Orders',
          action_type: 'VIEW_WORK_ORDERS',
          action_payload: {
            targetPath: '/manufacturing/work-orders',
            moId: mo.id,
            moNumber: mo.mo_number
          }
        });
      }
    }

    // B. Work Center alerts
    const activeWOs = await prisma.workOrder.findMany({
      where: { status: 'in_progress' },
      take: 2
    });
    for (const wo of activeWOs) {
      const recKey = `rec-mfg-wo-${wo.id}`;
      const isResolved = await notificationStore.isAdvisorRecommendationResolved(recKey, mappedRole);
      if (!isResolved) {
        rawCandidates.push({
          id: recKey,
          priority: 'Medium',
          title: `Work Center: ${wo.work_center}`,
          description: `Work order #${wo.wo_number} (${wo.operation}) is active on the factory floor. Monitor machine run time and operator throughput.`,
          action_label: 'Inspect Work Centers',
          action_type: 'NAVIGATE',
          action_payload: { targetPath: '/manufacturing/work-centers' }
        });
      }
    }

    // C. Healthy Fallback
    if (rawCandidates.length === 0) {
      rawCandidates.push({
        id: 'rec-mfg-healthy',
        priority: 'Low',
        title: 'Factory Line Running Smoothly',
        description: 'All work centers are operating within standard parameters. Review upcoming production schedules or inspect BOM revisions.',
        action_label: 'View BOMs',
        action_type: 'NAVIGATE',
        action_payload: { targetPath: '/manufacturing/bom' }
      });
    }
  } 
  else if (mappedRole === 'sales') {
    // A. Overdue Deliveries
    for (const so of overdueDeliveries) {
      const recKey = `rec-sal-overdue-${so.id}`;
      const isResolved = await notificationStore.isAdvisorRecommendationResolved(recKey, mappedRole);
      if (!isResolved) {
        rawCandidates.push({
          id: recKey,
          priority: 'High Priority',
          title: `Overdue Delivery: SO #${so.order_number}`,
          description: `Sales Order #${so.order_number} for customer ${so.customer?.name || 'Client'} has surpassed its expected delivery date. Follow up with logistics or customer.`,
          action_label: 'Inspect Deliveries',
          action_type: 'NAVIGATE',
          action_payload: { targetPath: '/sales/deliveries' }
        });
      }
    }

    // B. Draft Quotations pending signoff
    const draftQuotes = await prisma.salesQuotation.findMany({
      where: { status: 'Draft' },
      include: { customer: true },
      take: 2
    });
    for (const q of draftQuotes) {
      const recKey = `rec-sal-quote-${q.id}`;
      const isResolved = await notificationStore.isAdvisorRecommendationResolved(recKey, mappedRole);
      if (!isResolved) {
        rawCandidates.push({
          id: recKey,
          priority: 'Medium',
          title: `Quote Follow-up: #${q.quotation_number}`,
          description: `Quotation for ${q.customer?.name || 'Customer'} (₹${Number(q.amount).toLocaleString('en-IN')}) is awaiting customer acceptance. Initiate sales follow-up.`,
          action_label: 'Review Quotations',
          action_type: 'NAVIGATE',
          action_payload: { targetPath: '/sales/quotations' }
        });
      }
    }

    // C. Healthy Fallback
    if (rawCandidates.length === 0) {
      rawCandidates.push({
        id: 'rec-sal-healthy',
        priority: 'Low',
        title: 'Sales Deliveries On Track',
        description: 'No overdue orders or critical fulfillment bottlenecks. Great window to review revenue conversion metrics and plan future campaigns.',
        action_label: 'View Analytics',
        action_type: 'VIEW_ANALYTICS',
        action_payload: { targetPath: '/sales/analytics' }
      });
    }
  } 
  else {
    // Business Owner / Admin: Cross-stream strategic insights
    // 1. Critical Procurement
    if (lowStockItems.length > 0) {
      const topLow = lowStockItems[0];
      const recKey = `rec-own-low-${topLow.product_id}`;
      const isResolved = await notificationStore.isAdvisorRecommendationResolved(recKey, mappedRole);
      if (!isResolved) {
        rawCandidates.push({
          id: recKey,
          priority: 'High Priority',
          title: 'Urgent Procurement Required',
          description: `${lowStockItems.length} item(s) below reorder level (${lowStockItems.slice(0, 3).map(i => i.product.name).join(', ')}). Authorize purchase orders immediately to avoid production stops.`,
          action_label: 'Create PO',
          action_type: 'CREATE_PO',
          action_payload: {
            productId: topLow.product_id,
            productName: topLow.product.name,
            vendorId: defaultVendor?.id || null,
            vendorName: defaultVendor?.name || 'Primary Supplier',
            suggestedQty: Math.max(Math.ceil(Number(topLow.reorder_level || 15) * 2 - Number(topLow.on_hand_qty || 0)), 15),
            costPrice: Number(topLow.product.cost_price || 250),
            unit: topLow.product.unit_of_measure || 'units'
          }
        });
      }
    }

    // 2. Active Manufacturing Orders
    if (pendingMOs.length > 0) {
      const recKey = `rec-own-mos`;
      const isResolved = await notificationStore.isAdvisorRecommendationResolved(recKey, mappedRole);
      if (!isResolved) {
        rawCandidates.push({
          id: recKey,
          priority: 'Medium',
          title: `${pendingMOs.length} Active Manufacturing Order(s)`,
          description: `Production active for: ${pendingMOs.slice(0, 4).map(m => m.product?.name).filter(Boolean).join(', ')}. Monitor work center utilization to maintain factory output commitments.`,
          action_label: 'View Work Orders',
          action_type: 'VIEW_WORK_ORDERS',
          action_payload: { targetPath: mappedRole === 'owner' ? '/owner/manufacturing' : '/manufacturing/work-orders' }
        });
      }
    }

    // 3. Deliveries & Revenue
    if (overdueDeliveries.length > 0) {
      const recKey = `rec-own-overdue`;
      const isResolved = await notificationStore.isAdvisorRecommendationResolved(recKey, mappedRole);
      if (!isResolved) {
        rawCandidates.push({
          id: recKey,
          priority: 'High Priority',
          title: `${overdueDeliveries.length} Overdue Delivery Commitment(s)`,
          description: `Orders for ${overdueDeliveries.slice(0, 3).map(o => o.customer?.name).join(', ')} are past expected delivery date. Inspect fulfillment blockers.`,
          action_label: 'View Analytics',
          action_type: 'VIEW_ANALYTICS',
          action_payload: { targetPath: mappedRole === 'owner' ? '/owner/sales' : '/sales/analytics' }
        });
      }
    } else {
      rawCandidates.push({
        id: 'rec-own-ontrack',
        priority: 'Low',
        title: 'All Deliveries On Track',
        description: 'Zero overdue deliveries across client accounts. Analyze conversion rates and capital allocation to plan future expansion.',
        action_label: 'View Analytics',
        action_type: 'VIEW_ANALYTICS',
        action_payload: { targetPath: mappedRole === 'owner' ? '/owner/financials' : '/reports' }
      });
    }
  }

  // Limit to at most 3 top actionable recommendations
  const finalRecs = rawCandidates.slice(0, 3);

  // 3. Try Gemini AI if a valid API key exists
  const apiKey = process.env.GEMINI_API_KEY;
  const hasValidKey = apiKey && apiKey.trim().length > 10 && !apiKey.includes('your-') && !apiKey.includes('dummy');

  if (hasValidKey && finalRecs.length > 0) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey.trim());
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are an autonomous AI executive advisor for Nexus ERP.
The currently logged-in user role is: "${mappedRole}".
Analyze the following operational data and synthesize updated recommendations matching the user's role and responsibilities.

CURRENT OPERATIONAL DATA:
${JSON.stringify(finalRecs, null, 2)}

INSTRUCTIONS:
1. Retain the existing 'id', 'action_label', 'action_type', and 'action_payload' fields exactly as provided for functional execution.
2. Polish 'title' and 'description' to provide crisp, professional, role-relevant insights.
3. Return ONLY a valid JSON array of objects with keys: id, priority, title, description, action_label, action_type, action_payload.
4. No markdown fences, no explanatory text.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const jsonText = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      const parsed = JSON.parse(jsonText);

      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`✅ EN Advisor: Gemini AI generated ${parsed.length} recommendations for role: ${mappedRole}`);
        // Ensure action payloads are retained
        return parsed.map((p, idx) => ({
          ...finalRecs[idx],
          ...p,
          action_payload: finalRecs[idx]?.action_payload || p.action_payload
        }));
      }
    } catch (aiErr) {
      console.warn('⚠️ EN Advisor: Gemini AI scan failed, using smart live heuristic recommendations. Error:', aiErr.message);
    }
  }

  return finalRecs;
}

/**
 * Mark an EN Advisor recommendation as resolved
 */
async function resolveAdvisorRecommendation(key, actionType, user) {
  const mappedRole = await resolveMappedRole(user?.role, user);
  const ok = await notificationStore.resolveAdvisorRecommendation(key, mappedRole, user, actionType);

  // If recommendation is tied to low stock, auto-resolve matching inventory notifications
  if (key && key.includes('rec-pur-low-')) {
    const productId = key.replace('rec-pur-low-', '');
    await notificationStore.resolveByEntity('inventory', productId);
  }

  return ok;
}

async function getBusinessSummary() {
  const stats = await getDashboardStats();

  const apiKey = process.env.GEMINI_API_KEY;
  const hasValidKey = apiKey && apiKey.trim().length > 10 && !apiKey.includes('your-') && !apiKey.includes('dummy') && !apiKey.includes('AIza...');

  if (hasValidKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey.trim());
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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

      const result = await model.generateContent(prompt);
      return result.response.text().trim();
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
