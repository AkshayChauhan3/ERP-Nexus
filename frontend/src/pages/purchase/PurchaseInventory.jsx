import { useState, useEffect } from 'react';
import { Warehouse, Search, AlertTriangle, Filter } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { purchaseApi } from '../../utils/purchaseApi';
import '../../styles/Purchase.css';

export default function PurchaseInventory() {
  const [materials, setMaterials] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All'); // All, Low, Normal

  const loadData = () => {
    setMaterials(purchaseApi.getMaterials());
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = materials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.sku.toLowerCase().includes(search.toLowerCase());
    const isLow = m.currentStock <= m.reorderLevel;
    if (filterType === 'Low') {
      return matchesSearch && isLow;
    }
    if (filterType === 'Normal') {
      return matchesSearch && !isLow;
    }
    return matchesSearch;
  });

  return (
    <AppShell>
      <div className="animate-page purchase-root">
        <div className="purchase-header">
          <div>
            <h2 className="purchase-title">
              <Warehouse size={22} style={{ color: 'var(--color-primary)' }} />
              Inventory Stock Levels
            </h2>
            <p className="purchase-sub">Monitor physical items on hand, reserved quantities, and net available stock counts.</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="purchase-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary)' }} />
              <input
                type="text"
                placeholder="Search raw material stock..."
                className="purchase-input"
                style={{ paddingLeft: '36px' }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Filter size={14} style={{ color: 'var(--color-secondary)' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary)' }}>Status Filter:</span>
              <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-low)', padding: '2px', borderRadius: 'var(--radius-full)' }}>
                {['All', 'Low', 'Normal'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    style={{
                      background: filterType === type ? 'var(--color-primary)' : 'none',
                      color: filterType === type ? 'var(--color-on-primary)' : 'var(--color-secondary)',
                      border: 'none',
                      borderRadius: 'var(--radius-full)',
                      padding: '4px 14px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {type} Stock
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="purchase-panel">
          <div className="purchase-table-wrapper">
            <table className="purchase-table">
              <thead>
                <tr>
                  <th>Material Code</th>
                  <th>Material Description</th>
                  <th>On Hand Stock</th>
                  <th>Reserved Qty</th>
                  <th>Net Available</th>
                  <th>Safety Threshold</th>
                  <th>Stock Health</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => {
                  const free = m.currentStock - m.reservedStock;
                  const isLow = m.currentStock <= m.reorderLevel;
                  return (
                    <tr key={m.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{m.sku}</td>
                      <td style={{ fontWeight: 600 }}>{m.name}</td>
                      <td>{m.currentStock} {m.unit}</td>
                      <td>{m.reservedStock} {m.unit}</td>
                      <td style={{ fontWeight: 700, color: free < 0 ? 'var(--color-error)' : 'inherit' }}>
                        {free} {m.unit}
                      </td>
                      <td>{m.reorderLevel} {m.unit}</td>
                      <td>
                        {isLow ? (
                          <span className="purchase-badge purchase-badge--error" style={{ gap: '4px' }}>
                            <AlertTriangle size={12} /> Low Stock
                          </span>
                        ) : (
                          <span className="purchase-badge purchase-badge--success">Stable</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--color-secondary)' }}>
                      No inventory matched your search.
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
