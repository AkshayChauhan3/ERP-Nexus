import Sidebar from './Sidebar';
import TopBar from './TopBar';
import './AppShell.css';

export default function AppShell({ children, hideSidebar }) {
  return (
    <div className={`app-shell ${hideSidebar ? 'sidebar-hidden' : ''}`}>
      {!hideSidebar && <Sidebar />}
      <div className="app-main">
        <TopBar />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
