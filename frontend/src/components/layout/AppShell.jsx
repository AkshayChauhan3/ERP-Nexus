import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import './AppShell.css';

export default function AppShell({ children, hideSidebar }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('nexus_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleToggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('nexus_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className={`app-shell ${hideSidebar ? 'sidebar-hidden' : ''} ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      {!hideSidebar && (
        <>
          <Sidebar 
            isCollapsed={isCollapsed} 
            onToggle={handleToggleSidebar}
            mobileOpen={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
          />
          {mobileMenuOpen && (
            <div 
              className="sidebar-mobile-backdrop" 
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation menu"
            />
          )}
        </>
      )}
      <div className="app-main">
        <TopBar 
          isSidebarCollapsed={isCollapsed}
          onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)}
          isMobileMenuOpen={mobileMenuOpen}
        />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
