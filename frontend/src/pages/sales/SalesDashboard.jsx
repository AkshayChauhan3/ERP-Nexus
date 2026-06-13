import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, ShoppingBag, Clock, CheckCircle, AlertTriangle, TrendingUp, DollarSign,
  Plus, ArrowRight, Activity, Zap, RefreshCw
} from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { salesApi } from '../../utils/salesApi';
import '../../styles/Sales.css';
import '../../styles/Purchase.css';

export default function SalesDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCusts: 0,
    todaysOrders: 0,
    pending: 0,
    delivered: 0,
    cancelled: 0,
    monthlySales: 0,
    topProducts: 0,
    revenue: 0
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      setLoading(true);
      const orders = salesApi.getOrders();
      const custs = salesApi.getCustomers();

      const totalCusts = custs.length;
      const todaysOrders = orders.filter(o => o.orderDate === new Date().toISOString().split('T')[0]).length;
      const pending = orders.filter(o => o.status === 'Confirmed' || o.status === 'Processing').length;
      const delivered = orders.filter(o => o.status === 'Delivered').length;
      const cancelled = orders.filter(o => o.status === 'Cancelled').length;
      const revenue = orders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + o.amount, 0);

      setStats({
        totalCusts, todaysOrders, pending, delivered, cancelled,
        monthlySales: orders.length, topProducts: 3, revenue
      });
      setRecentOrders(orders.slice(-4).reverse());
      setLoading(false);
    };

    loadData();
  }, []);

  return (
    <AppShell>
      <div className="animate-page sales-root">
        <div className="sales-header">
          <div>
            <h2 className="sales-title">
              <ShoppingBag size={24} style={{ color: 'var(--color-primary)' }} />
              Sales Control Center
            </h2>
            <p className="sales-sub">Manage customer orders, issue quotations, and track order fulfillment statuses.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn--primary" style={{ gap: '6px' }} onClick={() => navigate('/sales/orders')}>
              <Plus size={14} /> Create Sales Order
            </button>
            <button className="btn btn--secondary" style={{ gap: '6px' }} onClick={() => navigate('/sales/quotations')}>
              <Plus size={14} /> Create Quotation
            </button>
            <button className="btn btn--secondary" style={{ gap: '6px' }} onClick={() => navigate('/sales/customers')}>
              <Plus size={14} /> Create Customer
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: 'var(--color-secondary)' }}>
            <RefreshCw size={32} className="spin" />
            <div style={{ marginTop: '12px' }}>Loading Sales Dashboard...</div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="purchase-kpi-grid">
              <div className="purchase-kpi-card">
                <div className="purchase-kpi-icon purchase-kpi-icon--blue"><Users size={20} /></div>
                <div>
                  <div className="purchase-kpi-val">{stats.totalCusts}</div>
                  <div className="purchase-kpi-label">Total Customers</div>
                </div>
              </div>
              <div className="purchase-kpi-card">
                <div className="purchase-kpi-icon purchase-kpi-icon--green"><Activity size={20} /></div>
                <div>
                  <div className="purchase-kpi-val">{stats.todaysOrders}</div>
                  <div className="purchase-kpi-label">Today's Orders</div>
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
                <div className="purchase-kpi-icon purchase-kpi-icon--green"><CheckCircle size={20} /></div>
                <div>
                  <div className="purchase-kpi-val">{stats.delivered}</div>
                  <div className="purchase-kpi-label">Delivered Orders</div>
                </div>
              </div>
              <div className="purchase-kpi-card">
                <div className="purchase-kpi-icon purchase-kpi-icon--error"><AlertTriangle size={20} /></div>
                <div>
                  <div className="purchase-kpi-val">{stats.cancelled}</div>
                  <div className="purchase-kpi-label">Cancelled Orders</div>
                </div>
              </div>
              <div className="purchase-kpi-card">
                <div className="purchase-kpi-icon purchase-kpi-icon--blue"><TrendingUp size={20} /></div>
                <div>
                  <div className="purchase-kpi-val">{stats.monthlySales}</div>
                  <div className="purchase-kpi-label">Monthly Orders</div>
                </div>
              </div>
              <div className="purchase-kpi-card">
                <div className="purchase-kpi-icon purchase-kpi-icon--green"><DollarSign size={20} /></div>
                <div>
                  <div className="purchase-kpi-val">₹{stats.revenue.toLocaleString()}</div>
                  <div className="purchase-kpi-label">Revenue Generated</div>
                </div>
              </div>
            </div>

            {/* Split visuals */}
            <div className="purchase-split-grid" style={{ gridTemplateColumns: '1.4fr 1.6fr' }}>
              
              {/* Recent Orders */}
              <div className="purchase-panel">
                <div className="purchase-panel-header">
                  <h3 className="purchase-panel-title">Recent Sales Orders</h3>
                  <button className="btn btn--secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => navigate('/sales/orders')}>
                    View All <ArrowRight size={12} />
                  </button>
                </div>
                <div className="purchase-table-wrapper">
                  <table className="purchase-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map(o => (
                        <tr key={o.id}>
                          <td style={{ fontWeight: 700 }}>{o.id}</td>
                          <td>{o.orderDate}</td>
                          <td style={{ fontWeight: 600 }}>₹{o.amount.toLocaleString()}</td>
                          <td>
                            <span className={`purchase-badge purchase-badge--${
                              o.status === 'Delivered' ? 'success' :
                              o.status === 'Confirmed' || o.status === 'Processing' ? 'warning' : 'outline'
                            }`}>
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Monthly Trend simulation */}
              <div className="purchase-panel">
                <div className="purchase-panel-header">
                  <h3 className="purchase-panel-title">Monthly Revenue Performance</h3>
                </div>
                <div className="inventory-chart-container" style={{ height: '140px' }}>
                  {[
                    { month: 'Jan', val: 95000 }, { month: 'Feb', val: 125000 },
                    { month: 'Mar', val: 185000 }, { month: 'Apr', val: 145000 },
                    { month: 'May', val: 220000 }, { month: 'Jun', val: stats.revenue }
                  ].map((m, idx) => {
                    const maxVal = 300000;
                    const pct = (m.val / maxVal) * 100;
                    return (
                      <div key={idx} className="inventory-chart-bar-group" style={{ width: '15%' }}>
                        <div className="inventory-chart-bar" data-value={`₹${Math.round(m.val/1000)}k`} style={{ height: `${pct}%` }} />
                        <span style={{ fontSize: '11px', color: 'var(--color-secondary)', marginTop: '8px', fontWeight: 600 }}>{m.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
