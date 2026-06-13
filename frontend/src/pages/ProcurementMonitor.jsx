import { ClipboardList, AlertTriangle, ArrowRight, ShieldAlert, CheckCircle } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import '../styles/AdminPages.css';

const MOCK_PROCUREMENT_ALERTS = [
  { message: 'Foam Padding Sheet (RM-FOM-02) is out of stock. MO-3995 is waiting.', severity: 'critical', type: 'shortage' },
  { message: 'Oak Wooden Board (RM-OAK-01) reorder limit triggered. Replenishment PO-2009 is pending.', severity: 'warning', type: 'replenish' },
  { message: 'Comfort Cushion Sofa (FG-SOF-09) is at 1 unit (Reorder Level: 5).', severity: 'warning', type: 'replenish' },
];

const MOCK_PROCUREMENT_REQS = [
  { item: 'Foam Padding Sheet', qty: 40, type: 'MTS (Purchase)', date: '2026-06-13', status: 'PO Created', statusColor: 'info' },
  { item: 'Oak Wooden Board', qty: 25, type: 'MTS (Purchase)', date: '2026-06-13', status: 'PO Created', statusColor: 'info' },
  { item: 'Comfort Cushion Sofa', qty: 10, type: 'MTO (Manufacture)', date: '2026-06-12', status: 'MO Created', statusColor: 'warning' },
  { item: 'Steel Framing Screws', qty: 500, type: 'MTS (Purchase)', date: '2026-06-10', status: 'Completed', statusColor: 'success' },
  { item: 'Office Desk Board', qty: 15, type: 'MTO (Manufacture)', date: '2026-06-11', status: 'Waiting', statusColor: 'error' },
];

export default function ProcurementMonitor() {
  return (
    <AppShell>
      <div className="animate-page" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {}
      <div className="admin-panel" style={{ borderLeft: '4px solid var(--color-error)' }}>
        <div className="admin-panel-header">
          <h3 className="admin-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} style={{ color: 'var(--color-error)' }} />
            Active Procurement Alerts
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          {MOCK_PROCUREMENT_ALERTS.map((alert, i) => (
            <div 
              key={i} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                padding: '10px 14px', 
                background: alert.severity === 'critical' ? 'var(--color-error-container)' : 'var(--color-amber-container)',
                borderRadius: 'var(--radius-md)',
                color: alert.severity === 'critical' ? 'var(--color-error)' : 'var(--color-amber)',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              <AlertTriangle size={14} />
              <span>{alert.message}</span>
            </div>
          ))}
        </div>
      </div>

      {}
      <div className="admin-panel">
        <div className="admin-panel-header">
          <h3 className="admin-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={18} />
            Open Procurement Requests
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>Automated demand generation</span>
        </div>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product / Material</th>
                <th>Shortage Qty</th>
                <th>Procurement Type</th>
                <th>Generated Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_PROCUREMENT_REQS.map((req, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{req.item}</td>
                  <td style={{ fontWeight: 700, color: 'var(--color-error)' }}>{req.qty} units</td>
                  <td style={{ fontStyle: 'italic', fontSize: '13px' }}>{req.type}</td>
                  <td>{req.date}</td>
                  <td>
                    <span className={`admin-badge admin-badge--${req.statusColor}`}>
                      {req.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </AppShell>
  );
}
