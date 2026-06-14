import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, ShoppingBag, Clock, CheckCircle, AlertTriangle, TrendingUp, DollarSign,
  Plus, ArrowRight, Activity, RefreshCw
} from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
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
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [orderRes, custRes] = await Promise.all([
        api.get('/sales-orders'),
        api.get('/customers')
      ]);
      const orders = orderRes.data || [];
      const custs = custRes.data || [];

      const getOrderAmount = (o) => {
        return o.lines?.reduce((s, l) => s + (Number(l.ordered_qty) * Number(l.unit_price)), 0) || 0;
      };

      const totalCusts = custs.length;
      const todayStr = new Date().toISOString().split('T')[0];
      const todaysOrders = orders.filter(o => new Date(o.created_at).toISOString().split('T')[0] === todayStr).length;
      
      const pending = orders.filter(o => 
        o.status === 'confirmed' || 
        o.status === 'dispatched' || 
        o.status === 'in_production' || 
        o.status === 'ready_to_dispatch'
      ).length;
      
      const delivered = orders.filter(o => o.status === 'delivered').length;
      const cancelled = orders.filter(o => o.status === 'cancelled').length;
      const revenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + getOrderAmount(o), 0);

      setStats({
        totalCusts,
        todaysOrders,
        pending,
        delivered,
        cancelled,
        monthlySales: orders.length,
        topProducts: 3,
        revenue
      });
      // Backend returns desc order, so slice first 4 items
      setRecentOrders(orders.slice(0, 4));

      // Calculate monthly revenue trend dynamically from last 6 months
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const trendData = [];
      for (let i = 5; i >= 0; i--) {
        let m = currentMonth - i;
        let y = currentYear;
        if (m < 0) {
          m += 12;
          y -= 1;
        }
        trendData.push({ month: monthNames[m], val: 0, rawMonth: m, rawYear: y });
      }

      orders.forEach(o => {
        if (o.status !== 'cancelled') {
          const d = new Date(o.created_at);
          const m = d.getMonth();
          const y = d.getFullYear();
          const target = trendData.find(t => t.rawMonth === m && t.rawYear === y);
          if (target) {
            target.val += getOrderAmount(o);
          }
        }
      });
      setMonthlyTrend(trendData);
    } catch (err) {
      console.error('Failed to load dashboard statistics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
                      {recentOrders.map(o => {
                        const amount = o.lines?.reduce((s, l) => s + (Number(l.ordered_qty) * Number(l.unit_price)), 0) || 0;
                        return (
                          <tr key={o.id}>
                            <td style={{ fontWeight: 700 }}>{o.order_number}</td>
                            <td>{new Date(o.created_at).toLocaleDateString()}</td>
                            <td style={{ fontWeight: 600 }}>₹{amount.toLocaleString()}</td>
                            <td>
                              <span className={`purchase-badge purchase-badge--${
                                o.status === 'delivered' ? 'success' :
                                o.status === 'cancelled' ? 'error' : 'warning'
                              }`} style={{ textTransform: 'capitalize' }}>
                                {o.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
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
                  {monthlyTrend.map((m, idx) => {
                    const maxVal = Math.max(...monthlyTrend.map(t => t.val), 10000);
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
