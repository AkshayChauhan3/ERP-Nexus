import { useState, useEffect } from 'react';
import { Warehouse, MapPin, User, BarChart2, ShieldAlert } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { inventoryApi } from '../../utils/inventoryApi';
import '../../styles/Inventory.css';

export default function InvWarehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedWH, setSelectedWH] = useState(null);

  // Stored items
  const [storedItems, setStoredItems] = useState([]);
  const [usedCapacity, setUsedCapacity] = useState(0);

  const loadData = () => {
    const whs = inventoryApi.getWarehouses();
    const prods = inventoryApi.getProducts();
    setWarehouses(whs);
    setProducts(prods);
    if (whs.length > 0 && !selectedWH) {
      handleSelectWH(whs[0], prods);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectWH = (wh, allProds = products) => {
    setSelectedWH(wh);
    const items = allProds.filter(p => p.warehouseId === wh.id);
    setStoredItems(items);
    
    // Calculate total stock qty stored in this warehouse
    const totalQty = items.reduce((sum, item) => sum + item.currentStock, 0);
    setUsedCapacity(totalQty);
  };

  return (
    <AppShell>
      <div className="animate-page inventory-root">
        <div className="inventory-header">
          <div>
            <h2 className="inventory-title">
              <Warehouse size={22} style={{ color: 'var(--color-primary)' }} />
              Warehouse Management
            </h2>
            <p className="inventory-sub">Monitor storehouse capacities, stock distribution, and layout configuration.</p>
          </div>
        </div>

        <div className="purchase-split-grid" style={{ gridTemplateColumns: '1.2fr 1.8fr' }}>
          {/* Warehouse list */}
          <div className="inventory-panel">
            <div className="inventory-panel-header">
              <h3 className="inventory-panel-title">Warehouses</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {warehouses.map(w => {
                const whItems = products.filter(p => p.warehouseId === w.id);
                const whQty = whItems.reduce((sum, item) => sum + item.currentStock, 0);
                const utilization = Math.min(Math.round((whQty / w.capacity) * 100), 100);

                return (
                  <div
                    key={w.id}
                    onClick={() => handleSelectWH(w)}
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-outline-variant)',
                      background: selectedWH?.id === w.id ? 'var(--surface-low)' : 'var(--color-canvas)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      borderLeft: selectedWH?.id === w.id ? '4px solid var(--color-primary)' : '1px solid var(--color-outline-variant)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-secondary)' }}>{w.id}</span>
                      <span className="purchase-badge purchase-badge--success" style={{ fontSize: '10px' }}>{w.status}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '4px' }}>{w.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-secondary)', marginTop: '2px' }}>Manager: {w.manager}</div>
                    
                    {/* Progress bar */}
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                        <span>Capacity Utilization</span>
                        <strong>{utilization}%</strong>
                      </div>
                      <div style={{ height: '5px', background: 'var(--surface-high)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${utilization}%`, background: utilization > 85 ? 'var(--color-error)' : 'var(--color-primary)' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details & Stored items */}
          {selectedWH && (
            <div className="inventory-panel">
              <div className="inventory-panel-header">
                <div>
                  <h3 className="inventory-panel-title">{selectedWH.name}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{selectedWH.id} • Storehouse Configuration</span>
                </div>
              </div>

              {/* Stats overview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', background: 'var(--surface-low)', padding: '16px', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <MapPin size={16} style={{ color: 'var(--color-secondary)' }} />
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--color-secondary)', display: 'block' }}>LOCATION</span>
                    <strong>{selectedWH.location}</strong>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <User size={16} style={{ color: 'var(--color-secondary)' }} />
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--color-secondary)', display: 'block' }}>MANAGER</span>
                    <strong>{selectedWH.manager}</strong>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--color-secondary)', display: 'block' }}>TOTAL VALUE</span>
                  <strong>₹{selectedWH.value.toLocaleString()}</strong>
                </div>
              </div>

              {/* Capacity circle gauges */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '20px', alignItems: 'center', border: '1px solid var(--color-outline-variant)', padding: '16px', borderRadius: 'var(--radius-lg)' }}>
                <div className="capacity-gauge-wrapper">
                  <div className="capacity-gauge-text">
                    {Math.round((usedCapacity / selectedWH.capacity) * 100)}%
                    <span className="capacity-gauge-sub">Used</span>
                  </div>
                  {/* Circle SVG */}
                  <svg viewBox="0 0 100 100" width="100" height="100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--surface-high)" strokeWidth="8" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-primary)" strokeWidth="8"
                      strokeDasharray="251"
                      strokeDashoffset={251 - (251 * Math.min(usedCapacity / selectedWH.capacity, 1))}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div>Total Volume Capacity: <strong>{selectedWH.capacity} units</strong></div>
                  <div>Used Volume Space: <strong>{usedCapacity} units</strong></div>
                  <div>Available Volume Space: <strong style={{ color: 'var(--color-success)' }}>{selectedWH.capacity - usedCapacity} units</strong></div>
                </div>
              </div>

              {/* Stored items table */}
              <div>
                <h4 style={{ margin: '8px 0', fontSize: '13px' }}>Products Stored</h4>
                <div className="inventory-table-wrapper">
                  <table className="inventory-table">
                    <thead>
                      <tr>
                        <th>Product Code</th>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Available Stock</th>
                        <th>Cost Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storedItems.map(item => (
                        <tr key={item.id}>
                          <td style={{ fontFamily: 'monospace' }}>{item.code}</td>
                          <td style={{ fontWeight: 600 }}>{item.name}</td>
                          <td>{item.category}</td>
                          <td style={{ fontWeight: 700 }}>{item.currentStock} {item.unit}</td>
                          <td>₹{(item.currentStock * item.costPrice).toLocaleString()}</td>
                        </tr>
                      ))}
                      {storedItems.length === 0 && (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '16px', color: 'var(--color-secondary)' }}>No products stored in this warehouse.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
