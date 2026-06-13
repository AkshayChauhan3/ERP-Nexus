import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Warehouse,
  Truck, Settings, Zap, ChevronRight
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { path: '/products',   label: 'Products',   icon: Package },
  { path: '/orders',     label: 'Orders',     icon: ShoppingCart },
  { path: '/warehouse',  label: 'Warehouse',  icon: Warehouse },
  { path: '/logistics',  label: 'Logistics',  icon: Truck },
  { path: '/settings',   label: 'Settings',   icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();

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
      <span className="sidebar-section-label">Navigation</span>

      {/* Nav Links */}
      <nav className="sidebar-nav">
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
