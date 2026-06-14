import { useState, useEffect } from 'react';
import { ShoppingCart, RefreshCw } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
import '../../styles/Owner.css';
import '../../styles/Purchase.css';

export default function OwnerSales() {
  const [orders, setOrders] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSales = async () => {
    setLoading(true);
    try {
      const [ordRes, catRes] = await Promise.all([
        api.get('/sales-orders'),
        api.get('/products')
      ]);
      setOrders(ordRes.data || []);
      setCatalog(catRes.data || []);
    } catch (err) {
      console.error('Failed to load owner sales view', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  const getOrderAmount = (o) => {
    return o.lines?.reduce((s, l) => s + (Number(l.ordered_qty) * Number(l.unit_price)), 0) || 0;
  };

  const totalSalesVal = orders.reduce((sum, o) => sum + getOrderAmount(o), 0);
  const activeOrdersCount = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;

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
                        <td style={{ fontWeight: 'bold' }}>{o.order_number}</td>
                        <td>{new Date(o.created_at).toLocaleDateString()}</td>
                        <td>{o.expected_delivery_date ? new Date(o.expected_delivery_date).toLocaleDateString() : 'N/A'}</td>
                        <td style={{ fontWeight: 600 }}>₹{getOrderAmount(o).toLocaleString()}</td>
                        <td>
                          <span className={`health-chip ${o.status === 'delivered' ? 'health-chip--green' : 'health-chip--amber'}`} style={{ textTransform: 'capitalize' }}>
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
                {catalog.map(prod => {
                  const onHand = Number(prod.inventory?.on_hand_qty || 0);
                  const reserved = Number(prod.inventory?.reserved_qty || 0);
                  const available = Math.max(0, onHand - reserved);
                  return (
                    <div key={prod.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{prod.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{prod.sku || 'N/A'} | Avail: {available} | Res: {reserved}</div>
                      </div>
                      <div style={{ fontWeight: 700 }}>₹{Number(prod.sales_price).toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
