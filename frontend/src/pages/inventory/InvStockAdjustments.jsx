import { useState, useEffect } from 'react';
import { Settings, Plus, Check, RefreshCw } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
import '../../styles/Inventory.css';

export default function InvStockAdjustments() {
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  // Modals
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [productId, setProductId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [currentQty, setCurrentQty] = useState(0);
  const [adjustedQty, setAdjustedQty] = useState(0);
  const [reason, setReason] = useState('Physical Count Correction');
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);

  const reasons = ['Damage', 'Expired', 'Lost', 'Physical Count Correction', 'System Error'];

  const loadData = async () => {
    try {
      const [adjRes, invRes, whsRes] = await Promise.all([
        api.get('/inventory/adjustments'),
        api.get('/inventory'),
        api.get('/inventory/warehouses')
      ]);
      setAdjustments(adjRes.data);
      const invProducts = invRes.data || [];
      setProducts(invProducts);
      setWarehouses(whsRes.data);
      
      if (invProducts.length > 0) {
        setSelectedProductIndex(0);
        setProductId(invProducts[0].productId);
        setWarehouseId(invProducts[0].warehouseId);
        setCurrentQty(invProducts[0].currentStock);
        setAdjustedQty(invProducts[0].currentStock);
      }
    } catch (err) {
      console.error('Failed to load adjustments:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProductIndexSelect = (index) => {
    setSelectedProductIndex(index);
    const target = products[index];
    if (target) {
      setProductId(target.productId);
      setWarehouseId(target.warehouseId);
      setCurrentQty(target.currentStock);
      setAdjustedQty(target.currentStock);
    }
  };

  const handleAdjustmentSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory/adjustments', {
        productId,
        warehouseId,
        adjustedQuantity: Number(adjustedQty),
        reason
      });

      setShowForm(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to log adjustment.');
    }
  };

  return (
    <AppShell>
      <div className="animate-page inventory-root">
        <div className="inventory-header">
          <div>
            <h2 className="inventory-title">
              <Settings size={22} style={{ color: 'var(--color-primary)' }} />
              Stock Adjustments
            </h2>
            <p className="inventory-sub">Correct physical counts, log damaged goods, or update system errors.</p>
          </div>
          <button className="btn btn--primary" style={{ gap: '6px' }} onClick={() => setShowForm(true)}>
            <Plus size={14} /> New Stock Adjustment
          </button>
        </div>

        {/* History Table */}
        <div className="inventory-panel">
          <div className="inventory-panel-header">
            <h3 className="inventory-panel-title">Adjustment History Log</h3>
          </div>

          <div className="inventory-table-wrapper">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Adjustment ID</th>
                  <th>Product</th>
                  <th>Warehouse</th>
                  <th>Old Quantity</th>
                  <th>New Quantity</th>
                  <th>Difference</th>
                  <th>Reason</th>
                  <th>Operator</th>
                  <th>Logged Date</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.map(adj => {
                  const prodName = products.find(p => p.id === adj.productId)?.name || adj.productId;
                  const whName = warehouses.find(w => w.id === adj.warehouseId)?.name || adj.warehouseId;
                  const diff = adj.newQty - adj.oldQty;
                  return (
                    <tr key={adj.id}>
                      <td style={{ fontWeight: 700 }}>{adj.id}</td>
                      <td style={{ fontWeight: 600 }}>{prodName}</td>
                      <td>{whName}</td>
                      <td>{adj.oldQty}</td>
                      <td>{adj.newQty}</td>
                      <td style={{ fontWeight: 700, color: diff < 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
                        {diff > 0 ? `+${diff}` : diff}
                      </td>
                      <td>
                        <span className="purchase-badge purchase-badge--outline">{adj.reason}</span>
                      </td>
                      <td>{adj.createdBy}</td>
                      <td>{adj.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="purchase-modal-backdrop" onClick={() => setShowForm(false)}>
            <div className="purchase-modal" onClick={e => e.stopPropagation()}>
              <div className="purchase-modal-header">
                <h3 className="purchase-modal-title">Record Stock Correction</h3>
                <button className="purchase-modal-close" onClick={() => setShowForm(false)}>&times;</button>
              </div>
              <form onSubmit={handleAdjustmentSubmit}>
                <div className="purchase-form-group">
                  <label className="purchase-label">Select Product & Warehouse</label>
                  <select className="purchase-input" value={selectedProductIndex} onChange={e => handleProductIndexSelect(Number(e.target.value))}>
                    {products.map((p, idx) => (
                      <option key={idx} value={idx}>
                        {p.name} - {p.warehouseId} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="purchase-form-row" style={{ marginTop: '10px' }}>
                  <div className="purchase-form-group">
                    <label className="purchase-label">System Count (On Hand)</label>
                    <input type="number" className="purchase-input" disabled value={currentQty} />
                  </div>
                  <div className="purchase-form-group">
                    <label className="purchase-label">Physical Counted Quantity</label>
                    <input type="number" className="purchase-input" required value={adjustedQty} onChange={e => setAdjustedQty(Math.max(0, Number(e.target.value)))} />
                  </div>
                </div>

                <div className="purchase-form-group" style={{ marginTop: '10px' }}>
                  <label className="purchase-label">Reason for Discrepancy</label>
                  <select className="purchase-input" value={reason} onChange={e => setReason(e.target.value)}>
                    {reasons.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                  <button type="button" className="btn btn--secondary" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn--primary">Log Adjustment</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
