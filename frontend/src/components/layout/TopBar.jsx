import { useLocation } from 'react-router-dom';
import { Bell, Search, ChevronDown } from 'lucide-react';
import './TopBar.css';

const PAGE_TITLES = {
  '/dashboard':     { breadcrumb: 'Home', title: 'Dashboard' },
  '/products':      { breadcrumb: 'Inventory', title: 'Products' },
  '/orders':        { breadcrumb: 'Sales', title: 'Orders' },
  '/new-sales-order': { breadcrumb: 'Sales → New Order', title: 'New Sales Order' },
  '/warehouse':     { breadcrumb: 'Operations', title: 'Warehouse' },
  '/logistics':     { breadcrumb: 'Operations', title: 'Logistics' },
  '/settings':      { breadcrumb: 'System', title: 'Settings' },
};

export default function TopBar() {
  const { pathname } = useLocation();
  const meta = PAGE_TITLES[pathname] || { breadcrumb: 'Nexus ERP', title: 'Overview' };

  return (
    <header className="topbar">
      {/* Left: breadcrumb + title */}
      <div className="topbar-left">
        <span className="topbar-breadcrumb">{meta.breadcrumb}</span>
        <h1 className="topbar-title">{meta.title}</h1>
      </div>

      {/* Right: search + notif + avatar */}
      <div className="topbar-right">
        <button className="topbar-icon-btn" aria-label="Search">
          <Search size={18} strokeWidth={1.75} />
        </button>
        <button className="topbar-icon-btn topbar-notif-btn" aria-label="Notifications">
          <Bell size={18} strokeWidth={1.75} />
          <span className="topbar-notif-badge" />
        </button>
        <div className="topbar-divider" />
        <button className="topbar-user">
          <div className="topbar-avatar">AS</div>
          <div className="topbar-user-info">
            <span className="topbar-user-name">Alexander Sterling</span>
            <span className="topbar-user-role">Operations Manager</span>
          </div>
          <ChevronDown size={14} className="topbar-user-chevron" />
        </button>
      </div>
    </header>
  );
}
