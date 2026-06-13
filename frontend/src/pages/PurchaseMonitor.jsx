import { ShoppingBag, TrendingUp, CheckCircle, Clock, Award } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import '../styles/AdminPages.css';

const MOCK_VENDOR_PERF = [
  { name: 'National Steel Corp', orders: 15, onTime: 14, delayed: 1, score: '93%' },
  { name: 'Apex Wood Supplies', orders: 22, onTime: 19, delayed: 3, score: '86%' },
  { name: 'Premium Fabrics Ltd', orders: 8, onTime: 8, delayed: 0, score: '100%' },
  { name: 'Universal Screws & Fasteners', orders: 12, onTime: 10, delayed: 2, score: '83%' },
];

const MOCK_OPEN_POS = [
  { poNo: 'PO-2009', vendor: 'Apex Wood Supplies', amount: '₹85,000', status: 'confirmed', eta: '2026-06-15' },
  { poNo: 'PO-2008', vendor: 'National Steel Corp', amount: '₹1,20,000', status: 'partial', eta: '2026-06-14' },
  { poNo: 'PO-2007', vendor: 'Universal Screws & Fasteners', amount: '₹15,400', status: 'draft', eta: '2026-06-18' },
  { poNo: 'PO-2006', vendor: 'Premium Fabrics Ltd', amount: '₹45,000', status: 'confirmed', eta: '2026-06-16' },
];

export default function PurchaseMonitor() {
  return (
    <AppShell>
      <div className="animate-page" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {}
      <div className="admin-grid">
        <div className="admin-panel" style={{ flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
          <div className="kpi-icon kpi-icon--blue" style={{ width: '48px', height: '48px' }}><Clock size={22} /></div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>3</div>
            <div style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>Draft Purchase Orders</div>
          </div>
        </div>
        <div className="admin-panel" style={{ flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
          <div className="kpi-icon kpi-icon--primary" style={{ width: '48px', height: '48px' }}><ShoppingBag size={22} /></div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>12</div>
            <div style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>Confirmed Purchase Orders</div>
          </div>
        </div>
        <div className="admin-panel" style={{ flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
          <div className="kpi-icon kpi-icon--warning" style={{ width: '48px', height: '48px' }}><Clock size={22} /></div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>2</div>
            <div style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>Partial Receipts</div>
          </div>
        </div>
        <div className="admin-panel" style={{ flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
          <div className="kpi-icon kpi-icon--green" style={{ width: '48px', height: '48px' }}><CheckCircle size={22} /></div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>87</div>
            <div style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>Fully Received Orders</div>
          </div>
        </div>
      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 'var(--space-6)' }}>
        {}
        <div className="admin-panel">
          <div className="admin-panel-header">
            <h3 className="admin-panel-title">Open Purchase Orders</h3>
            <span style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>Replenishment pipeline</span>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Vendor</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Expected Date</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_OPEN_POS.map((po, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{po.poNo}</td>
                    <td>{po.vendor}</td>
                    <td style={{ fontWeight: 600 }}>{po.amount}</td>
                    <td>
                      <span className={`admin-badge admin-badge--${
                        po.status === 'confirmed' ? 'info' :
                        po.status === 'partial' ? 'warning' : 'info'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{po.eta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {}
        <div className="admin-panel">
          <div className="admin-panel-header">
            <h3 className="admin-panel-title">Vendor Performance Scorecard</h3>
            <Award size={18} className="text-secondary" />
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Vendor Name</th>
                  <th>Total POs</th>
                  <th>On-Time</th>
                  <th>Delayed</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_VENDOR_PERF.map((vend, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{vend.name}</td>
                    <td>{vend.orders}</td>
                    <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>{vend.onTime}</td>
                    <td style={{ color: 'var(--color-error)', fontWeight: 600 }}>{vend.delayed}</td>
                    <td>
                      <span className="admin-badge admin-badge--success" style={{ fontWeight: 700 }}>
                        {vend.score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </AppShell>
  );
}
