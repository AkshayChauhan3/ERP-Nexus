import { useState, useEffect } from 'react';
import { ArrowRightLeft, Plus, Check, Trash2, CheckCircle } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
import '../../styles/Inventory.css';

export default function InvStockTransfers() {
  const [transfers, setTransfers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [sourceWH, setSourceWH] = useState('');
  const [destWH, setDestWH] = useState('');
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState('');

  const loadData = async () => {
    try {
      const [trfsRes, whsRes, prodsRes] = await Promise.all([
        api.get('/inventory/transfers'),
        api.get('/inventory/warehouses'),
        api.get('/products')
      ]);
      setTransfers(trfsRes.data);
      setWarehouses(whsRes.data);
      
      const prods = prodsRes.data || [];
      setProducts(prods);
      
      if (whsRes.data.length > 0) {
        setSourceWH(whsRes.data[0].warehouse_code);
        setDestWH(whsRes.data[1]?.warehouse_code || whsRes.data[0].warehouse_code);
      }
      if (prods.length > 0) {
        setProductId(prods[0].id);
      }
    } catch (err) {
      console.error('Failed to load transfers:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (sourceWH === destWH) {
      alert('Source and Destination Warehouses cannot be the same!');
      return;
    }

    try {
      await api.post('/inventory/transfers', {
        source: sourceWH,
        destination: destWH,
        productId,
        qty: Number(qty),
        reason
      });

      setShowCreate(false);
      setQty(1);
      setReason('');
      setSuccessMsg('Stock Transfer request submitted successfully.');
      setTimeout(() => setSuccessMsg(''), 5000);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to create transfer.');
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.post(`/inventory/transfers/${id}/complete`);
      setSuccessMsg(`Transfer ${id} completed. Inventory balances adjusted.`);
      setTimeout(() => setSuccessMsg(''), 5000);
      loadData();
    } catch (err) {
      alert(err.message || 'Fulfillment Failed.');
    }
  };

  return (
    <AppShell>
      <div className="animate-page inventory-root">
        <div className="inventory-header">
          <div>
            <h2 className="inventory-title">
              <ArrowRightLeft size={22} style={{ color: 'var(--color-primary)' }} />
              Warehouse Stock Transfers
            </h2>
            <p className="inventory-sub">Transfer materials between storehouses with authorization steps.</p>
          </div>
          <button className="btn btn--primary" style={{ gap: '6px' }} onClick={() => setShowCreate(true)}>
            <Plus size={14} /> New Stock Transfer
          </button>
        </div>

        {successMsg && (
          <div style={{ padding: '16px', background: 'rgba(46, 125, 50, 0.08)', borderLeft: '4px solid var(--color-success)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: 'var(--radius-lg)' }}>
            <CheckCircle size={16} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{successMsg}</span>
          </div>
        )}

        <div className="inventory-panel">
          <div className="inventory-panel-header">
            <h3 className="inventory-panel-title">Active & Past Transfers</h3>
          </div>

          <div className="inventory-table-wrapper">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Transfer ID</th>
                  <th>Source WH</th>
                  <th>Destination WH</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Date Requested</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map(t => {
                  const srcName = warehouses.find(w => w.id === t.source)?.name || t.source;
                  const destName = warehouses.find(w => w.id === t.destination)?.name || t.destination;
                  const prodName = products.find(p => p.id === t.productId)?.name || t.productId;
                  return (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 700 }}>{t.id}</td>
                      <td>{srcName}</td>
                      <td>{destName}</td>
                      <td style={{ fontWeight: 600 }}>{prodName}</td>
                      <td>{t.qty} units</td>
                      <td>
                        <span className={`purchase-badge purchase-badge--${
                          t.status === 'Completed' ? 'success' :
                          t.status === 'Pending' ? 'warning' : 'outline'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td>{t.date}</td>
                      <td>
                        {t.status === 'Pending' && (
                          <button className="btn btn--primary" style={{ padding: '6px 12px', fontSize: '11px', gap: '4px' }} onClick={() => handleComplete(t.id)}>
                            <Check size={12} /> Approve & Complete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Transfer Modal */}
        {showCreate && (
          <div className="purchase-modal-backdrop" onClick={() => setShowCreate(false)}>
            <div className="purchase-modal" onClick={e => e.stopPropagation()}>
              <div className="purchase-modal-header">
                <h3 className="purchase-modal-title">New Stock Transfer</h3>
                <button className="purchase-modal-close" onClick={() => setShowCreate(false)}>&times;</button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="purchase-form-row">
                  <div className="purchase-form-group">
                    <label className="purchase-label">Source Warehouse</label>
                    <select className="purchase-input" value={sourceWH} onChange={e => setSourceWH(e.target.value)}>
                      {warehouses.map(w => <option key={w.id} value={w.warehouse_code}>{w.name}</option>)}
                    </select>
                  </div>
                  <div className="purchase-form-group">
                    <label className="purchase-label">Destination Warehouse</label>
                    <select className="purchase-input" value={destWH} onChange={e => setDestWH(e.target.value)}>
                      {warehouses.map(w => <option key={w.id} value={w.warehouse_code}>{w.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="purchase-form-row" style={{ marginTop: '10px' }}>
                  <div className="purchase-form-group">
                    <label className="purchase-label">Product to Move</label>
                    <select className="purchase-input" value={productId} onChange={e => setProductId(e.target.value)}>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku || p.code})</option>)}
                    </select>
                  </div>
                  <div className="purchase-form-group">
                    <label className="purchase-label">Transfer Quantity</label>
                    <input type="number" className="purchase-input" required value={qty} onChange={e => setQty(Math.max(1, Number(e.target.value)))} />
                  </div>
                </div>

                <div className="purchase-form-group" style={{ marginTop: '10px' }}>
                  <label className="purchase-label">Reason / Notes</label>
                  <textarea className="purchase-input" style={{ minHeight: '80px', fontFamily: 'inherit' }} placeholder="Provide logical grounds for physical transfers..." value={reason} onChange={e => setReason(e.target.value)} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                  <button type="button" className="btn btn--secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn btn--primary">Request Transfer</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
