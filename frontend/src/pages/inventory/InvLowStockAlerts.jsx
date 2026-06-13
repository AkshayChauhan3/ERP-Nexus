import { useState, useEffect } from 'react';
import { AlertTriangle, Bell, Zap, Eye, CheckCircle } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { inventoryApi } from '../../utils/inventoryApi';
import '../../styles/Inventory.css';

export default function InvLowStockAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = () => {
    const prods = inventoryApi.getProducts();
    // Filter low stock
    const items = prods.filter(p => p.currentStock <= p.reorderLevel).map(p => {
      const shortage = p.reorderLevel - p.currentStock;
      const suggested = Math.max(shortage * 2, 10);
      
      // priority logic
      let priority = 'Medium';
      let cls = 'warning';
      if (p.currentStock === 0) {
        priority = 'Critical';
        cls = 'error';
      } else if (p.currentStock < p.reorderLevel * 0.3) {
        priority = 'High';
        cls = 'error';
      } else if (p.currentStock > p.reorderLevel * 0.8) {
        priority = 'Low';
        cls = 'outline';
      }

      return {
        id: p.id,
        code: p.code,
        name: p.name,
        currentStock: p.currentStock,
        reorderLevel: p.reorderLevel,
        unit: p.unit,
        shortage,
        suggested,
        priority,
        cls,
        preferredVendor: 'VEND-001' // Mock vendor
      };
    });

    setAlerts(items);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleNotify = (item) => {
    setSuccessMsg(`Fulfillment notification dispatched to Purchase Team for: ${item.name}.`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleCreateRequest = (item) => {
    setSuccessMsg(`Purchase Request PR-${Math.round(Math.random()*10000)} logged for ${item.suggested} ${item.unit} of ${item.name}.`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  return (
    <AppShell>
      <div className="animate-page inventory-root">
        <div className="inventory-header">
          <div>
            <h2 className="inventory-title">
              <AlertTriangle size={22} style={{ color: 'var(--color-error)' }} />
              Low Stock Alert Center
            </h2>
            <p className="inventory-sub">Critical shortage warning board with replenishment lot suggestion alerts.</p>
          </div>
        </div>

        {successMsg && (
          <div style={{ padding: '16px', background: 'rgba(46, 125, 50, 0.08)', borderLeft: '4px solid var(--color-success)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: 'var(--radius-lg)' }}>
            <CheckCircle size={16} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{successMsg}</span>
          </div>
        )}

        <div className="inventory-panel">
          <div className="inventory-panel-header">
            <h3 className="inventory-panel-title">Active Depleted Alerts</h3>
          </div>

          <div className="inventory-table-wrapper">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Product Code</th>
                  <th>Product Name</th>
                  <th>Stock Health</th>
                  <th>Current Stock</th>
                  <th>Reorder Level</th>
                  <th>Shortage</th>
                  <th>Suggested Refill</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontFamily: 'monospace' }}>{item.code}</td>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td>
                      <span className={`purchase-badge purchase-badge--${item.cls}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--color-error)' }}>{item.currentStock} {item.unit}</td>
                    <td>{item.reorderLevel} {item.unit}</td>
                    <td style={{ fontWeight: 700 }}>{item.shortage} {item.unit}</td>
                    <td style={{ fontWeight: 700, color: 'var(--color-success)' }}>{item.suggested} {item.unit}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn--secondary" style={{ padding: '6px 12px', fontSize: '11px', gap: '4px' }} title="Notify Purchase Team" onClick={() => handleNotify(item)}>
                          <Bell size={12} /> Notify
                        </button>
                        <button className="btn btn--primary" style={{ padding: '6px 12px', fontSize: '11px', gap: '4px' }} onClick={() => handleCreateRequest(item)}>
                          <Zap size={12} /> Create PR
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {alerts.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--color-secondary)' }}>
                      ✓ All stock levels are healthy! No active replenishment alerts.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
