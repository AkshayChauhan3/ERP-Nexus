import { useState, useEffect } from 'react';
import { ShieldAlert, Bell, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import '../../styles/Owner.css';
import '../../styles/Purchase.css';

export default function OwnerNotifications() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAlerts = () => {
    setLoading(true);
    setTimeout(() => {
      // Mock alerts
      const mockAlerts = [
        { id: 1, type: 'Security', message: 'New login detected from Mumbai, India for user admin@erp-nexus.local', date: '2026-06-13 08:32 PM', unread: true },
        { id: 2, type: 'Inventory', message: 'Raw material Foam Padding Sheet is below the safety stock threshold (3 units left).', date: '2026-06-13 05:15 PM', unread: true },
        { id: 3, type: 'Approval', message: 'Purchase Order PO-2026-002 worth ₹45,000 is waiting for your approval.', date: '2026-06-12 04:30 PM', unread: false },
        { id: 4, type: 'Sales', message: 'Sales Order SO-2026-002 worth ₹1,85,850 was successfully delivered and closed.', date: '2026-06-11 11:20 AM', unread: false }
      ];
      setAlerts(mockAlerts);
      setLoading(false);
    }, 200);
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const markAllRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, unread: false })));
  };

  return (
    <AppShell>
      <div className="animate-page owner-root">
        <div className="owner-header">
          <div>
            <h2 className="owner-title">
              <Bell size={22} style={{ color: 'var(--color-primary)' }} />
              Notifications & Alerts
            </h2>
            <p className="owner-sub">Real-time alerts, system messages, and approval prompts requiring executive attention.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn--secondary" onClick={markAllRead}>Mark All as Read</button>
            <button className="btn btn--secondary" style={{ gap: '6px' }} onClick={loadAlerts}>
              <RefreshCw size={14} /> Refresh Alerts
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: 'var(--color-secondary)' }}>
            <RefreshCw size={32} className="spin" />
            <div style={{ marginTop: '12px' }}>Retrieving recent notifications...</div>
          </div>
        ) : (
          <div className="purchase-panel">
            <div className="purchase-panel-header">
              <h3 className="purchase-panel-title">System Activity Log Alerts</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              {alerts.map(a => (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    padding: '16px',
                    border: '1px solid var(--color-outline-variant)',
                    borderRadius: 'var(--radius-lg)',
                    background: a.unread ? 'rgba(var(--color-primary-rgb), 0.04)' : 'rgba(255,255,255,0.01)',
                    position: 'relative'
                  }}
                >
                  {a.unread && (
                    <div style={{
                      position: 'absolute',
                      left: '8px',
                      top: '8px',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--color-primary)'
                    }} />
                  )}
                  <div style={{
                    padding: '8px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.03)',
                    color: a.type === 'Security' ? 'var(--color-error)' : a.type === 'Inventory' ? 'var(--color-amber)' : 'var(--color-primary)'
                  }}>
                    <ShieldAlert size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px' }}>{a.type} Warning</span>
                      <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{a.date}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-on-surface)' }}>{a.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
