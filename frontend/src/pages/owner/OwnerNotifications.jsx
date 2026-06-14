import { useState, useEffect } from 'react';
import { ShieldAlert, Bell, RefreshCw } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
import '../../styles/Owner.css';
import '../../styles/Purchase.css';

export default function OwnerNotifications() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const [auditRes, invRes, poRes, soRes] = await Promise.all([
        api.get('/audit-logs?limit=20').catch(() => ({ data: [] })),
        api.get('/inventory').catch(() => ({ data: [] })),
        api.get('/purchase-orders').catch(() => ({ data: [] })),
        api.get('/sales-orders').catch(() => ({ data: [] }))
      ]);

      const builtAlerts = [];

      // Inventory low stock alerts
      const invItems = invRes.data || [];
      invItems.forEach(item => {
        const onHand = Number(item.on_hand_qty || 0);
        const reorder = Number(item.reorder_level || 0);
        if (onHand <= reorder && onHand >= 0 && item.product) {
          builtAlerts.push({
            id: `inv-${item.id}`,
            type: 'Inventory',
            message: `${item.product.name} is at or below safety stock (${onHand} units remaining, reorder at ${reorder}).`,
            date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            unread: true
          });
        }
      });

      // Draft purchase orders waiting action
      const pos = poRes.data || [];
      pos.filter(po => po.status === 'draft').slice(0, 3).forEach(po => {
        const val = po.lines?.reduce((s, l) => s + (l.ordered_qty * l.unit_price), 0) || 0;
        builtAlerts.push({
          id: `po-${po.id}`,
          type: 'Purchase',
          message: `Purchase Order ${po.po_number} (${po.vendor?.name}) worth ₹${val.toLocaleString()} is in Draft status and awaiting confirmation.`,
          date: new Date(po.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          unread: false
        });
      });

      // Recent audit log entries from the backend
      const logs = auditRes.data || [];
      logs.slice(0, 5).forEach(log => {
        builtAlerts.push({
          id: `log-${log.id}`,
          type: 'System',
          message: `${log.action} — ${log.new_value || log.old_value || 'No details'}`,
          date: new Date(log.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          unread: false
        });
      });

      setAlerts(builtAlerts.slice(0, 15));
    } catch (err) {
      console.error('Failed to load alerts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAlerts(); }, []);

  const markAllRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, unread: false })));
  };

  const iconColor = (type) => {
    if (type === 'Inventory') return 'var(--color-amber)';
    if (type === 'Purchase') return 'var(--color-primary)';
    if (type === 'Security') return 'var(--color-error)';
    return 'var(--color-secondary)';
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
              <h3 className="purchase-panel-title">System Activity Log Alerts ({alerts.length})</h3>
            </div>
            {alerts.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-secondary)' }}>
                All systems operational. No alerts at this time.
              </div>
            ) : (
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
                        position: 'absolute', left: '8px', top: '8px',
                        width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)'
                      }} />
                    )}
                    <div style={{
                      padding: '8px', borderRadius: '50%',
                      background: 'rgba(255,255,255,0.03)',
                      color: iconColor(a.type)
                    }}>
                      <ShieldAlert size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px' }}>{a.type} Alert</span>
                        <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{a.date}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--color-on-surface)' }}>{a.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
