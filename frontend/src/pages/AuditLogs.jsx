import { useState, useEffect } from 'react';
import { ShieldAlert, Search, RefreshCw, Filter } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import { api } from '../utils/api';
import '../styles/AdminPages.css';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [searchUser, setSearchUser] = useState('');
  const [selectedModule, setSelectedModule] = useState('All');
  const [selectedAction, setSelectedAction] = useState('All');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.get('/audit-logs');
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique values for filter dropdowns
  const modules = ['All', ...new Set(logs.map(log => log.module))];
  const actions = ['All', ...new Set(logs.map(log => log.action))];

  // Filtering logic
  const filteredLogs = logs.filter(log => {
    const matchesUser = log.user.toLowerCase().includes(searchUser.toLowerCase());
    const matchesModule = selectedModule === 'All' || log.module === selectedModule;
    const matchesAction = selectedAction === 'All' || log.action === selectedAction;
    return matchesUser && matchesModule && matchesAction;
  });

  return (
    <AppShell>
      <div className="animate-page" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header Panel */}
      <div className="admin-panel" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="kpi-icon kpi-icon--error" style={{ width: '40px', height: '40px' }}><ShieldAlert size={18} /></div>
          <div>
            <h3 className="admin-panel-title">ERP Audit Ledger</h3>
            <p style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>Immutable history of system configurations, administrative edits, and transactions</p>
          </div>
        </div>
        <button className="topbar-icon-btn" onClick={loadLogs} title="Refresh Logs">
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {/* Filters Board */}
      <div className="admin-panel" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--color-secondary)' }}>
            <Filter size={14} /> Filter Logs:
          </div>
          
          {/* User search */}
          <div className="login-input-wrapper" style={{ flex: 1, minWidth: '200px' }}>
            <Search size={14} className="login-input-icon login-input-icon--left" style={{ color: 'var(--color-secondary)' }} />
            <input
              type="text"
              className="login-input"
              style={{ height: '36px', fontSize: '13px', paddingLeft: '36px' }}
              placeholder="Search by User (Email)..."
              value={searchUser}
              onChange={e => setSearchUser(e.target.value)}
            />
          </div>

          {/* Module select */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <select
              className="login-input register-select"
              style={{ height: '36px', fontSize: '13px', minWidth: '150px', paddingRight: '32px' }}
              value={selectedModule}
              onChange={e => setSelectedModule(e.target.value)}
            >
              <option value="All">All Modules</option>
              {modules.filter(m => m !== 'All').map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Action type select */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <select
              className="login-input register-select"
              style={{ height: '36px', fontSize: '13px', minWidth: '160px', paddingRight: '32px' }}
              value={selectedAction}
              onChange={e => setSelectedAction(e.target.value)}
            >
              <option value="All">All Action Types</option>
              {actions.filter(a => a !== 'All').map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="admin-panel">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-secondary)' }}>
            <RefreshCw size={24} className="spin" style={{ margin: '0 auto 8px' }} />
            Loading system ledger trail…
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-secondary)' }}>
            No audit records match the selected filters.
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '180px' }}>Timestamp</th>
                  <th>User ID</th>
                  <th>Module</th>
                  <th>Action</th>
                  <th>Previous Value</th>
                  <th>New Description / Value</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '13px' }}>{log.user}</td>
                    <td>
                      <span className="admin-badge admin-badge--info" style={{ fontSize: '11px' }}>
                        {log.module}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{log.action}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', opacity: 0.8 }}>{log.old_value}</td>
                    <td style={{ fontWeight: 500, fontSize: '13px' }}>{log.new_value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </AppShell>
  );
}
