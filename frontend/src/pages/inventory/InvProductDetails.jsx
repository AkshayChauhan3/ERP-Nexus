import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Package, Search, Clock, ArrowRightLeft, TrendingUp } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { inventoryApi } from '../../utils/inventoryApi';
import '../../styles/Inventory.css';

export default function InvProductDetails() {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [selectedProd, setSelectedProd] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [timeFilter, setTimeFilter] = useState('30days'); // 30days, 90days, 12months

  const loadData = () => {
    const list = inventoryApi.getProducts();
    setProducts(list);
    
    // Check if ID is in URL query parameters
    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get('id');
    const target = list.find(p => p.id === id) || list[0];
    
    if (target) {
      handleSelectProduct(target);
    }
  };

  useEffect(() => {
    loadData();
  }, [location.search]);

  const handleSelectProduct = (p) => {
    setSelectedProd(p);
    const logs = inventoryApi.getLedger().filter(l => l.productId === p.id);
    setLedger(logs);
  };

  return (
    <AppShell>
      <div className="animate-page inventory-root">
        <div className="inventory-header">
          <div>
            <h2 className="inventory-title">
              <Package size={22} style={{ color: 'var(--color-primary)' }} />
              Product Inventory Screen
            </h2>
            <p className="inventory-sub">Detailed metrics, recent stock operations ledger, and movement trends per product.</p>
          </div>
        </div>

        <div className="purchase-split-grid" style={{ gridTemplateColumns: '1.2fr 1.8fr' }}>
          {/* Product Selector */}
          <div className="inventory-panel">
            <div className="inventory-panel-header">
              <h3 className="inventory-panel-title">Product List</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '65vh', overflowY: 'auto' }}>
              {products.map(p => (
                <div
                  key={p.id}
                  onClick={() => handleSelectProduct(p)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-outline-variant)',
                    background: selectedProd?.id === p.id ? 'var(--surface-low)' : 'var(--color-canvas)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    borderLeft: selectedProd?.id === p.id ? '4px solid var(--color-primary)' : '1px solid var(--color-outline-variant)'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>{p.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-secondary)', marginTop: '4px' }}>
                    <span>{p.code}</span>
                    <span>Stock: {p.currentStock} {p.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Details & Logs */}
          {selectedProd && (
            <div className="inventory-panel">
              <div className="inventory-panel-header">
                <div>
                  <h3 className="inventory-panel-title">{selectedProd.name}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Code: {selectedProd.code} • Category: {selectedProd.category}</span>
                </div>
              </div>

              {/* Grid info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Product details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--surface-low)', padding: '16px', borderRadius: 'var(--radius-lg)' }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '13px' }}>Product Profile</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--color-secondary)' }}>Cost Price:</span>
                    <strong style={{ color: 'var(--color-primary)' }}>₹{selectedProd.costPrice.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--color-secondary)' }}>Unit Type:</span>
                    <strong>{selectedProd.unit}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--color-secondary)' }}>Reorder Threshold:</span>
                    <strong>{selectedProd.reorderLevel} {selectedProd.unit}</strong>
                  </div>
                </div>

                {/* Stock levels */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--surface-low)', padding: '16px', borderRadius: 'var(--radius-lg)' }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '13px' }}>Quantities Breakdown</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--color-secondary)' }}>Current on Hand:</span>
                    <strong>{selectedProd.currentStock} {selectedProd.unit}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--color-secondary)' }}>Reserved Stock:</span>
                    <strong>{selectedProd.reservedStock} {selectedProd.unit}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--color-secondary)' }}>Net Available:</span>
                    <strong style={{ color: 'var(--color-success)' }}>{selectedProd.currentStock - selectedProd.reservedStock} {selectedProd.unit}</strong>
                  </div>
                </div>
              </div>

              {/* Movement trend graph simulation */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '13px' }}>Stock Movement Graph</h4>
                  <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-low)', padding: '2px', borderRadius: 'var(--radius-full)' }}>
                    {['30days', '90days', '12months'].map(t => (
                      <button
                        key={t}
                        onClick={() => setTimeFilter(t)}
                        style={{
                          background: timeFilter === t ? 'var(--color-primary)' : 'none',
                          color: timeFilter === t ? 'var(--color-on-primary)' : 'var(--color-secondary)',
                          border: 'none',
                          borderRadius: 'var(--radius-full)',
                          padding: '3px 10px',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {t === '30days' ? 'Last 30 Days' : t === '90days' ? 'Last 90 Days' : '12 Months'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="inventory-chart-container" style={{ height: '100px' }}>
                  {timeFilter === '30days' ? (
                    [
                      { label: 'W1', val: 90 }, { label: 'W2', val: 120 }, { label: 'W3', val: 110 }, { label: 'W4', val: selectedProd.currentStock }
                    ].map((w, i) => (
                      <div key={i} className="inventory-chart-bar-group" style={{ width: '22%' }}>
                        <div className="inventory-chart-bar" data-value={`${w.val} units`} style={{ height: `${(w.val / 250) * 100}%`, width: '40px' }} />
                        <span style={{ fontSize: '10px', color: 'var(--color-secondary)', marginTop: '4px' }}>{w.label}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--color-secondary)', padding: '24px 0' }}>Fulfillment logs trend analytics compiled.</div>
                  )}
                </div>
              </div>

              {/* Transactions Ledger */}
              <div>
                <h4 style={{ margin: '8px 0', fontSize: '13px' }}>Recent Transactions Logs</h4>
                <div className="inventory-table-wrapper">
                  <table className="inventory-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Qty</th>
                        <th>Ref Number</th>
                        <th>Operator</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map(l => (
                        <tr key={l.id}>
                          <td>{l.date}</td>
                          <td>
                            <span className={`purchase-badge purchase-badge--${
                              l.type.includes('In') || l.type.includes('Production') ? 'success' : 'outline'
                            }`}>
                              {l.type}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700, color: l.qty < 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
                            {l.qty > 0 ? `+${l.qty}` : l.qty}
                          </td>
                          <td style={{ fontFamily: 'monospace' }}>{l.refNo}</td>
                          <td>{l.createdBy}</td>
                        </tr>
                      ))}
                      {ledger.length === 0 && (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '16px', color: 'var(--color-secondary)' }}>No transactions found for this product.</td>
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
