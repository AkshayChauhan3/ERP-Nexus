import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, ClipboardList, Clock, CheckCircle, AlertTriangle, FileText, TrendingUp,
  Plus, ArrowDownLeft, Upload, ArrowRight, Zap, RefreshCw
} from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
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
    const loadData = async () => {
      setLoading(true);
      try {
        const [posRes, matRes, billsRes] = await Promise.all([
          api.get('/purchase-orders'),
          api.get('/products'),
          api.get('/purchase/bills')
        ]);
        
        const pos = posRes.data || [];
        const mats = (matRes.data || []).filter(p => p.type === 'RAW_MATERIAL');
        const bills = billsRes.data || [];

        const totalPOs = pos.length;
        const pending = pos.filter(p => p.status === 'confirmed').length;
        const partial = pos.filter(p => p.status === 'partially_received').length;
        const fullyReceived = pos.filter(p => p.status === 'received').length;
        const delayed = 0; 
        const pendingBills = bills.filter(b => b.status === 'pending_payment' || b.status === 'approved_for_payment').length;
        const lowStock = mats.filter(m => Number(m.inventory?.on_hand_qty || 0) <= Number(m.inventory?.reorder_level || 0)).length;
        const totalValue = pos.reduce((sum, p) => {
          if (p.status === 'draft') return sum;
          const poTotal = p.lines?.reduce((s, l) => s + (Number(l.ordered_qty) * Number(l.unit_price)), 0) || 0;
          return sum + poTotal;
        }, 0);

        setStats({
          totalPOs, pending, partial, fullyReceived, delayed, pendingBills, lowStock, totalValue
        });

        const mappedRecent = pos.slice(-4).reverse().map(p => {
          const poTotal = p.lines?.reduce((s, l) => s + (Number(l.ordered_qty) * Number(l.unit_price)), 0) || 0;
          const recStatus = p.status === 'received' ? 'Fully Received' : 
                            p.status === 'partially_received' ? 'Partial' : 
                            p.status === 'confirmed' ? 'Confirmed' : 
                            p.status === 'cancelled' ? 'Cancelled' : 'Draft';
          
          let billStatus = 'Pending';
          if (p.bills && p.bills.length > 0) {
            const hasPaid = p.bills.some(b => b.status === 'paid');
            const hasSubmitted = p.bills.some(b => b.status === 'pending_payment' || b.status === 'approved_for_payment');
            billStatus = hasPaid ? 'Paid' : hasSubmitted ? 'Submitted' : 'Pending';
          }

          return {
            id: p.id,
            po_number: p.po_number,
            orderDate: new Date(p.created_at).toLocaleDateString(),
            totalValue: poTotal,
            receiptStatus: recStatus,
            billStatus: billStatus
          };
        });

        setRecentPOs(mappedRecent);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
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
                          <td style={{ fontWeight: 700 }}>{po.po_number}</td>
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
