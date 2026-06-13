import { useState, useEffect } from 'react';
import { ShoppingCart, RefreshCw, ChevronRight, CheckCircle, Package } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { salesApi } from '../../utils/salesApi';
import '../../styles/Owner.css';
import '../../styles/Purchase.css';

export default function OwnerSales() {
  const [orders, setOrders] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSales = () => {
    setLoading(true);
    setTimeout(() => {
      setOrders(salesApi.getOrders());
      setCatalog(salesApi.getCatalog());
      setLoading(false);
    }, 250);
  };

  useEffect(() => {
    loadSales();
  }, []);

  const totalSalesVal = orders.reduce((sum, o) => sum + o.amount, 0);
  const activeOrdersCount = orders.filter(o => o.status !== 'Delivered').length;

  return (
    <AppShell>
      <div className="animate-page owner-root">
        <div className="owner-header">
          <div>
            <h2 className="owner-title">
              <ShoppingCart size={22} style={{ color: 'var(--color-primary)' }} />
              Sales & Demand Channels
            </h2>
            <p className="owner-sub">Consolidated order pipeline, fulfillment velocity, and product revenue performance.</p>
          </div>
          <button className="btn btn--secondary" style={{ gap: '6px' }} onClick={loadSales}>
            <RefreshCw size={14} /> Refresh Sales
          </button>
        </div>

        {/* Sales metrics */}
        <div className="owner-card-grid">
          <div className="owner-card">
            <span className="purchase-kpi-label">Cumulative Sales Value</span>
            <h3 className="purchase-kpi-val" style={{ color: 'var(--color-success)' }}>
              ₹{totalSalesVal.toLocaleString()}
            </h3>
          </div>
          <div className="owner-card">
            <span className="purchase-kpi-label">Total Confirmed Orders</span>
            <h3 className="purchase-kpi-val">{orders.length}</h3>
          </div>
          <div className="owner-card">
            <span className="purchase-kpi-label">Orders In Fulfillment Pipeline</span>
            <h3 className="purchase-kpi-val" style={{ color: 'var(--color-amber)' }}>
              {activeOrdersCount} Processing
            </h3>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: 'var(--color-secondary)' }}>
            <RefreshCw size={32} className="spin" />
            <div style={{ marginTop: '12px' }}>Analyzing sales logs...</div>
          </div>
        ) : (
          <div className="purchase-split-grid">
            {/* Sales Orders List */}
            <div className="purchase-panel" style={{ flex: 1.5 }}>
              <div className="purchase-panel-header">
                <h3 className="purchase-panel-title">Fulfillment Pipeline Ledger</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="purchase-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Deliver By</th>
                      <th>Value</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id}>
                        <td style={{ fontWeight: 'bold' }}>{o.id}</td>
                        <td>{o.orderDate}</td>
                        <td>{o.deliveryDate}</td>
                        <td style={{ fontWeight: 600 }}>₹{o.amount.toLocaleString()}</td>
                        <td>
                          <span className={`health-chip ${o.status === 'Delivered' ? 'health-chip--green' : 'health-chip--amber'}`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Catalog & Demand Status */}
            <div className="purchase-panel" style={{ flex: 1 }}>
              <div className="purchase-panel-header">
                <h3 className="purchase-panel-title">Finished Goods Stock & Demand</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {catalog.map(prod => (
                  <div key={prod.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{prod.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{prod.code} | Avail: {prod.available} | Res: {prod.reserved}</div>
                    </div>
                    <div style={{ fontWeight: 700 }}>₹{prod.price.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
