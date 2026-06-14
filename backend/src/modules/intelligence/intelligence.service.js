const prisma = require('../../config/db');

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

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function getAdvisorRecommendations() {
  // 1. Gather live ERP data from DB
  const allInventory = await prisma.inventory.findMany({ include: { product: true } });
  const lowStockItems = allInventory
    .filter(i => Number(i.on_hand_qty) < Number(i.reorder_level))
    .slice(0, 5);

  const pendingMOs = await prisma.manufacturingOrder.findMany({
    where: { status: 'in_progress' },
    include: { product: true },
    take: 5
  });

  const overdueDeliveries = await prisma.salesOrder.findMany({
    where: { status: 'confirmed', expected_delivery_date: { lt: new Date() } },
    include: { customer: true },
    take: 5
  });

  const apiKey = process.env.GEMINI_API_KEY;
  const hasValidKey = apiKey && apiKey.trim().length > 10 && !apiKey.includes('your-') && !apiKey.includes('dummy');

  // 2. Try Gemini AI if we have a key
  if (hasValidKey) {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey.trim());
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are an AI business advisor for an ERP system called Nexus ERP. Analyze the following real operational data and return EXACTLY 3 actionable business recommendations.

LIVE DATA:
- Low Stock Items (on_hand < reorder_level): ${lowStockItems.length} items${lowStockItems.length > 0 ? ' — ' + lowStockItems.map(i => `${i.product.name} (stock: ${i.on_hand_qty}, reorder at: ${i.reorder_level})`).join('; ') : ''}
- Manufacturing Orders In Progress: ${pendingMOs.length}${pendingMOs.length > 0 ? ' — ' + pendingMOs.map(m => m.product.name).join(', ') : ''}
- Overdue Sales Deliveries (confirmed but past delivery date): ${overdueDeliveries.length}${overdueDeliveries.length > 0 ? ' — customers: ' + overdueDeliveries.map(o => o.customer.name).join(', ') : ''}

Return ONLY a valid JSON array (no markdown, no explanation) with exactly 3 objects:
[
  {"priority": "High Priority", "title": "...", "description": "...", "action_label": "..."},
  {"priority": "Medium", "title": "...", "description": "...", "action_label": "..."},
  {"priority": "Low", "title": "...", "description": "...", "action_label": "..."}
]`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      // Strip markdown code fences if present
      const jsonText = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log('✅ EN Advisor: Gemini AI recommendations generated successfully');
        return parsed;
      }
    } catch (aiError) {
      console.warn('⚠️ EN Advisor: Gemini failed, using smart rules fallback. Error:', aiError.message);
    }
  }

  // 3. Smart rule-based fallback (works without API key)
  console.log('ℹ️ EN Advisor: Generating rule-based recommendations');
  const recommendations = [];

  if (lowStockItems.length > 0) {
    recommendations.push({
      priority: 'High Priority',
      title: 'Urgent Procurement Required',
      description: `${lowStockItems.length} item(s) are below reorder level: ${lowStockItems.map(i => i.product.name).join(', ')}. Raise purchase orders immediately to prevent stockouts.`,
      action_label: 'Create PO'
    });
  } else {
    recommendations.push({
      priority: 'Low',
      title: 'Inventory Health Good',
      description: 'All products are above their reorder levels. Review max stock levels to optimize working capital.',
      action_label: 'View Inventory'
    });
  }

  if (pendingMOs.length > 0) {
    recommendations.push({
      priority: 'Medium',
      title: `${pendingMOs.length} Active Manufacturing Order(s)`,
      description: `Production in progress for: ${pendingMOs.map(m => m.product.name).join(', ')}. Monitor work centers to ensure on-time completion.`,
      action_label: 'View Work Orders'
    });
  } else {
    recommendations.push({
      priority: 'Low',
      title: 'No Active Production',
      description: 'Manufacturing floor is idle. Review pending sales orders to schedule new production runs.',
      action_label: 'Start MO'
    });
  }

  if (overdueDeliveries.length > 0) {
    recommendations.push({
      priority: 'High Priority',
      title: `${overdueDeliveries.length} Overdue Delivery(s)`,
      description: `Orders for ${overdueDeliveries.map(o => o.customer.name).join(', ')} are past their expected delivery date. Contact customers and update schedules.`,
      action_label: 'View Orders'
    });
  } else {
    recommendations.push({
      priority: 'Low',
      title: 'All Deliveries On Track',
      description: 'No overdue deliveries. Good time to analyze conversion rates and plan future sales campaigns.',
      action_label: 'View Analytics'
    });
  }

  return recommendations;
}

async function getBusinessSummary() {
  const stats = await getDashboardStats();

  const apiKey = process.env.GEMINI_API_KEY;
  const hasValidKey = apiKey && apiKey.trim().length > 10 && !apiKey.includes('your-') && !apiKey.includes('dummy') && !apiKey.includes('AIza...');

  if (hasValidKey) {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
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

module.exports = {
  getDashboardStats,
  getAdvisorRecommendations,
  getBusinessSummary
};
