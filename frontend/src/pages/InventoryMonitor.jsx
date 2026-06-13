import { useState } from 'react';
import { Layers, Package, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import '../styles/AdminPages.css';

const MOCK_LOW_STOCK = [
  { name: 'Oak Wooden Board', sku: 'RM-OAK-01', onHand: 12, reserved: 8, reorder: 20, status: 'low' },
  { name: 'Steel Framing Screws', sku: 'RM-STL-44', onHand: 150, reserved: 120, reorder: 400, status: 'low' },
  { name: 'Foam Padding Sheet', sku: 'RM-FOM-02', onHand: 3, reserved: 3, reorder: 10, status: 'critical' },
  { name: 'Comfort Cushion Sofa', sku: 'FG-SOF-09', onHand: 1, reserved: 0, reorder: 5, status: 'critical' },
  { name: 'Executive Swivel Chair', sku: 'FG-CHR-21', onHand: 18, reserved: 10, reorder: 15, status: 'normal' },
];

const MOCK_MOVEMENT = {
  today: [
    { label: 'Stock In', value: 120, color: 'var(--color-success)' },
    { label: 'Stock Out', value: 85, color: 'var(--color-primary)' },
    { label: 'Mfg Consumed', value: 95, color: 'var(--color-amber)' },
    { label: 'Mfg Produced', value: 40, color: 'var(--color-secondary)' },
  ],
  weekly: [
    { label: 'Stock In', value: 840, color: 'var(--color-success)' },
    { label: 'Stock Out', value: 680, color: 'var(--color-primary)' },
    { label: 'Mfg Consumed', value: 710, color: 'var(--color-amber)' },
    { label: 'Mfg Produced', value: 320, color: 'var(--color-secondary)' },
  ],
  monthly: [
    { label: 'Stock In', value: 3400, color: 'var(--color-success)' },
    { label: 'Stock Out', value: 2900, color: 'var(--color-primary)' },
    { label: 'Mfg Consumed', value: 2850, color: 'var(--color-amber)' },
    { label: 'Mfg Produced', value: 1250, color: 'var(--color-secondary)' },
  ]
};

export default function InventoryMonitor() {
  const [filter, setFilter] = useState('weekly');
  const movementData = MOCK_MOVEMENT[filter];

  // Compute maximum value in chart for percentage scaling
  const maxValue = Math.max(...movementData.map(d => d.value)) || 100;

  return (
    <AppShell>
      <div className="animate-page" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* ── Section 1: Summary Cards ── */}
      <div className="admin-grid">
        <div className="admin-panel" style={{ flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
          <div className="kpi-icon kpi-icon--primary" style={{ width: '48px', height: '48px' }}><Package size={22} /></div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>142</div>
            <div style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>Total Products Tracked</div>
          </div>
        </div>
        <div className="admin-panel" style={{ flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
          <div className="kpi-icon kpi-icon--blue" style={{ width: '48px', height: '48px' }}><Layers size={22} /></div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>98</div>
            <div style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>Raw Material Items</div>
          </div>
        </div>
        <div className="admin-panel" style={{ flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
          <div className="kpi-icon kpi-icon--green" style={{ width: '48px', height: '48px' }}><Package size={22} /></div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>44</div>
            <div style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>Finished Goods Items</div>
          </div>
        </div>
        <div className="admin-panel" style={{ flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
          <div className="kpi-icon kpi-icon--primary" style={{ width: '48px', height: '48px' }}><TrendingUp size={22} /></div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>₹8,42,500</div>
            <div style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>Total Inventory Value</div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Dual Grid (Movement & Table) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-6)' }}>
        {/* Low Stock Table */}
        <div className="admin-panel">
          <div className="admin-panel-header">
            <h3 className="admin-panel-title">Low Stock Alert Center</h3>
            <span className="admin-badge admin-badge--error">
              <AlertTriangle size={12} /> Action Required
            </span>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>On Hand</th>
                  <th>Reserved</th>
                  <th>Free Qty</th>
                  <th>Reorder</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_LOW_STOCK.map((item, i) => {
                  const freeQty = item.onHand - item.reserved;
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{item.name}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{item.sku}</td>
                      <td>{item.onHand}</td>
                      <td>{item.reserved}</td>
                      <td style={{ fontWeight: 600 }}>{freeQty}</td>
                      <td>{item.reorder}</td>
                      <td>
                        <span className={`admin-badge admin-badge--${item.status === 'critical' ? 'error' : item.status === 'low' ? 'warning' : 'success'}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock Movement Dashboard Chart */}
        <div className="admin-panel">
          <div className="admin-panel-header">
            <h3 className="admin-panel-title">Stock Movement Dashboard</h3>
            <div style={{ display: 'flex', gap: '6px', background: 'var(--surface-low)', padding: '2px', borderRadius: 'var(--radius-full)' }}>
              {['today', 'weekly', 'monthly'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  style={{
                    background: filter === t ? 'var(--color-primary)' : 'none',
                    color: filter === t ? 'var(--color-on-primary)' : 'var(--color-secondary)',
                    border: 'none',
                    borderRadius: 'var(--radius-full)',
                    padding: '4px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* SVG/HTML Custom Bar Chart */}
          <div className="chart-container" style={{ minHeight: '220px' }}>
            {movementData.map((d, i) => {
              const pct = (d.value / maxValue) * 100;
              return (
                <div key={i} className="chart-bar-group">
                  <div 
                    className="chart-bar" 
                    data-value={d.value}
                    style={{ 
                      height: `${pct}%`, 
                      background: d.color,
                      minHeight: '4px'
                    }}
                  />
                  <span className="chart-label" style={{ fontWeight: 600 }}>{d.label}</span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
    </div>
    </AppShell>
  );
}
