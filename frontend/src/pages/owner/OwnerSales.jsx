import { useState, useEffect } from 'react';
import { ShoppingCart, RefreshCw, Eye, Download, X } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
import '../../styles/Owner.css';
import '../../styles/Purchase.css';

export default function OwnerSales() {
  const [orders, setOrders] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);

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

  const getOrderAmount = (o) =>
    o.lines?.reduce((s, l) => s + (Number(l.ordered_qty) * Number(l.unit_price)), 0) || 0;

  const totalSalesVal = orders.reduce((sum, o) => sum + getOrderAmount(o), 0);
  const activeOrdersCount = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;

  const handleViewOrder = async (o) => {
    setLoadingOrder(true);
    try {
      const res = await api.get(`/sales-orders/${o.id}`);
      setSelectedOrder(res.data || o);
    } catch (err) {
      console.error('Failed to fetch order details', err);
      setSelectedOrder(o);
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!selectedOrder) return;
    try {
      const authData = JSON.parse(localStorage.getItem('auth_data') || 'null');
      const res = await fetch(`http://localhost:3000/api/sales-orders/${selectedOrder.id}/invoice`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${authData?.accessToken}` }
      });
      if (!res.ok) throw new Error('Failed to generate invoice');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${selectedOrder.order_number || selectedOrder.id.substring(0, 8).toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Invoice download error:', err);
      alert('Failed to download invoice. Please try again.');
    }
  };

  const steps = ['draft', 'confirmed', 'processing', 'delivered', 'cancelled'];

  return (
    <AppShell>
      <div className="animate-page owner-root">
        <div className="owner-header">
          <div>
            <h2 className="owner-title">
              <ShoppingCart size={22} style={{ color: 'var(--color-primary)' }} />
              Sales &amp; Demand Channels
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
            <span className="purchase-kpi-label">Total Orders</span>
            <h3 className="purchase-kpi-val">{orders.length}</h3>
          </div>
          <div className="owner-card">
            <span className="purchase-kpi-label">Orders In Pipeline</span>
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
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Deliver By</th>
                      <th>Value</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id}>
                        <td style={{ fontWeight: 'bold' }}>{o.order_number}</td>
                        <td style={{ fontWeight: 600 }}>{o.customer?.name || 'N/A'}</td>
                        <td>{new Date(o.created_at).toLocaleDateString()}</td>
                        <td>{o.expected_delivery_date ? new Date(o.expected_delivery_date).toLocaleDateString() : 'N/A'}</td>
                        <td style={{ fontWeight: 600 }}>₹{getOrderAmount(o).toLocaleString()}</td>
                        <td>
                          <span className={`health-chip ${o.status === 'delivered' ? 'health-chip--green' : 'health-chip--amber'}`} style={{ textTransform: 'capitalize' }}>
                            {o.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn--secondary"
                            style={{ padding: '6px 12px', fontSize: '11px', gap: '4px' }}
                            onClick={() => handleViewOrder(o)}
                          >
                            <Eye size={12} /> {loadingOrder ? 'Loading...' : 'View Details'}
                          </button>
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
                <h3 className="purchase-panel-title">Finished Goods Stock &amp; Demand</h3>
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

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="purchase-modal-backdrop" onClick={() => setSelectedOrder(null)}>
            <div className="purchase-modal" style={{ maxWidth: '820px' }} onClick={e => e.stopPropagation()}>
              <div className="purchase-modal-header">
                <h3 className="purchase-modal-title">Order Details — {selectedOrder.order_number}</h3>
                <button className="purchase-modal-close" onClick={() => setSelectedOrder(null)}><X size={16} /></button>
              </div>

              {/* Status Timeline */}
              <div className="timeline-track">
                {steps.map((step, idx) => {
                  const currentIdx = steps.indexOf(selectedOrder.status);
                  const isCompleted = currentIdx > idx;
                  const isActive = currentIdx === idx;
                  let stepCls = '';
                  if (isCompleted) stepCls = 'timeline-step--completed';
                  if (isActive) stepCls = 'timeline-step--active';
                  return (
                    <div key={idx} className={`timeline-step ${stepCls}`}>
                      <div className="timeline-dot">{idx + 1}</div>
                      <span className="timeline-label" style={{ textTransform: 'capitalize' }}>{step}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px', marginTop: '20px' }}>
                {/* Order Profile */}
                <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h4 style={{ margin: '0 0 4px 0' }}>Order Profile</h4>
                  <div>Customer: <strong>{selectedOrder.customer?.name || 'N/A'}</strong></div>
                  <div>Order Date: <strong>{new Date(selectedOrder.created_at).toLocaleDateString()}</strong></div>
                  <div>Delivery By: <strong>{selectedOrder.expected_delivery_date ? new Date(selectedOrder.expected_delivery_date).toLocaleDateString() : '-'}</strong></div>
                  <div>Ship To: <strong>{selectedOrder.customer_address || '-'}</strong></div>
                  <div>Remarks: <em>{selectedOrder.remarks || 'None'}</em></div>

                  {/* Download Invoice - always visible to owner */}
                  <div style={{ marginTop: '20px' }}>
                    <button
                      className="btn btn--primary"
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center' }}
                      onClick={handleDownloadInvoice}
                    >
                      <Download size={16} /> Download Invoice
                    </button>
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>Items Ordered</h4>
                  <table className="purchase-table" style={{ fontSize: '12px' }}>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Rate</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.lines?.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{item.product?.name || 'Unknown'}</td>
                          <td>{item.ordered_qty}</td>
                          <td>₹{Number(item.unit_price).toLocaleString()}</td>
                          <td>₹{(item.ordered_qty * item.unit_price).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', fontWeight: 800, fontSize: '15px', marginTop: '12px', color: 'var(--color-primary)' }}>
                    Total Invoice Amount: ₹{(selectedOrder.lines?.reduce((s, l) => s + (l.ordered_qty * l.unit_price), 0) || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
