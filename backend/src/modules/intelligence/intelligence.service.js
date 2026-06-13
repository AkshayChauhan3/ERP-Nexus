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
    if (Number(inv.on_hand_qty) < Number(inv.product.reorder_level)) {
      lowStock++;
    }
  }

  // MO in progress
  const moInProgress = await prisma.manufacturingOrder.count({
    where: { status: 'in_progress' }
  });

  // Active Users
  const activeUsers = await prisma.user.count({
    where: { is_active: true }
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

module.exports = {
  getDashboardStats
};
