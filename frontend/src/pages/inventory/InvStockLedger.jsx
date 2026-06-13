import { useState, useEffect } from 'react';
import { ClipboardList, Search, Filter } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { inventoryApi } from '../../utils/inventoryApi';
import '../../styles/Inventory.css';

export default function InvStockLedger() {
  const [ledger, setLedger] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  // Filter states
  const [productFilter, setProductFilter] = useState('All');
  const [warehouseFilter, setWarehouseFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  const transactionTypes = [
    'All', 'Purchase Receipt', 'Manufacturing Consumption', 'Manufacturing Production',
    'Sales Dispatch', 'Customer Return', 'Vendor Return', 'Stock Adjustment', 'Stock Transfer'
  ];

  useEffect(() => {
    setLedger(inventoryApi.getLedger());
    setProducts(inventoryApi.getProducts());
    setWarehouses(inventoryApi.getWarehouses());
  }, []);

  const filtered = ledger.filter(l => {
    const matchProd = productFilter === 'All' || l.productId === productFilter;
    const matchWH = warehouseFilter === 'All' || l.warehouseId === warehouseFilter;
    const matchType = typeFilter === 'All' || l.type.toLowerCase().includes(typeFilter.toLowerCase());
    const matchDate = !dateFilter || l.date === dateFilter;
    return matchProd && matchWH && matchType && matchDate;
  });

  return (
    <AppShell>
      <div className="animate-page inventory-root">
        <div className="inventory-header">
          <div>
            <h2 className="inventory-title">
              <ClipboardList size={22} style={{ color: 'var(--color-primary)' }} />
              Stock Ledger Records
            </h2>
            <p className="inventory-sub">Historical audit logs of every stock transaction, receipt, dispatch, or adjustment.</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="inventory-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <div className="purchase-form-group" style={{ marginBottom: 0 }}>
              <label className="purchase-label">Product</label>
              <select className="purchase-input" value={productFilter} onChange={e => setProductFilter(e.target.value)}>
                <option value="All">All Products</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="purchase-form-group" style={{ marginBottom: 0 }}>
              <label className="purchase-label">Warehouse</label>
              <select className="purchase-input" value={warehouseFilter} onChange={e => setWarehouseFilter(e.target.value)}>
                <option value="All">All Warehouses</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>

            <div className="purchase-form-group" style={{ marginBottom: 0 }}>
              <label className="purchase-label">Transaction Type</label>
              <select className="purchase-input" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                {transactionTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="purchase-form-group" style={{ marginBottom: 0 }}>
              <label className="purchase-label">Transaction Date</label>
              <input type="date" className="purchase-input" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="inventory-panel">
          <div className="inventory-table-wrapper">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Warehouse</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Previous Stock</th>
                  <th>New Stock</th>
                  <th>Ref Number</th>
                  <th>Created By</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => {
                  const prodName = products.find(p => p.id === l.productId)?.name || l.productId;
                  const whName = warehouses.find(w => w.id === l.warehouseId)?.name || l.warehouseId;
                  return (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 700 }}>{l.id}</td>
                      <td>{l.date}</td>
                      <td style={{ fontWeight: 600 }}>{prodName}</td>
                      <td>{whName}</td>
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
                      <td>{l.prevStock}</td>
                      <td>{l.newStock}</td>
                      <td style={{ fontFamily: 'monospace' }}>{l.refNo}</td>
                      <td>{l.createdBy}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '32px', color: 'var(--color-secondary)' }}>
                      No stock ledger entries found.
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
