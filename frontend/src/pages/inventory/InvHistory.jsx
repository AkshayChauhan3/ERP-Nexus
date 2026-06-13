import { useState, useEffect } from 'react';
import { Clock, Search, Filter } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { inventoryApi } from '../../utils/inventoryApi';
import '../../styles/Inventory.css';

export default function InvHistory() {
  const [activeTab, setActiveTab] = useState('product'); // product, warehouse, adjustment, transfer
  const [ledger, setLedger] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedWH, setSelectedWH] = useState('All');

  useEffect(() => {
    setLedger(inventoryApi.getLedger());
    setAdjustments(inventoryApi.getAdjustments());
    setTransfers(inventoryApi.getTransfers());
    setProducts(inventoryApi.getProducts());
    setWarehouses(inventoryApi.getWarehouses());
  }, []);

  return (
    <AppShell>
      <div className="animate-page inventory-root">
        <div className="inventory-header">
          <div>
            <h2 className="inventory-title">
              <Clock size={22} style={{ color: 'var(--color-primary)' }} />
              Inventory History Analysis
            </h2>
            <p className="inventory-sub">Comprehensive lookup parameters for historical movements, transfers, and corrections.</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="purchase-tabs">
          <button className={`purchase-tab ${activeTab === 'product' ? 'purchase-tab--active' : ''}`} onClick={() => setActiveTab('product')}>Product History</button>
          <button className={`purchase-tab ${activeTab === 'warehouse' ? 'purchase-tab--active' : ''}`} onClick={() => setActiveTab('warehouse')}>Warehouse History</button>
          <button className={`purchase-tab ${activeTab === 'adjustment' ? 'purchase-tab--active' : ''}`} onClick={() => setActiveTab('adjustment')}>Adjustment History</button>
          <button className={`purchase-tab ${activeTab === 'transfer' ? 'purchase-tab--active' : ''}`} onClick={() => setActiveTab('transfer')}>Transfer History</button>
        </div>

        {/* Filters Panel */}
        <div className="inventory-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary)' }} />
              <input
                type="text"
                placeholder="Search history records..."
                className="purchase-input"
                style={{ paddingLeft: '36px' }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary)' }}>Warehouse:</span>
              <select className="purchase-input" style={{ width: '180px', padding: '6px 12px' }} value={selectedWH} onChange={e => setSelectedWH(e.target.value)}>
                <option value="All">All Warehouses</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Data list based on active tab */}
        <div className="inventory-panel">
          <div className="inventory-table-wrapper">
            {activeTab === 'product' && (
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Warehouse</th>
                    <th>Operation Type</th>
                    <th>Change Qty</th>
                    <th>Ref ID</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger
                    .filter(l => selectedWH === 'All' || l.warehouseId === selectedWH)
                    .filter(l => products.find(p => p.id === l.productId)?.name.toLowerCase().includes(search.toLowerCase()) || l.refNo.toLowerCase().includes(search.toLowerCase()))
                    .map(l => (
                      <tr key={l.id}>
                        <td>{l.date}</td>
                        <td style={{ fontWeight: 600 }}>{products.find(p => p.id === l.productId)?.name}</td>
                        <td>{warehouses.find(w => w.id === l.warehouseId)?.name || l.warehouseId}</td>
                        <td>{l.type}</td>
                        <td style={{ fontWeight: 700, color: l.qty < 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
                          {l.qty > 0 ? `+${l.qty}` : l.qty}
                        </td>
                        <td style={{ fontFamily: 'monospace' }}>{l.refNo}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {activeTab === 'warehouse' && (
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Warehouse Name</th>
                    <th>Location</th>
                    <th>Total Item Kinds</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouses
                    .filter(w => selectedWH === 'All' || w.id === selectedWH)
                    .filter(w => w.name.toLowerCase().includes(search.toLowerCase()))
                    .map(w => (
                      <tr key={w.id}>
                        <td style={{ fontWeight: 600 }}>{w.name}</td>
                        <td>{w.location}</td>
                        <td>{products.filter(p => p.warehouseId === w.id).length} items</td>
                        <td>
                          <span className="purchase-badge purchase-badge--success">{w.status}</span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {activeTab === 'adjustment' && (
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Warehouse</th>
                    <th>Correction Qty Diff</th>
                    <th>Adjustment Reason</th>
                    <th>Created By</th>
                  </tr>
                </thead>
                <tbody>
                  {adjustments
                    .filter(a => selectedWH === 'All' || a.warehouseId === selectedWH)
                    .filter(a => products.find(p => p.id === a.productId)?.name.toLowerCase().includes(search.toLowerCase()))
                    .map(a => {
                      const diff = a.newQty - a.oldQty;
                      return (
                        <tr key={a.id}>
                          <td>{a.date}</td>
                          <td style={{ fontWeight: 600 }}>{products.find(p => p.id === a.productId)?.name}</td>
                          <td>{warehouses.find(w => w.id === a.warehouseId)?.name || a.warehouseId}</td>
                          <td style={{ fontWeight: 700, color: diff < 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
                            {diff > 0 ? `+${diff}` : diff}
                          </td>
                          <td>
                            <span className="purchase-badge purchase-badge--outline">{a.reason}</span>
                          </td>
                          <td>{a.createdBy}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}

            {activeTab === 'transfer' && (
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Qty Moved</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers
                    .filter(t => selectedWH === 'All' || t.source === selectedWH || t.destination === selectedWH)
                    .filter(t => products.find(p => p.id === t.productId)?.name.toLowerCase().includes(search.toLowerCase()))
                    .map(t => (
                      <tr key={t.id}>
                        <td>{t.date}</td>
                        <td style={{ fontWeight: 600 }}>{products.find(p => p.id === t.productId)?.name}</td>
                        <td>{warehouses.find(w => w.id === t.source)?.name || t.source}</td>
                        <td>{warehouses.find(w => w.id === t.destination)?.name || t.destination}</td>
                        <td style={{ fontWeight: 700 }}>{t.qty} units</td>
                        <td>
                          <span className={`purchase-badge purchase-badge--${t.status === 'Completed' ? 'success' : 'warning'}`}>{t.status}</span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
