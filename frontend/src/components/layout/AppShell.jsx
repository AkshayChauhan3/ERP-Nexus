import { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import './AppShell.css';

export default function AppShell({ children, hideSidebar }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('nexus_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

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
        <Sidebar 
          isCollapsed={isCollapsed} 
          onToggle={handleToggleSidebar} 
        />
      )}
      <div className="app-main">
        <TopBar isSidebarCollapsed={isCollapsed} />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
