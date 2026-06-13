import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Warehouse,
  Truck, Settings, Zap, ChevronRight, Factory,
  ClipboardList, Users, ShieldAlert, BarChart2, ShoppingBag
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

  const isAdminOrOwner = user.role === 'admin' || user.role === 'owner';

  const navItems = isAdminOrOwner ? [
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
  ] : [
    { path: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
    { path: '/products',   label: 'Products',   icon: Package },
    { path: '/orders',     label: 'Orders',     icon: ShoppingCart },
    { path: '/warehouse',  label: 'Warehouse',  icon: Warehouse },
    { path: '/logistics',  label: 'Logistics',  icon: Truck },
    { path: '/settings',   label: 'Settings',   icon: Settings },
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

      {/* Nav section label */}
      <span className="sidebar-section-label">
        {isAdminOrOwner ? 'Admin Panel' : 'Navigation'}
      </span>

      {/* Nav Links */}
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

      {/* Footer */}
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

