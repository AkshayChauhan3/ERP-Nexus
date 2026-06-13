import { useState, useEffect } from 'react';
import { Warehouse, RefreshCw, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { purchaseApi } from '../../utils/purchaseApi';
import '../../styles/Owner.css';
import '../../styles/Purchase.css';

export default function OwnerInventory() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadStock = () => {
    setLoading(true);
    setTimeout(() => {
      setMaterials(purchaseApi.getMaterials());
      setLoading(false);
    }, 250);
  };

  useEffect(() => {
    loadStock();
  }, []);

  const totalValuation = materials.reduce((sum, mat) => sum + (mat.currentStock * mat.price), 0);
  const lowStockCount = materials.filter(mat => mat.currentStock <= mat.reorderLevel).length;

  return (
    <AppShell>
      <div className="animate-page owner-root">
        <div className="owner-header">
          <div>
            <h2 className="owner-title">
              <Warehouse size={22} style={{ color: 'var(--color-primary)' }} />
              Inventory Valuations & Monitoring
            </h2>
            <p className="owner-sub">Consolidated inventory asset evaluation, stock levels, and safety warnings.</p>
          </div>
          <button className="btn btn--secondary" style={{ gap: '6px' }} onClick={loadStock}>
            <RefreshCw size={14} /> Refresh Stocks
          </button>
        </div>

        {/* Valuation and Alerts KPIs */}
        <div className="owner-card-grid">
          <div className="owner-card">
            <span className="purchase-kpi-label">Estimated Stock Value</span>
            <h3 className="purchase-kpi-val" style={{ color: 'var(--color-success)' }}>
              ₹{totalValuation.toLocaleString()}
            </h3>
          </div>
          <div className="owner-card">
            <span className="purchase-kpi-label">Total Unique SKUs</span>
            <h3 className="purchase-kpi-val">{materials.length} Items</h3>
          </div>
          <div className="owner-card" style={{ background: lowStockCount > 0 ? 'rgba(239, 68, 68, 0.08)' : '' }}>
            <span className="purchase-kpi-label">Critical Reorder Alerts</span>
            <h3 className="purchase-kpi-val" style={{ color: lowStockCount > 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
              {lowStockCount} items low
            </h3>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: 'var(--color-secondary)' }}>
            <RefreshCw size={32} className="spin" />
            <div style={{ marginTop: '12px' }}>Auditing stock registers...</div>
          </div>
        ) : (
          <div className="purchase-panel">
            <div className="purchase-panel-header">
              <h3 className="purchase-panel-title">Master Stock Valuation Registry</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="purchase-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>SKU Code</th>
                    <th>Current Stock</th>
                    <th>Safety Threshold</th>
                    <th>Unit Cost</th>
                    <th>Total Value</th>
                    <th>Alert Status</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map(mat => {
                    const isLow = mat.currentStock <= mat.reorderLevel;
                    const stockVal = mat.currentStock * mat.price;
                    return (
                      <tr key={mat.id}>
                        <td style={{ fontWeight: 600 }}>{mat.name}</td>
                        <td style={{ fontFamily: 'monospace' }}>{mat.sku}</td>
                        <td style={{ fontWeight: 600 }}>{mat.currentStock} {mat.unit}</td>
                        <td>{mat.reorderLevel} {mat.unit}</td>
                        <td>₹{mat.price.toLocaleString()}</td>
                        <td style={{ fontWeight: 600 }}>₹{stockVal.toLocaleString()}</td>
                        <td>
                          <span className={`health-chip ${isLow ? 'health-chip--red' : 'health-chip--green'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {isLow ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                            {isLow ? 'Restock Required' : 'Adequate'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
