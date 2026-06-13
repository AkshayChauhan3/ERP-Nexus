import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Warehouse,
  Truck, Settings, Zap, ChevronRight, Factory,
  ClipboardList, Users, ShieldAlert, BarChart2, ShoppingBag,
  FileText, Wrench, Cpu, Activity, History, Layers, ArrowRightLeft,
  CheckCircle, AlertTriangle, DollarSign, Bell
} from 'lucide-react';
import './Sidebar.css';

export default function Sidebar() {
  const location = useLocation();
  const [user, setUser] = useState({ role: 'sales' });

  useEffect(() => {
    const authData = JSON.parse(localStorage.getItem('auth_data') || 'null');
    if (authData?.user) {
      setUser(authData.user);
    }
  }, []);

  const isOwner           = user.role === 'owner';
  const isAdmin           = user.role === 'admin';
  const isManufacturing   = user.role === 'manufacturing';
  const isInventory       = user.role === 'inventory';
  const isPurchase        = user.role === 'purchase';
  const isSales           = user.role === 'sales';

  const navItems = isOwner ? [
    { path: '/owner/dashboard',     label: 'Dashboard',               icon: LayoutDashboard },
    { path: '/owner/overview',      label: 'Business Overview',       icon: Activity },
    { path: '/owner/approvals',     label: 'Approvals Center',        icon: CheckCircle },
    { path: '/owner/financials',    label: 'Financial Summary',       icon: DollarSign },
    { path: '/owner/users',         label: 'User Management',         icon: Users },
    { path: '/owner/employees',     label: 'Employee Activity',       icon: Activity },
    { path: '/owner/inventory',     label: 'Inventory Monitoring',    icon: Warehouse },
    { path: '/owner/sales',         label: 'Sales Monitoring',        icon: ShoppingCart },
    { path: '/owner/purchase',      label: 'Purchase Monitoring',     icon: ShoppingBag },
    { path: '/owner/manufacturing', label: 'Mfg Monitoring',          icon: Factory },
    { path: '/owner/notifications', label: 'Notifications',           icon: Bell },
    { path: '/owner/reports',       label: 'Reports',                 icon: BarChart2 },
    { path: '/owner/audit-logs',    label: 'Audit Logs',              icon: ShieldAlert },
    { path: '/owner/settings',      label: 'Settings',                icon: Settings },
  ] : isAdmin ? [
    { path: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
    { path: '/products',      label: 'Products',      icon: Package },
    { path: '/sales',         label: 'Sales',         icon: ShoppingCart },
    { path: '/purchase',      label: 'Purchase',      icon: ShoppingBag },
    { path: '/manufacturing', label: 'Manufacturing', icon: Factory },
    { path: '/inventory',     label: 'Inventory',     icon: Warehouse },
    { path: '/procurement',   label: 'Procurement',   icon: ClipboardList },
    { path: '/users',         label: 'Users',         icon: Users },
    { path: '/audit-logs',    label: 'Audit Logs',    icon: ShieldAlert },
    { path: '/reports',       label: 'Reports',       icon: BarChart2 },
  ] : isManufacturing ? [
    { path: '/manufacturing/dashboard', label: 'Dashboard',            icon: LayoutDashboard },
    { path: '/manufacturing/bom',      label: 'Bills of Materials',   icon: FileText },
    { path: '/manufacturing/orders',   label: 'Manufacturing Orders', icon: Factory },
    { path: '/manufacturing/work-orders', label: 'Work Orders',       icon: Wrench },
    { path: '/manufacturing/work-centers', label: 'Work Centers',     icon: Cpu },
    { path: '/manufacturing/tracking', label: 'Production Tracking',  icon: Activity },
    { path: '/manufacturing/consumption', label: 'Inv. Consumption',  icon: Package },
    { path: '/manufacturing/history',  label: 'Production History',   icon: History },
    { path: '/manufacturing/reports',  label: 'Reports',              icon: BarChart2 },
  ] : isPurchase ? [
    { path: '/purchase/dashboard',       label: 'Dashboard',            icon: LayoutDashboard },
    { path: '/purchase/vendors',         label: 'Vendors',              icon: Users },
    { path: '/purchase/materials',       label: 'Materials',            icon: Package },
    { path: '/purchase/orders',          label: 'Purchase Orders',      icon: ShoppingBag },
    { path: '/purchase/goods-receipts',  label: 'Goods Receipts',       icon: Truck },
    { path: '/purchase/vendor-bills',    label: 'Vendor Bills',         icon: FileText },
    { path: '/purchase/inventory',       label: 'Inventory',            icon: Warehouse },
    { path: '/purchase/procurement',     label: 'Procurement Suggestions', icon: ClipboardList },
    { path: '/purchase/history',         label: 'Purchase History',     icon: History },
    { path: '/purchase/reports',         label: 'Reports',              icon: BarChart2 },
  ] : isInventory ? [
    { path: '/inventory/dashboard',      label: 'Dashboard',            icon: LayoutDashboard },
    { path: '/inventory/overview',       label: 'Inventory Overview',   icon: Layers },
    { path: '/inventory/products',       label: 'Product Inventory',    icon: Package },
    { path: '/inventory/warehouses',     label: 'Warehouses',           icon: Warehouse },
    { path: '/inventory/ledger',         label: 'Stock Ledger',         icon: ClipboardList },
    { path: '/inventory/transfers',      label: 'Stock Transfers',      icon: ArrowRightLeft },
    { path: '/inventory/adjustments',    label: 'Stock Adjustments',    icon: Settings },
    { path: '/inventory/reserved',       label: 'Reserved Stock',       icon: CheckCircle },
    { path: '/inventory/alerts',         label: 'Low Stock Alerts',     icon: AlertTriangle },
    { path: '/inventory/history',        label: 'Inventory History',    icon: History },
    { path: '/inventory/reports',        label: 'Reports',              icon: BarChart2 },
  ] : isSales ? [
    { path: '/sales/dashboard',          label: 'Dashboard',            icon: LayoutDashboard },
    { path: '/sales/customers',          label: 'Customers',            icon: Users },
    { path: '/sales/quotations',         label: 'Quotations',           icon: FileText },
    { path: '/sales/orders',             label: 'Sales Orders',         icon: ShoppingBag },
    { path: '/sales/deliveries',         label: 'Delivery Management',  icon: Truck },
    { path: '/sales/catalog',            label: 'Product Catalog',      icon: Package },
    { path: '/sales/reserved',           label: 'Reserved Stock',       icon: CheckCircle },
    { path: '/sales/history',            label: 'Sales History',        icon: History },
    { path: '/sales/reports',            label: 'Reports',              icon: BarChart2 },
    { path: '/sales/analytics',          label: 'Analytics',            icon: BarChart2 },
  ] : [
    { path: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
    { path: '/products',   icon: Package,       label: 'Products' },
    { path: '/orders',     icon: ShoppingCart,  label: 'Orders' },
    { path: '/warehouse',  icon: Warehouse,     label: 'Warehouse' },
    { path: '/logistics',  icon: Truck,         label: 'Logistics' },
    { path: '/settings',   icon: Settings,      label: 'Settings' },
  ];

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <Zap size={18} strokeWidth={2.5} />
        </div>
        <div className="sidebar-logo-text">
          <span className="sidebar-brand">Nexus</span>
          <span className="sidebar-brand-sub">ERP</span>
        </div>
      </div>

      {/* Divider */}
      <div className="sidebar-divider" />

      {/* Section Label */}
      <span className="sidebar-section-label">
        {isOwner ? 'Owner Cockpit' : isAdmin ? 'Admin Panel' : isManufacturing ? 'Manufacturing' : isPurchase ? 'Procurement' : isInventory ? 'Inventory Control' : isSales ? 'Sales Panel' : 'Navigation'}
      </span>

      {}
      <nav className="sidebar-nav" style={{ overflowY: 'auto', flex: 1 }}>
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path ||
            (path === '/orders' && location.pathname === '/new-sales-order');
          return (
            <NavLink
              key={path}
              to={path}
              className={`sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}
            >
              <span className="sidebar-link-icon">
                <Icon size={18} strokeWidth={1.75} />
              </span>
              <span className="sidebar-link-label">{label}</span>
              {isActive && (
                <ChevronRight size={14} className="sidebar-link-chevron" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {}
      <div className="sidebar-footer">
        <div className="sidebar-footer-card">
          <div className="sidebar-footer-icon">
            <Zap size={14} strokeWidth={2} />
          </div>
          <div className="sidebar-footer-info">
            <span className="sidebar-footer-title">EN Advisor</span>
            <span className="sidebar-footer-sub">AI-powered insights</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

