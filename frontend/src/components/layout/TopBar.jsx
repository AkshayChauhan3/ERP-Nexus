import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Bell, Search, ChevronDown, LogOut, X, Camera, Check,
  AlertCircle, AlertTriangle, Info, CheckCircle2, ArrowRight,
  Clock, FileText, Package, ShoppingCart, Factory, Warehouse,
  Users, TrendingUp, BarChart2, Zap, ShoppingBag
} from 'lucide-react';
import { api } from '../../utils/api';
import './TopBar.css';

const PAGE_TITLES = {
  // Admin & Base
  '/dashboard':       { breadcrumb: 'Home', title: 'Dashboard' },
  '/products':        { breadcrumb: 'Inventory', title: 'Products' },
  '/orders':          { breadcrumb: 'Sales', title: 'Orders' },
  '/new-sales-order': { breadcrumb: 'Sales → New Order', title: 'New Sales Order' },
  '/sales':           { breadcrumb: 'Operations', title: 'Sales Monitor' },
  '/purchase':        { breadcrumb: 'Operations', title: 'Purchase Monitor' },
  '/manufacturing':   { breadcrumb: 'Operations', title: 'Manufacturing Monitor' },
  '/inventory':       { breadcrumb: 'Operations', title: 'Inventory Monitor' },
  '/procurement':     { breadcrumb: 'Operations', title: 'Procurement Monitor' },
  '/users':           { breadcrumb: 'System', title: 'User Management' },
  '/audit-logs':      { breadcrumb: 'Compliance', title: 'Audit Logs' },
  '/reports':         { breadcrumb: 'Analytics', title: 'Reports' },
  '/advisor':         { breadcrumb: 'Intelligence', title: 'EN Advisor' },
  '/warehouse':       { breadcrumb: 'Operations', title: 'Warehouse' },
  '/logistics':       { breadcrumb: 'Operations', title: 'Logistics' },
  '/settings':        { breadcrumb: 'System', title: 'Settings' },
  '/notifications/history': { breadcrumb: 'System', title: 'Notification History' },

  // Purchase Module
  '/purchase/dashboard':      { breadcrumb: 'Procurement', title: 'Purchase & Inventory Operations' },
  '/purchase/vendors':        { breadcrumb: 'Procurement', title: 'Suppliers & Vendors' },
  '/purchase/materials':      { breadcrumb: 'Procurement', title: 'Raw Materials Catalog' },
  '/purchase/orders':         { breadcrumb: 'Procurement', title: 'Purchase Orders' },
  '/purchase/goods-receipts': { breadcrumb: 'Procurement', title: 'Inbound Goods Receipts' },
  '/purchase/vendor-bills':   { breadcrumb: 'Procurement', title: 'Vendor Bills & Invoices' },
  '/purchase/inventory':      { breadcrumb: 'Procurement', title: 'Raw Material Inventory' },
  '/purchase/procurement':    { breadcrumb: 'Procurement', title: 'Procurement Suggestions' },
  '/purchase/history':        { breadcrumb: 'Procurement', title: 'Purchase History' },
  '/purchase/reports':        { breadcrumb: 'Procurement', title: 'Procurement Reports' },

  // Sales Module
  '/sales/dashboard':   { breadcrumb: 'Sales', title: 'Sales Operations' },
  '/sales/customers':   { breadcrumb: 'Sales', title: 'Customer Accounts' },
  '/sales/quotations':  { breadcrumb: 'Sales', title: 'Sales Quotations' },
  '/sales/orders':      { breadcrumb: 'Sales', title: 'Customer Orders' },
  '/sales/deliveries':  { breadcrumb: 'Sales', title: 'Delivery Management' },
  '/sales/catalog':     { breadcrumb: 'Sales', title: 'Product Catalog' },
  '/sales/reserved':    { breadcrumb: 'Sales', title: 'Reserved Stock' },
  '/sales/history':     { breadcrumb: 'Sales', title: 'Sales History' },
  '/sales/reports':     { breadcrumb: 'Sales', title: 'Sales Reports' },
  '/sales/analytics':   { breadcrumb: 'Sales', title: 'Sales Analytics' },

  // Manufacturing Module
  '/manufacturing/dashboard':    { breadcrumb: 'Manufacturing', title: 'Production Operations' },
  '/manufacturing/bom':          { breadcrumb: 'Manufacturing', title: 'Bills of Materials' },
  '/manufacturing/orders':       { breadcrumb: 'Manufacturing', title: 'Manufacturing Orders' },
  '/manufacturing/work-orders':  { breadcrumb: 'Manufacturing', title: 'Work Orders' },
  '/manufacturing/work-centers': { breadcrumb: 'Manufacturing', title: 'Work Centers' },
  '/manufacturing/tracking':     { breadcrumb: 'Manufacturing', title: 'Production Tracking' },
  '/manufacturing/consumption':  { breadcrumb: 'Manufacturing', title: 'Inventory Consumption' },
  '/manufacturing/history':      { breadcrumb: 'Manufacturing', title: 'Production History' },
  '/manufacturing/reports':      { breadcrumb: 'Manufacturing', title: 'Manufacturing Reports' },

  // Inventory Module
  '/inventory/dashboard':   { breadcrumb: 'Inventory', title: 'Inventory Control' },
  '/inventory/overview':    { breadcrumb: 'Inventory', title: 'Stock Overview' },
  '/inventory/products':    { breadcrumb: 'Inventory', title: 'Product Inventory' },
  '/inventory/warehouses':  { breadcrumb: 'Inventory', title: 'Warehouses' },
  '/inventory/ledger':      { breadcrumb: 'Inventory', title: 'Stock Ledger' },
  '/inventory/transfers':   { breadcrumb: 'Inventory', title: 'Stock Transfers' },
  '/inventory/adjustments': { breadcrumb: 'Inventory', title: 'Stock Adjustments' },
  '/inventory/reserved':    { breadcrumb: 'Inventory', title: 'Reserved Stock' },
  '/inventory/alerts':      { breadcrumb: 'Inventory', title: 'Low Stock Alerts' },
  '/inventory/history':     { breadcrumb: 'Inventory', title: 'Inventory History' },
  '/inventory/reports':     { breadcrumb: 'Inventory', title: 'Inventory Reports' },

  // Owner Module
  '/owner/dashboard':     { breadcrumb: 'Executive', title: 'Owner Cockpit' },
  '/owner/overview':      { breadcrumb: 'Executive', title: 'Business Overview' },
  '/owner/approvals':     { breadcrumb: 'Executive', title: 'Approvals Center' },
  '/owner/financials':    { breadcrumb: 'Executive', title: 'Financial Summary' },
  '/owner/users':         { breadcrumb: 'Executive', title: 'User Management' },
  '/owner/employees':     { breadcrumb: 'Executive', title: 'Employee Activity' },
  '/owner/inventory':     { breadcrumb: 'Executive', title: 'Inventory Monitoring' },
  '/owner/sales':         { breadcrumb: 'Executive', title: 'Sales Monitoring' },
  '/owner/purchase':      { breadcrumb: 'Executive', title: 'Purchase Monitoring' },
  '/owner/manufacturing': { breadcrumb: 'Executive', title: 'Manufacturing Monitoring' },
  '/owner/notifications': { breadcrumb: 'Executive', title: 'Executive Notifications' },
  '/owner/reports':       { breadcrumb: 'Executive', title: 'Executive Reports' },
  '/owner/audit-logs':    { breadcrumb: 'Executive', title: 'Audit Logs' },
  '/owner/settings':      { breadcrumb: 'Executive', title: 'System Settings' },
};

const ROLE_LABELS = {
  admin: 'Admin',
  sales: 'Sales User',
  purchase: 'Purchase User',
  manufacturing: 'Manufacturing User',
  inventory: 'Inventory Manager',
  owner: 'Business Owner',
};

const ROLE_BADGE_STYLES = {
  purchase:      { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
  sales:         { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
  manufacturing: { bg: '#fef9c3', color: '#a16207', border: '#fef08a' },
  inventory:     { bg: '#f3e8ff', color: '#7e22ce', border: '#e9d5ff' },
  owner:         { bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
  admin:         { bg: '#f1f5f9', color: '#334155', border: '#e2e8f0' },
};

const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const resolveRoleRoute = (path, role) => {
  if (!path) return '/';
  if (role === 'owner') {
    if (path.startsWith('/owner/')) return path;
    if (path === '/dashboard') return '/owner/dashboard';
    if (path === '/products' || path === '/inventory') return '/owner/inventory';
    if (path === '/sales' || path === '/orders' || path === '/new-sales-order') return '/owner/sales';
    if (path === '/purchase') return '/owner/purchase';
    if (path === '/manufacturing') return '/owner/manufacturing';
    if (path === '/procurement') return '/owner/approvals';
    if (path === '/users') return '/owner/users';
    if (path === '/reports') return '/owner/reports';
    if (path === '/audit-logs') return '/owner/audit-logs';
  } else if (role === 'purchase') {
    if (path.startsWith('/purchase/')) return path;
    if (path === '/dashboard') return '/purchase/dashboard';
    if (path === '/procurement') return '/purchase/procurement';
    if (path === '/inventory') return '/purchase/inventory';
    if (path === '/purchase' || path === '/orders') return '/purchase/orders';
    if (path === '/reports') return '/purchase/reports';
    if (path === '/products') return '/purchase/materials';
    if (path === '/users' || path === '/sales' || path === '/manufacturing' || path === '/audit-logs') return '/purchase/dashboard';
  } else if (role === 'sales') {
    if (path.startsWith('/sales/')) return path;
    if (path === '/dashboard') return '/sales/dashboard';
    if (path === '/orders' || path === '/sales') return '/sales/orders';
    if (path === '/products') return '/sales/catalog';
    if (path === '/reports') return '/sales/reports';
    if (path === '/users' || path === '/purchase' || path === '/manufacturing' || path === '/audit-logs') return '/sales/dashboard';
  } else if (role === 'manufacturing') {
    if (path.startsWith('/manufacturing/')) return path;
    if (path === '/dashboard') return '/manufacturing/dashboard';
    if (path === '/manufacturing') return '/manufacturing/orders';
    if (path === '/reports') return '/manufacturing/reports';
    if (path === '/users' || path === '/sales' || path === '/purchase' || path === '/audit-logs') return '/manufacturing/dashboard';
  } else if (role === 'inventory') {
    if (path.startsWith('/inventory/')) return path;
    if (path === '/dashboard') return '/inventory/dashboard';
    if (path === '/inventory') return '/inventory/ledger';
    if (path === '/products') return '/inventory/products';
    if (path === '/reports') return '/inventory/reports';
    if (path === '/users' || path === '/sales' || path === '/purchase' || path === '/manufacturing' || path === '/audit-logs') return '/inventory/dashboard';
  }
  return path;
};

// ── Role-Specific Notification Presets ──
const ROLE_NOTIFICATIONS = {
  purchase: [
    {
      id: 'notif-pur-1',
      type: 'critical',
      category: 'Low Stock Demand',
      message: 'Low Stock: Oak Wood Sheets falls below safety threshold (15 units remaining).',
      time: '10m ago',
      path: '/purchase/procurement',
      actionText: 'Procure Stock',
      isRead: false
    },
    {
      id: 'notif-pur-2',
      type: 'warning',
      category: 'Vendor Delay',
      message: 'Vendor Delay: PO #3029 for Steel Screws has not been confirmed by vendor.',
      time: '1h ago',
      path: '/purchase/orders',
      actionText: 'Track Order',
      isRead: false
    },
    {
      id: 'notif-pur-3',
      type: 'warning',
      category: 'Pending Deliveries',
      message: 'Inbound Shipment: 16 POs are waiting for physical goods receipts at the loading dock.',
      time: '2h ago',
      path: '/purchase/goods-receipts',
      actionText: 'Receive Goods',
      isRead: false
    },
    {
      id: 'notif-pur-4',
      type: 'info',
      category: 'Vendor Bills',
      message: 'Pending Invoices: 18 vendor bills awaiting three-way match verification and payment.',
      time: '4h ago',
      path: '/purchase/vendor-bills',
      actionText: 'Review Bills',
      isRead: true
    },
    {
      id: 'notif-pur-5',
      type: 'info',
      category: 'Supplier Catalog',
      message: 'Supplier Update: Apex Raw Materials updated contract pricing for Steel Bars.',
      time: '1d ago',
      path: '/purchase/vendors',
      actionText: 'View Vendors',
      isRead: true
    }
  ],
  sales: [
    {
      id: 'notif-sal-1',
      type: 'critical',
      category: 'Delayed Delivery',
      message: 'Delayed Delivery: Sales Order #1048 for Sterling Offices is 2 days overdue.',
      time: '30m ago',
      path: '/sales/orders',
      actionText: 'View Order',
      isRead: false
    },
    {
      id: 'notif-sal-2',
      type: 'warning',
      category: 'Pending Quotes',
      message: 'Quote Follow-up: 3 client quotations awaiting customer contract sign-off.',
      time: '2h ago',
      path: '/sales/quotations',
      actionText: 'Inspect Quotes',
      isRead: false
    },
    {
      id: 'notif-sal-3',
      type: 'info',
      category: 'Ready for Dispatch',
      message: 'Dispatch Ready: Sales Order #1042 packaged and staged for carrier pickup.',
      time: '3h ago',
      path: '/sales/deliveries',
      actionText: 'View Deliveries',
      isRead: false
    },
    {
      id: 'notif-sal-4',
      type: 'info',
      category: 'Customer Accounts',
      message: 'Account Onboarded: Apex Furnishings activated with ₹10,00,000 credit limit.',
      time: '1d ago',
      path: '/sales/customers',
      actionText: 'View Customers',
      isRead: true
    }
  ],
  manufacturing: [
    {
      id: 'notif-mfg-1',
      type: 'critical',
      category: 'Delayed MO',
      message: 'Delayed MO: Manufacturing Order #2041 delayed at Painting center.',
      time: '15m ago',
      path: '/manufacturing/orders',
      actionText: 'Inspect MO',
      isRead: false
    },
    {
      id: 'notif-mfg-2',
      type: 'warning',
      category: 'Work Center Alert',
      message: 'High Capacity: Assembly Line #2 reached 94% scheduled utilization.',
      time: '1h ago',
      path: '/manufacturing/work-centers',
      actionText: 'Inspect Load',
      isRead: false
    },
    {
      id: 'notif-mfg-3',
      type: 'warning',
      category: 'Inv Consumption',
      message: 'Material Draw: Work Order #302 requires additional raw steel brackets.',
      time: '3h ago',
      path: '/manufacturing/consumption',
      actionText: 'Check Stock',
      isRead: false
    },
    {
      id: 'notif-mfg-4',
      type: 'info',
      category: 'Engineering BOM',
      message: 'BOM Revision: Executive Oak Desk BOM v2.4 finalized for mass production.',
      time: '1d ago',
      path: '/manufacturing/bom',
      actionText: 'View BOM',
      isRead: true
    }
  ],
  inventory: [
    {
      id: 'notif-inv-1',
      type: 'critical',
      category: 'Low Stock Alert',
      message: 'Safety Threshold: 14 inventory SKUs below minimum reorder points.',
      time: '20m ago',
      path: '/inventory/alerts',
      actionText: 'View Alerts',
      isRead: false
    },
    {
      id: 'notif-inv-2',
      type: 'warning',
      category: 'Transfer Order',
      message: 'Stock In-Transit: Transfer #TR-802 awaiting receipt at Central Bay.',
      time: '2h ago',
      path: '/inventory/transfers',
      actionText: 'View Transfers',
      isRead: false
    },
    {
      id: 'notif-inv-3',
      type: 'info',
      category: 'Stock Adjustments',
      message: 'Cycle Count: Warehouse B physical inventory audit reconciled successfully.',
      time: '5h ago',
      path: '/inventory/adjustments',
      actionText: 'View Ledger',
      isRead: true
    }
  ],
  owner: [
    {
      id: 'notif-own-1',
      type: 'critical',
      category: 'Executive Approval',
      message: 'Purchase Order Authorization: PO #3031 (₹3,20,000) awaits Owner sign-off.',
      time: '10m ago',
      path: '/owner/approvals',
      actionText: 'Review Approvals',
      isRead: false
    },
    {
      id: 'notif-own-2',
      type: 'warning',
      category: 'Treasury & Bills',
      message: 'Vendor Invoices: 18 vendor payments due this week totaling ₹43,86,350.',
      time: '2h ago',
      path: '/owner/financials',
      actionText: 'View Financials',
      isRead: false
    },
    {
      id: 'notif-own-3',
      type: 'info',
      category: 'Revenue Performance',
      message: 'Sales Target: Monthly gross revenue achieved at 108% of target.',
      time: '1d ago',
      path: '/owner/sales',
      actionText: 'View Sales',
      isRead: true
    }
  ],
  admin: [
    {
      id: 'notif-adm-1',
      type: 'critical',
      category: 'Security Alert',
      message: 'Audit Log: Security configuration verified. Zero permission violations.',
      time: '15m ago',
      path: '/audit-logs',
      actionText: 'Inspect Logs',
      isRead: false
    },
    {
      id: 'notif-adm-2',
      type: 'info',
      category: 'Cloud Database',
      message: 'Supabase PostgreSQL connected successfully. Factory tables live.',
      time: 'Just now',
      path: '/dashboard',
      actionText: 'System Status',
      isRead: true
    }
  ]
};

// ── Role-Specific Search Catalog ──
const getNavSearchItems = (role) => {
  if (role === 'purchase') {
    return [
      { id: 'pur-dash', title: 'Purchase Dashboard', desc: 'Procurement metrics, supplier performance, and spending summary', path: '/purchase/dashboard', category: 'Procurement', icon: TrendingUp },
      { id: 'pur-sugg', title: 'Procurement Suggestions', desc: 'Automated raw material demand & reorder calculations', path: '/purchase/procurement', category: 'Quick Operations', icon: FileText },
      { id: 'pur-ord', title: 'Purchase Orders', desc: 'Create, confirm, and track vendor purchase orders', path: '/purchase/orders', category: 'Procurement', icon: ShoppingBag },
      { id: 'pur-gr', title: 'Goods Receipts', desc: 'Receive deliveries, warehouse check-in & three-way match', path: '/purchase/goods-receipts', category: 'Procurement', icon: Package },
      { id: 'pur-vb', title: 'Vendor Bills', desc: 'Accounts payable, vendor invoice entry & due status', path: '/purchase/vendor-bills', category: 'Procurement', icon: FileText },
      { id: 'pur-ven', title: 'Suppliers & Vendors', desc: 'Vendor directory, contact details & payment terms', path: '/purchase/vendors', category: 'Procurement', icon: Users },
      { id: 'pur-mat', title: 'Raw Materials Catalog', desc: 'Raw material specifications, standard costs & supplier link', path: '/purchase/materials', category: 'Procurement', icon: Package },
      { id: 'pur-inv', title: 'Raw Material Inventory', desc: 'Live on-hand quantities, safety stock levels & reorders', path: '/purchase/inventory', category: 'Procurement', icon: Warehouse },
      { id: 'advisor', title: 'EN Advisor', desc: 'AI-powered bottleneck detection & procurement recommendations', path: '/advisor', category: 'Intelligence', icon: Zap },
      { id: 'pur-rep', title: 'Procurement Reports', desc: 'Supplier spend analytics, delivery lead times & price history', path: '/purchase/reports', category: 'Analytics', icon: BarChart2 },
    ];
  }

  if (role === 'sales') {
    return [
      { id: 'sal-dash', title: 'Sales Dashboard', desc: 'Order bookings, fulfillment pipeline & dispatch metrics', path: '/sales/dashboard', category: 'Sales', icon: TrendingUp },
      { id: 'sal-ord', title: 'Sales Orders', desc: 'Customer sales orders, status tracking & confirmation', path: '/sales/orders', category: 'Sales', icon: ShoppingCart },
      { id: 'sal-quo', title: 'Quotations', desc: 'Draft price quotes, customer proposals & conversion', path: '/sales/quotations', category: 'Sales', icon: FileText },
      { id: 'sal-del', title: 'Delivery Management', desc: 'Order dispatches, delivery notes & shipment tracking', path: '/sales/deliveries', category: 'Sales', icon: Package },
      { id: 'sal-cus', title: 'Customer Accounts', desc: 'Client directory, credit limits & contact information', path: '/sales/customers', category: 'Sales', icon: Users },
      { id: 'sal-cat', title: 'Product Catalog', desc: 'Finished goods, pricing sheets & inventory availability', path: '/sales/catalog', category: 'Sales', icon: Package },
      { id: 'advisor', title: 'EN Advisor', desc: 'AI-powered sales insights & demand forecasts', path: '/advisor', category: 'Intelligence', icon: Zap },
      { id: 'sal-rep', title: 'Sales Reports', desc: 'Revenue analysis, customer margins & sales trend breakdown', path: '/sales/reports', category: 'Analytics', icon: BarChart2 },
    ];
  }

  if (role === 'manufacturing') {
    return [
      { id: 'mfg-dash', title: 'Manufacturing Dashboard', desc: 'Production capacity, active work centers & shop floor output', path: '/manufacturing/dashboard', category: 'Manufacturing', icon: TrendingUp },
      { id: 'mfg-bom', title: 'Bills of Materials', desc: 'Component structures, routing steps & assembly costs', path: '/manufacturing/bom', category: 'Manufacturing', icon: FileText },
      { id: 'mfg-mo', title: 'Manufacturing Orders', desc: 'Planned, in-progress, and completed production runs', path: '/manufacturing/orders', category: 'Manufacturing', icon: Factory },
      { id: 'mfg-wo', title: 'Work Orders', desc: 'Step-by-step assembly tickets for factory operators', path: '/manufacturing/work-orders', category: 'Manufacturing', icon: Package },
      { id: 'mfg-wc', title: 'Work Centers', desc: 'Machine stations, tooling health & hourly cost rates', path: '/manufacturing/work-centers', category: 'Manufacturing', icon: Factory },
      { id: 'advisor', title: 'EN Advisor', desc: 'AI-driven production schedule optimization', path: '/advisor', category: 'Intelligence', icon: Zap },
      { id: 'mfg-rep', title: 'Manufacturing Reports', desc: 'Scrap rate analytics, OEE metrics & labor productivity', path: '/manufacturing/reports', category: 'Analytics', icon: BarChart2 },
    ];
  }

  if (role === 'inventory') {
    return [
      { id: 'inv-dash', title: 'Inventory Dashboard', desc: 'Real-time stock valuation, turnover rate & warehouse overview', path: '/inventory/dashboard', category: 'Inventory', icon: TrendingUp },
      { id: 'inv-prod', title: 'Product Inventory', desc: 'Complete SKU inventory, warehouse bin locations & lot tracking', path: '/inventory/products', category: 'Inventory', icon: Package },
      { id: 'inv-ware', title: 'Warehouses', desc: 'Multi-location warehouse capacity & storage bay management', path: '/inventory/warehouses', category: 'Inventory', icon: Warehouse },
      { id: 'inv-ledg', title: 'Stock Ledger', desc: 'Double-entry inventory movements and audit logs', path: '/inventory/ledger', category: 'Inventory', icon: FileText },
      { id: 'inv-tran', title: 'Stock Transfers', desc: 'Inter-facility inventory shipments and transit status', path: '/inventory/transfers', category: 'Inventory', icon: Package },
      { id: 'inv-alrt', title: 'Low Stock Alerts', desc: 'Automated reorder triggers and safety threshold alerts', path: '/inventory/alerts', category: 'Inventory', icon: AlertTriangle },
      { id: 'advisor', title: 'EN Advisor', desc: 'AI-guided stock level balancing & inventory forecasting', path: '/advisor', category: 'Intelligence', icon: Zap },
    ];
  }

  if (role === 'owner') {
    return [
      { id: 'own-dash', title: 'Owner Dashboard', desc: 'Executive factory KPI summary, profitability & operations health', path: '/owner/dashboard', category: 'Executive', icon: TrendingUp },
      { id: 'own-appr', title: 'Approvals Center', desc: 'Review & authorize high-value purchase orders and capital expenditures', path: '/owner/approvals', category: 'Executive', icon: CheckCircle2 },
      { id: 'own-fin', title: 'Financial Summary', desc: 'Cash flow, payable balances, gross margins & EBITDA snapshot', path: '/owner/financials', category: 'Executive', icon: BarChart2 },
      { id: 'own-user', title: 'User Management', desc: 'Staff directory, role permissions & system access control', path: '/owner/users', category: 'Executive', icon: Users },
      { id: 'own-sal', title: 'Sales Monitoring', desc: 'Top client accounts, sales velocity & pending deliveries', path: '/owner/sales', category: 'Executive', icon: ShoppingCart },
      { id: 'own-pur', title: 'Purchase Monitoring', desc: 'Vendor commitments, active procurement pipelines & costs', path: '/owner/purchase', category: 'Executive', icon: ShoppingBag },
      { id: 'own-mfg', title: 'Manufacturing Monitoring', desc: 'Factory shop floor throughput, completed batches & delays', path: '/owner/manufacturing', category: 'Executive', icon: Factory },
      { id: 'advisor', title: 'EN Advisor', desc: 'AI executive recommendations & profit maximization alerts', path: '/advisor', category: 'Intelligence', icon: Zap },
    ];
  }

  // Fallback to Admin
  return [
    { id: 'dash', title: 'Dashboard', desc: 'Factory overview, live metrics, and operational exception alerts', path: '/dashboard', category: 'Pages & Navigation', icon: TrendingUp },
    { id: 'prod', title: 'Products Catalog', desc: 'Product directory, SKU details, BOM linkages & stock valuation', path: '/products', category: 'Pages & Navigation', icon: Package },
    { id: 'sales-mon', title: 'Sales Monitor', desc: 'Customer orders, dispatch pipeline, and invoices', path: '/sales', category: 'Pages & Navigation', icon: BarChart2 },
    { id: 'pur-mon', title: 'Purchase Monitor', desc: 'Vendor orders, supplier materials, and goods receipts', path: '/purchase', category: 'Pages & Navigation', icon: ShoppingBag },
    { id: 'mfg-mon', title: 'Manufacturing Monitor', desc: 'Assembly lines, production orders & work centers', path: '/manufacturing', category: 'Pages & Navigation', icon: Factory },
    { id: 'inv-mon', title: 'Inventory Monitor', desc: 'Warehouses, stock ledger & reorder threshold alerts', path: '/inventory', category: 'Pages & Navigation', icon: Warehouse },
    { id: 'proc-mon', title: 'Procurement Monitor', desc: 'Raw material demands, approval queue & PO generation', path: '/procurement', category: 'Pages & Navigation', icon: FileText },
    { id: 'users-mgmt', title: 'User Management', desc: 'Staff access, departmental roles & registration approvals', path: '/users', category: 'Pages & Navigation', icon: Users },
    { id: 'audit', title: 'Audit Logs', desc: 'System security, authorization logs & compliance history', path: '/audit-logs', category: 'Pages & Navigation', icon: Clock },
    { id: 'reports', title: 'Business Reports', desc: 'Financial margins, monthly order volume & stock valuation', path: '/reports', category: 'Pages & Navigation', icon: BarChart2 },
    { id: 'advisor', title: 'EN Advisor', desc: 'AI-powered bottleneck detection & procurement recommendations', path: '/advisor', category: 'Quick Operations', icon: Zap },
  ];
};

export default function TopBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const notifRef = useRef(null);
  const searchInputRef = useRef(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [profileForm, setProfileForm] = useState({
    name: '',
    address: '',
    mobile: '',
    photo: '',
  });

  const meta = PAGE_TITLES[pathname] || { breadcrumb: 'Nexus ERP', title: 'Overview' };
  const [user, setUser] = useState(() => {
    const authData = JSON.parse(localStorage.getItem('auth_data') || 'null');
    const u = authData?.user || { name: 'Akshay Chauhan', role: 'admin', email: 'admin@erp-nexus.local' };
    if (u.login_id === 'owner') u.role = 'owner';
    return u;
  });

  // ─── Notification State ───
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifTab, setNotifTab] = useState('all'); // 'all' | 'unread' | 'critical'
  const [notifications, setNotifications] = useState(() => {
    const authData = JSON.parse(localStorage.getItem('auth_data') || 'null');
    const r = authData?.user?.login_id === 'owner' ? 'owner' : (authData?.user?.role || 'admin');
    return ROLE_NOTIFICATIONS[r] || ROLE_NOTIFICATIONS.admin;
  });

  // ─── Global Search State ───
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [productsList, setProductsList] = useState([]);

  // Load user data and synchronize profile directly from backend
  useEffect(() => {
    const authData = JSON.parse(localStorage.getItem('auth_data') || 'null');
    const activeUser = authData?.user || { name: 'Akshay Chauhan', role: 'admin', email: 'admin@erp-nexus.local' };
    if (activeUser.login_id === 'owner') activeUser.role = 'owner';
    setUser(activeUser);
    setProfileForm({
      name: activeUser.name || '',
      address: activeUser.address || '',
      mobile: activeUser.mobile || activeUser.mobile_no || '',
      photo: activeUser.profile_photo || '',
    });

    // Fetch live profile from backend to ensure data sync
    api.get('/auth/profile')
      .then(res => {
        if (res?.success && res.profile) {
          const p = res.profile;
          if (p.login_id === 'owner' || (p.position && p.position.toLowerCase().includes('owner'))) {
            p.role = 'owner';
          }
          setUser(prev => ({ ...prev, ...p }));
          setProfileForm(prev => ({
            name: p.name || prev.name,
            address: p.address || prev.address,
            mobile: p.mobile || prev.mobile,
            photo: p.profile_photo || prev.photo,
          }));
          if (authData) {
            authData.user = { ...authData.user, ...p };
            localStorage.setItem('auth_data', JSON.stringify(authData));
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new CustomEvent('auth_data_updated', { detail: authData.user }));
          }
        }
      })
      .catch(() => {});
  }, [pathname, drawerOpen]);

  // Sync real notifications dynamically from the database based on the active role
  useEffect(() => {
    const fetchRoleNotifications = async () => {
      try {
        const res = await api.get('/intelligence/notifications');
        if (res?.success && Array.isArray(res.notifications)) {
          setNotifications(res.notifications);
          return;
        }
      } catch (err) {
        // Safe empty state on error
      }
      setNotifications([]);
    };

    fetchRoleNotifications();
    const interval = setInterval(fetchRoleNotifications, 45000);
    return () => clearInterval(interval);
  }, [user.role, pathname]);

  // Close notifications popover on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

  // Global keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  // Auto-focus search input & preload products
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 60);
      if (productsList.length === 0) {
        api.get('/products')
          .then(res => {
            const list = res.data || [];
            setProductsList(list);
          })
          .catch(() => {});
      }
    } else {
      setSearchQuery('');
    }
  }, [searchOpen]);

  // Unread notifications count
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    if (notifTab === 'unread') return notifications.filter(n => !n.isRead);
    if (notifTab === 'critical') return notifications.filter(n => n.type === 'critical');
    return notifications;
  }, [notifications, notifTab]);

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await api.post('/intelligence/notifications/mark-all-read');
    } catch (e) {
      console.warn('Could not mark all notifications as read:', e);
    }
  };

  const handleNotifClick = async (notif) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    setNotifOpen(false);
    try {
      await api.patch(`/intelligence/notifications/${notif.id}/read`, {
        notification: notif
      });
    } catch (e) {}
    const dest = resolveRoleRoute(notif.path, user.role);
    if (dest) navigate(dest);
  };

  const dismissNotif = async (e, notif) => {
    e.stopPropagation();
    const notifId = typeof notif === 'string' ? notif : notif.id;
    const notifObj = typeof notif === 'object' ? notif : notifications.find(n => n.id === notifId);
    setNotifications(prev => prev.filter(n => n.id !== notifId));
    try {
      await api.patch(`/intelligence/notifications/${notifId}/dismiss`, {
        notification: notifObj
      });
    } catch (e) {
      console.warn('Could not dismiss notification:', e);
    }
  };

  // Filter search results according to role
  const searchResults = useMemo(() => {
    const rolePages = getNavSearchItems(user.role);
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return {
        pages: rolePages,
        products: []
      };
    }

    const matchedPages = rolePages.filter(item => 
      item.title.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );

    const matchedProducts = productsList.filter(p =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.type && p.type.toLowerCase().includes(q))
    ).slice(0, 6);

    return {
      pages: matchedPages,
      products: matchedProducts
    };
  }, [searchQuery, productsList, user.role]);

  const handleSelectSearchResult = (path) => {
    setSearchOpen(false);
    const dest = resolveRoleRoute(path, user.role);
    if (dest) navigate(dest);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_data');
    navigate('/login');
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileForm(f => ({ ...f, photo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put('/auth/profile', {
        name: profileForm.name,
        address: profileForm.address,
        mobile: profileForm.mobile,
        profile_photo: profileForm.photo,
      });
    } catch (err) {
      console.warn('Profile API update fallback to localStorage:', err);
    }

    const authData = JSON.parse(localStorage.getItem('auth_data') || 'null');
    if (authData) {
      const updatedUser = {
        ...authData.user,
        name: profileForm.name,
        address: profileForm.address,
        mobile: profileForm.mobile,
        profile_photo: profileForm.photo,
      };

      authData.user = updatedUser;
      localStorage.setItem('auth_data', JSON.stringify(authData));
      setUser(updatedUser);
      window.dispatchEvent(new Event('storage'));

      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => {
        setSuccessMsg('');
        setDrawerOpen(false);
      }, 1200);
    }
  };

  return (
    <>
      <header className="topbar">
      {successMsg && <div className="global-toast global-toast--success">{successMsg}</div>}
      
      {/* Breadcrumbs & Title */}
      <div className="topbar-left">
        <span className="topbar-breadcrumb">{meta.breadcrumb}</span>
        <h1 className="topbar-title">{meta.title}</h1>
      </div>

      {/* TopBar Right Actions */}
      <div className="topbar-right">
        {/* 1. Global Search Button */}
        <button 
          className="topbar-icon-btn" 
          aria-label="Search" 
          onClick={() => setSearchOpen(true)}
          title="Search pages, products & actions (Ctrl + K)"
        >
          <Search size={18} strokeWidth={1.75} />
        </button>

        {/* 2. Notifications Center Popover */}
        <div className="notif-popover-wrapper" ref={notifRef}>
          <button 
            className="topbar-icon-btn topbar-notif-btn" 
            aria-label="Notifications" 
            onClick={() => setNotifOpen(prev => !prev)}
            title="Operational Notifications"
          >
            <Bell size={18} strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span className="topbar-notif-badge">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="topbar-notif-popover">
              <div className="notif-header">
                <div className="notif-title-row">
                  <h4 className="notif-title">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="notif-count-badge">{unreadCount} new</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead} 
                    className="notif-mark-read-btn"
                    title="Mark all notifications as read"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="notif-tabs">
                <button 
                  className={`notif-tab ${notifTab === 'all' ? 'notif-tab--active' : ''}`}
                  onClick={() => setNotifTab('all')}
                >
                  All ({notifications.length})
                </button>
                <button 
                  className={`notif-tab ${notifTab === 'unread' ? 'notif-tab--active' : ''}`}
                  onClick={() => setNotifTab('unread')}
                >
                  Unread ({unreadCount})
                </button>
                <button 
                  className={`notif-tab ${notifTab === 'critical' ? 'notif-tab--active' : ''}`}
                  onClick={() => setNotifTab('critical')}
                >
                  Critical
                </button>
              </div>

              {/* Notification List */}
              <div className="notif-list">
                {filteredNotifications.length === 0 ? (
                  <div className="notif-empty">
                    <CheckCircle2 size={28} style={{ color: 'var(--color-success)', opacity: 0.8 }} />
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 500 }}>All caught up!</p>
                    <span style={{ fontSize: '12px', opacity: 0.6 }}>No {notifTab !== 'all' ? notifTab : ''} notifications right now.</span>
                  </div>
                ) : (
                  filteredNotifications.map(notif => {
                    const tagColor = notif.type === 'critical' ? 'var(--color-error)' : notif.type === 'warning' ? '#f59e0b' : 'var(--color-primary)';
                    return (
                      <div 
                        key={notif.id} 
                        className={`notif-item ${!notif.isRead ? 'notif-item--unread' : ''}`}
                        onClick={() => handleNotifClick(notif)}
                        title="Click to view and work on this alert"
                      >
                        {!notif.isRead && <span className="notif-unread-dot" />}
                        <div className="notif-icon-col" style={{ color: tagColor }}>
                          {notif.type === 'critical' ? <AlertCircle size={16} /> : notif.type === 'warning' ? <AlertTriangle size={16} /> : <Info size={16} />}
                        </div>
                        <div className="notif-content-col">
                          <div className="notif-item-header">
                            <span className="notif-category-tag" style={{ color: tagColor }}>
                              {notif.category}
                            </span>
                            <span className="notif-time">{notif.time}</span>
                          </div>
                          <p className="notif-message">{notif.message}</p>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span className="notif-action-tag">
                              <span>{notif.actionText || 'Take Action'}</span>
                              <ArrowRight size={12} />
                            </span>
                            <button 
                              className="notif-item-dismiss"
                              onClick={(e) => dismissNotif(e, notif.id)}
                              title="Dismiss"
                            >
                              &times;
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Notification Footer */}
              <div className="notif-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button 
                  onClick={() => {
                    setNotifOpen(false);
                    navigate('/notifications/history');
                  }}
                  className="notif-footer-link"
                  style={{ color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}
                  title="View previous notifications from the last 48 hours"
                >
                  <Clock size={13} />
                  <span>View Previous</span>
                </button>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <button 
                    onClick={() => {
                      setNotifOpen(false);
                      navigate(resolveRoleRoute('/dashboard', user.role));
                    }}
                    className="notif-footer-link"
                  >
                    Dashboard
                  </button>
                  <button 
                    onClick={markAllAsRead}
                    className="notif-footer-link" 
                    style={{ color: 'var(--color-secondary)' }}
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="topbar-divider" />
        
        {/* User Profile */}
        <button 
          className="topbar-user" 
          onClick={() => setDrawerOpen(true)}
          aria-label="User Profile"
        >
          <div className="topbar-avatar" style={{ overflow: 'hidden', position: 'relative' }}>
            {user.profile_photo ? (
              <img src={user.profile_photo} alt={user.name} className="profile-avatar-img" />
            ) : (
              getInitials(user.name)
            )}
          </div>
          <div className="topbar-user-info">
            <span className="topbar-user-name">{user.name}</span>
            <span className="topbar-user-role">{ROLE_LABELS[user.role] || user.role}</span>
          </div>
          <ChevronDown size={14} className="topbar-user-chevron" />
        </button>
      </div>

      {/* Profile Drawer */}
      {drawerOpen && (
        <>
          <div className="profile-drawer-backdrop" onClick={() => setDrawerOpen(false)} />
          <div className="profile-drawer">
            <div className="profile-drawer-header">
              <h2 className="profile-drawer-title">User Profile</h2>
              <button 
                type="button"
                className="profile-drawer-close" 
                onClick={() => setDrawerOpen(false)}
                aria-label="Close Profile"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="profile-drawer-body">
              {/* Centered Avatar Section */}
              <div className="profile-avatar-center-wrapper">
                <div 
                  className="profile-avatar-large-circle"
                  onClick={handlePhotoClick}
                  title="Click avatar to update photo"
                >
                  {profileForm.photo ? (
                    <img src={profileForm.photo} alt="Profile" className="profile-avatar-img-large" />
                  ) : (
                    <span className="profile-avatar-large-initials">
                      {getInitials(profileForm.name || user.name)}
                    </span>
                  )}
                  <div className="profile-avatar-cam-badge">
                    <Camera size={14} color="#ffffff" />
                  </div>
                </div>
                <span className="profile-avatar-caption">Click avatar to update photo</span>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>

              {/* Success Notification Alert */}
              {successMsg && (
                <div className="profile-success-alert">
                  <Check size={16} />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Vertical Form Fields */}
              <form onSubmit={handleSaveProfile} className="profile-drawer-form">
                <div className="profile-drawer-field">
                  <label className="profile-drawer-label">FULL NAME</label>
                  <input
                    type="text"
                    className="profile-drawer-input"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Akshay Purchase"
                    required
                  />
                </div>

                <div className="profile-drawer-field">
                  <label className="profile-drawer-label">ADDRESS</label>
                  <textarea
                    className="profile-drawer-textarea"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="Colaba, Mumbai, 400001"
                    rows={3}
                  />
                </div>

                <div className="profile-drawer-field">
                  <label className="profile-drawer-label">MOBILE NUMBER</label>
                  <input
                    type="text"
                    className="profile-drawer-input"
                    value={profileForm.mobile}
                    onChange={(e) => setProfileForm(f => ({ ...f, mobile: e.target.value }))}
                    placeholder="+918000000000"
                  />
                </div>

                <div className="profile-drawer-field">
                  <label className="profile-drawer-label">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    className="profile-drawer-input profile-drawer-input-disabled"
                    value={user.email || ''}
                    disabled
                  />
                </div>

                <div className="profile-drawer-field">
                  <label className="profile-drawer-label">POSITION</label>
                  <input
                    type="text"
                    className="profile-drawer-input profile-drawer-input-disabled"
                    value={ROLE_LABELS[user.role] || user.position || user.role || 'User'}
                    disabled
                  />
                </div>

                <div className="profile-drawer-actions">
                  <button type="submit" className="profile-drawer-save-btn">
                    Save Changes
                  </button>
                  <button type="button" className="profile-drawer-signout-btn" onClick={handleLogout}>
                    Sign Out
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </header>

    {/* ══════════════════════════════════════════════════════════
        GLOBAL SEARCH MODAL (Command Palette) — Mounted via Portal
       ══════════════════════════════════════════════════════════ */}
    {searchOpen && createPortal(
      <div 
        className="global-search-backdrop" 
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            setSearchOpen(false);
          }
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSearchOpen(false);
          }
        }}
      >
        <div className="global-search-modal" onClick={(e) => e.stopPropagation()}>
          <div className="global-search-bar">
            <Search size={18} style={{ color: 'var(--color-secondary)', flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              className="global-search-input"
              placeholder="Search pages, products, orders, or actions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', color: 'var(--color-secondary)', cursor: 'pointer', padding: '4px' }}
                title="Clear input"
              >
                <X size={16} />
              </button>
            )}
            <span className="global-search-kbd">ESC</span>
            <button 
              type="button"
              className="global-search-close-btn"
              onClick={() => setSearchOpen(false)}
              title="Close search modal"
              aria-label="Close search"
            >
              <X size={14} />
            </button>
          </div>

          <div className="global-search-results">
            {/* Category 1: Navigation & Pages */}
            {searchResults.pages.length > 0 && (
              <div>
                <div className="global-search-category-title">Pages & Workspaces</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {searchResults.pages.map(item => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        className="global-search-item"
                        onClick={() => handleSelectSearchResult(item.path)}
                      >
                        <div className="global-search-item-left">
                          <div className="global-search-item-icon">
                            <Icon size={16} />
                          </div>
                          <div>
                            <h5 className="global-search-item-title">{item.title}</h5>
                            <p className="global-search-item-desc">{item.desc}</p>
                          </div>
                        </div>
                        <div className="global-search-item-right">
                          <span style={{ fontSize: '11px', opacity: 0.6 }}>{item.category}</span>
                          <ArrowRight size={14} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Category 2: Products & Inventory (Live from Database) */}
            {searchResults.products.length > 0 && (
              <div>
                <div className="global-search-category-title">Products in Database</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {searchResults.products.map(prod => (
                    <div
                      key={prod.id}
                      className="global-search-item"
                      onClick={() => handleSelectSearchResult('/products')}
                    >
                      <div className="global-search-item-left">
                        <div className="global-search-item-icon" style={{ background: prod.type === 'FINISHED_GOOD' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)', color: prod.type === 'FINISHED_GOOD' ? '#16a34a' : '#ca8a04' }}>
                          <Package size={16} />
                        </div>
                        <div>
                          <h5 className="global-search-item-title">{prod.name}</h5>
                          <p className="global-search-item-desc">
                            Type: <strong>{prod.type}</strong> • Price: ₹{prod.sales_price || prod.cost_price || 0} • In Stock: {prod.inventory?.on_hand_qty || 0} units
                          </p>
                        </div>
                      </div>
                      <div className="global-search-item-right">
                        <span style={{ fontSize: '11px', opacity: 0.6 }}>View Catalog</span>
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {searchResults.pages.length === 0 && searchResults.products.length === 0 && (
              <div className="global-search-empty">
                <Search size={32} style={{ opacity: 0.4 }} />
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>No results found</p>
                <span style={{ fontSize: '12px', opacity: 0.7 }}>
                  No pages or products match &ldquo;{searchQuery}&rdquo;. Try searching &ldquo;dashboard&rdquo;, &ldquo;orders&rdquo;, or &ldquo;materials&rdquo;.
                </span>
              </div>
            )}
          </div>

          <div className="global-search-footer">
            <span>Tip: Press <kbd style={{ background: 'var(--surface-high)', padding: '2px 4px', borderRadius: '3px' }}>Ctrl + K</kbd> anywhere to open</span>
            <span>Click outside or press ESC to dismiss</span>
          </div>
        </div>
      </div>,
      document.body
    )}
  </>
  );
}
