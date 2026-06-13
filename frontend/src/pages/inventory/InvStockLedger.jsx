import { useState, useEffect } from 'react';
import { ClipboardList, Search, Filter } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
import '../../styles/Inventory.css';

export default function InvStockLedger() {
  const [ledger, setLedger] = useState([]);
  const [products, setProducts] = useState([]);

  // Filter states
  const [productFilter, setProductFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  const transactionTypes = [
    'All', 'sale_out', 'purchase_in', 'mfg_consume', 'mfg_produce', 'adjustment'
  ];

  const loadData = async () => {
    try {
      const [ledgerRes, prodRes] = await Promise.all([
        api.get('/stock-ledger/ledger'),
        api.get('/products')
      ]);
      setLedger(ledgerRes.data || []);
      setProducts(prodRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = ledger.filter(l => {
    const matchProd = productFilter === 'All' || l.product_id === productFilter;
    const matchType = typeFilter === 'All' || l.movement_type === typeFilter;
    
    // date matching: l.created_at is ISO
    let matchDate = true;
    if (dateFilter) {
      const lDate = new Date(l.created_at).toISOString().split('T')[0];
      if (lDate !== dateFilter) matchDate = false;
    }
    return matchProd && matchType && matchDate;
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
              <label className="purchase-label">Transaction Type</label>
              <select className="purchase-input" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                {transactionTypes.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
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
                  <th>Date</th>
                  <th>Product</th>
                  <th>Movement Type</th>
                  <th>Quantity</th>
                  <th>Previous Stock</th>
                  <th>New Stock</th>
                  <th>Reference</th>
                  <th>Created By</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id}>
                    <td>{new Date(l.created_at).toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>{l.product?.name || l.product_id}</td>
                    <td>
                      <span className={`purchase-badge purchase-badge--${
                        l.direction === 'in' ? 'success' : 'warning'
                      }`}>
                        {l.movement_type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: l.direction === 'in' ? 'var(--color-success)' : 'var(--color-error)' }}>
                      {l.direction === 'in' ? `+${Number(l.quantity)}` : `-${Number(l.quantity)}`}
                    </td>
                    <td>{Number(l.stock_before)}</td>
                    <td>{Number(l.stock_after)}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{l.reference_type} / {l.reference_id ? l.reference_id.slice(0,8) : '-'}</td>
                    <td>{l.user?.login_id || l.created_by || 'System'}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--color-secondary)' }}>
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
