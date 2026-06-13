import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, ClipboardList, Clock, CheckCircle, AlertTriangle, FileText, TrendingUp,
  Plus, ArrowDownLeft, Upload, ArrowRight, Zap, RefreshCw
} from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { purchaseApi } from '../../utils/purchaseApi';
import '../../styles/Purchase.css';

export default function PurchaseDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPOs: 0,
    pending: 0,
    partial: 0,
    fullyReceived: 0,
    delayed: 0,
    pendingBills: 0,
    lowStock: 0,
    totalValue: 0
  });

  const [recentPOs, setRecentPOs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      setLoading(true);
      const pos = purchaseApi.getPOs();
      const mats = purchaseApi.getMaterials();
      const bills = purchaseApi.getBills();

      const totalPOs = pos.length;
      const pending = pos.filter(p => p.receiptStatus === 'Pending' && p.status !== 'Draft').length;
      const partial = pos.filter(p => p.receiptStatus === 'Partial').length;
      const fullyReceived = pos.filter(p => p.receiptStatus === 'Fully Received').length;
      const delayed = pos.filter(p => p.status === 'Confirmed' && new Date(p.deliveryDate) < new Date()).length;
      const pendingBills = bills.filter(b => b.status === 'Submitted').length;
      const lowStock = mats.filter(m => m.currentStock <= m.reorderLevel).length;
      const totalValue = pos.reduce((sum, p) => sum + (p.status !== 'Draft' ? p.totalValue : 0), 0);

      setStats({
        totalPOs, pending, partial, fullyReceived, delayed, pendingBills, lowStock, totalValue
      });
      setRecentPOs(pos.slice(-4).reverse());
      setLoading(false);
    };

    loadData();
  }, []);

  return (
    <AppShell>
      <div className="animate-page purchase-root">
        <div className="purchase-header">
          <div>
            <h2 className="purchase-title">
              <ShoppingBag size={24} style={{ color: 'var(--color-primary)' }} />
              Purchase & Inventory Operations
            </h2>
            <p className="purchase-sub">Manage procurement pipeline, goods receipts, and vendor bills.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn--primary" style={{ gap: '6px' }} onClick={() => navigate('/purchase/orders')}>
              <Plus size={14} /> Create PO
            </button>
            <button className="btn btn--secondary" style={{ gap: '6px' }} onClick={() => navigate('/purchase/goods-receipts')}>
              <ArrowDownLeft size={14} /> Receive Material
            </button>
            <button className="btn btn--secondary" style={{ gap: '6px' }} onClick={() => navigate('/purchase/vendor-bills')}>
              <Upload size={14} /> Upload Bill
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: 'var(--color-secondary)' }}>
            <RefreshCw size={32} className="spin" />
            <div style={{ marginTop: '12px' }}>Loading Dashboard Data...</div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="purchase-kpi-grid">
              <div className="purchase-kpi-card">
                <div className="purchase-kpi-icon purchase-kpi-icon--blue"><ShoppingBag size={20} /></div>
                <div>
                  <div className="purchase-kpi-val">{stats.totalPOs}</div>
                  <div className="purchase-kpi-label">Total Purchase Orders</div>
                </div>
              </div>
              <div className="purchase-kpi-card">
                <div className="purchase-kpi-icon purchase-kpi-icon--warning"><Clock size={20} /></div>
                <div>
                  <div className="purchase-kpi-val">{stats.pending}</div>
                  <div className="purchase-kpi-label">Pending Orders</div>
                </div>
              </div>
              <div className="purchase-kpi-card">
                <div className="purchase-kpi-icon purchase-kpi-icon--warning"><Clock size={20} /></div>
                <div>
                  <div className="purchase-kpi-val">{stats.partial}</div>
                  <div className="purchase-kpi-label">Partially Received</div>
                </div>
              </div>
              <div className="purchase-kpi-card">
                <div className="purchase-kpi-icon purchase-kpi-icon--green"><CheckCircle size={20} /></div>
                <div>
                  <div className="purchase-kpi-val">{stats.fullyReceived}</div>
                  <div className="purchase-kpi-label">Fully Received</div>
                </div>
              </div>
              <div className="purchase-kpi-card">
                <div className="purchase-kpi-icon purchase-kpi-icon--error"><AlertTriangle size={20} /></div>
                <div>
                  <div className="purchase-kpi-val">{stats.delayed}</div>
                  <div className="purchase-kpi-label">Delayed Orders</div>
                </div>
              </div>
              <div className="purchase-kpi-card">
                <div className="purchase-kpi-icon purchase-kpi-icon--blue"><FileText size={20} /></div>
                <div>
                  <div className="purchase-kpi-val">{stats.pendingBills}</div>
                  <div className="purchase-kpi-label">Bills Pending Payment</div>
                </div>
              </div>
              <div className="purchase-kpi-card">
                <div className="purchase-kpi-icon purchase-kpi-icon--error"><AlertTriangle size={20} /></div>
                <div>
                  <div className="purchase-kpi-val">{stats.lowStock}</div>
                  <div className="purchase-kpi-label">Low Stock Materials</div>
                </div>
              </div>
              <div className="purchase-kpi-card">
                <div className="purchase-kpi-icon purchase-kpi-icon--green"><TrendingUp size={20} /></div>
                <div>
                  <div className="purchase-kpi-val">₹{stats.totalValue.toLocaleString()}</div>
                  <div className="purchase-kpi-label">Total Purchase Value</div>
                </div>
              </div>
            </div>

            {/* Split Grid */}
            <div className="purchase-split-grid">
              {/* Recent POs */}
              <div className="purchase-panel">
                <div className="purchase-panel-header">
                  <h3 className="purchase-panel-title">Recent Purchase Orders</h3>
                  <button className="btn btn--secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => navigate('/purchase/orders')}>
                    View All <ArrowRight size={12} />
                  </button>
                </div>
                <div className="purchase-table-wrapper">
                  <table className="purchase-table">
                    <thead>
                      <tr>
                        <th>PO ID</th>
                        <th>Date</th>
                        <th>Total Value</th>
                        <th>Receipt Status</th>
                        <th>Bill Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPOs.map(po => (
                        <tr key={po.id}>
                          <td style={{ fontWeight: 700 }}>{po.id}</td>
                          <td>{po.orderDate}</td>
                          <td style={{ fontWeight: 600 }}>₹{po.totalValue.toLocaleString()}</td>
                          <td>
                            <span className={`purchase-badge purchase-badge--${
                              po.receiptStatus === 'Fully Received' ? 'success' :
                              po.receiptStatus === 'Partial' ? 'warning' : 'outline'
                            }`}>
                              {po.receiptStatus}
                            </span>
                          </td>
                          <td>
                            <span className={`purchase-badge purchase-badge--${
                              po.billStatus === 'Paid' ? 'success' :
                              po.billStatus === 'Submitted' ? 'primary' : 'outline'
                            }`}>
                              {po.billStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* EN Advisor Recommendations */}
              <div className="purchase-panel">
                <div className="purchase-panel-header">
                  <h3 className="purchase-panel-title">
                    <Zap size={16} style={{ color: 'var(--color-amber)' }} />
                    Procurement Advisor
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {stats.lowStock > 0 ? (
                    <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: 'var(--radius-lg)', borderLeft: '4px solid var(--color-error)' }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: 'var(--color-error)' }}>Low Stock Detected</h4>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-secondary)' }}>
                        {stats.lowStock} raw materials are below their critical safety thresholds. You should review procurement suggestions.
                      </p>
                      <button className="btn btn--secondary" style={{ marginTop: '10px', padding: '6px 12px', fontSize: '11px' }} onClick={() => navigate('/purchase/procurement')}>
                        Open Procurement
                      </button>
                    </div>
                  ) : (
                    <div style={{ padding: '16px', background: 'rgba(46, 125, 50, 0.08)', borderRadius: 'var(--radius-lg)', borderLeft: '4px solid var(--color-success)' }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: 'var(--color-success)' }}>All Stocks Stable</h4>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-secondary)' }}>
                        No material shortages detected. Reorder thresholds are satisfied.
                      </p>
                    </div>
                  )}
                  <div style={{ padding: '16px', background: 'var(--surface-low)', borderRadius: 'var(--radius-lg)' }}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '14px' }}>Pending Deliveries</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-secondary)' }}>
                      {stats.pending + stats.partial} POs are waiting for physical goods receipts. Verify incoming materials at the loading dock.
                    </p>
                    <button className="btn btn--secondary" style={{ marginTop: '10px', padding: '6px 12px', fontSize: '11px' }} onClick={() => navigate('/purchase/goods-receipts')}>
                      Receive Deliveries
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
