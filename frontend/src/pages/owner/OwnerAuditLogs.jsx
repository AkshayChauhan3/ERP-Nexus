import { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, Layers } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import '../../styles/Owner.css';
import '../../styles/Purchase.css';

export default function OwnerAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = () => {
    setLoading(true);
    setTimeout(() => {
      const allLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
      setLogs(allLogs);
      setLoading(false);
    }, 250);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <AppShell>
      <div className="animate-page owner-root">
        <div className="owner-header">
          <div>
            <h2 className="owner-title">
              <ShieldAlert size={22} style={{ color: 'var(--color-primary)' }} />
              Audit Log Register
            </h2>
            <p className="owner-sub">Immutable registry of critical updates, workflow approvals, settings changes, and security events.</p>
          </div>
          <button className="btn btn--secondary" style={{ gap: '6px' }} onClick={loadLogs}>
            <RefreshCw size={14} /> Refresh Logs
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: 'var(--color-secondary)' }}>
            <RefreshCw size={32} className="spin" />
            <div style={{ marginTop: '12px' }}>Querying audit database...</div>
          </div>
        ) : (
          <div className="purchase-panel">
            <div className="purchase-panel-header">
              <h3 className="purchase-panel-title">System Execution Events</h3>
            </div>
            
            {logs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-secondary)' }}>
                No events recorded in the audit logs yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="purchase-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Operator ID</th>
                      <th>Area / Module</th>
                      <th>Performed Action</th>
                      <th>Prior Value</th>
                      <th>Updated Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id}>
                        <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td style={{ fontWeight: 600 }}>{log.user}</td>
                        <td>
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'var(--color-outline-variant)' }}>
                            {log.module}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{log.action}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-secondary)' }}>{log.old_value}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-success)' }}>{log.new_value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
