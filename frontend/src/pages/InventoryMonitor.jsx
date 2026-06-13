import { useState, useEffect } from 'react';
import { Layers, Package, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import { api } from '../utils/api';
import '../styles/AdminPages.css';

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
  const [lowStock, setLowStock] = useState([]);
  const [stats, setStats] = useState({ total: 0, raw: 0, finished: 0, value: 0 });
  const movementData = MOCK_MOVEMENT[filter];
  const maxValue = Math.max(...movementData.map(d => d.value)) || 100;

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await api.get('/products');
        const products = res.data || [];
        
        let total = products.length;
        let raw = 0;
        let finished = 0;
        let value = 0;
        let alerts = [];

        products.forEach(p => {
          if (p.type === 'RAW_MATERIAL') raw++;
          if (p.type === 'FINISHED_GOOD') finished++;
          
          const onHand = parseFloat(p.inventory?.on_hand_qty) || 0;
          const reserved = parseFloat(p.inventory?.reserved_qty) || 0;
          const reorder = parseFloat(p.inventory?.reorder_level) || 0;
          const cost = parseFloat(p.cost_price) || 0;

          value += (onHand * cost);

          if (onHand <= reorder) {
            alerts.push({
              name: p.name,
              sku: p.sku || 'N/A',
              onHand,
              reserved,
              reorder,
              status: onHand === 0 ? 'critical' : 'low'
            });
          }
        });

        setStats({ total, raw, finished, value });
        setLowStock(alerts);
      } catch (err) {
        console.error('Failed to load inventory', err);
      }
    };
    fetchInventory();
  }, []);

  return (
    <AppShell>
      <div className="animate-page" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {}
      <div className="admin-grid">
        <div className="admin-panel" style={{ flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
          <div className="kpi-icon kpi-icon--primary" style={{ width: '48px', height: '48px' }}><Package size={22} /></div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.total}</div>
            <div style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>Total Products Tracked</div>
          </div>
        </div>
        <div className="admin-panel" style={{ flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
          <div className="kpi-icon kpi-icon--blue" style={{ width: '48px', height: '48px' }}><Layers size={22} /></div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.raw}</div>
            <div style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>Raw Material Items</div>
          </div>
        </div>
        <div className="admin-panel" style={{ flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
          <div className="kpi-icon kpi-icon--green" style={{ width: '48px', height: '48px' }}><Package size={22} /></div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.finished}</div>
            <div style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>Finished Goods Items</div>
          </div>
        </div>
        <div className="admin-panel" style={{ flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
          <div className="kpi-icon kpi-icon--primary" style={{ width: '48px', height: '48px' }}><TrendingUp size={22} /></div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>₹{stats.value.toLocaleString()}</div>
            <div style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>Total Inventory Value</div>
          </div>
        </div>
      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-6)' }}>
        {}
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
                {lowStock.map((item, i) => {
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
            {lowStock.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-secondary)' }}>
                No low stock alerts at this time.
              </div>
            )}
          </div>
        </div>

        {}
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

          {}
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
