import { ShoppingCart, TrendingUp, CheckCircle, Clock, XCircle } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import '../styles/AdminPages.css';

const MOCK_RECENT_SALES = [
  { orderNo: 'SO-1044', customer: 'Deluxe Furniture Ltd', date: '2026-06-13', amount: '₹1,45,000', status: 'confirmed' },
  { orderNo: 'SO-1043', customer: 'Royal Spaces Decor', date: '2026-06-12', amount: '₹78,200', status: 'delivered' },
  { orderNo: 'SO-1042', customer: 'Apex Commercials', date: '2026-06-12', amount: '₹2,10,000', status: 'partial' },
  { orderNo: 'SO-1041', customer: 'Woodlands Residency', date: '2026-06-11', amount: '₹35,500', status: 'draft' },
  { orderNo: 'SO-1040', customer: 'Pioneer Builders', date: '2026-06-10', amount: '₹95,000', status: 'cancelled' },
];

const MOCK_TOP_PRODUCTS = [
  { name: 'Oak Dining Table', qty: 24, revenue: '₹2,88,000' },
  { name: 'Ergonomic Mesh Chair', qty: 95, revenue: '₹1,90,000' },
  { name: 'Comfort Sofa 3-Seater', qty: 12, revenue: '₹1,80,000' },
  { name: 'Adjustable Office Desk', qty: 31, revenue: '₹1,55,000' },
  { name: 'Luxury King Bed Frame', qty: 6, revenue: '₹1,20,000' },
];

export default function SalesMonitor() {
  return (
    <AppShell>
      <div className="animate-page" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* ── Section 1: Summary Cards ── */}
      <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="admin-panel" style={{ padding: '16px', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
          <div className="kpi-icon kpi-icon--blue" style={{ width: '36px', height: '36px' }}><Clock size={16} /></div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>8</div>
            <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Draft Orders</div>
          </div>
        </div>
        <div className="admin-panel" style={{ padding: '16px', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
          <div className="kpi-icon kpi-icon--primary" style={{ width: '36px', height: '36px' }}><ShoppingCart size={16} /></div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>24</div>
            <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Confirmed Orders</div>
          </div>
        </div>
        <div className="admin-panel" style={{ padding: '16px', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
          <div className="kpi-icon kpi-icon--warning" style={{ width: '36px', height: '36px' }}><Clock size={16} /></div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>5</div>
            <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Partial Deliveries</div>
          </div>
        </div>
        <div className="admin-panel" style={{ padding: '16px', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
          <div className="kpi-icon kpi-icon--green" style={{ width: '36px', height: '36px' }}><CheckCircle size={16} /></div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>114</div>
            <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Delivered Orders</div>
          </div>
        </div>
        <div className="admin-panel" style={{ padding: '16px', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
          <div className="kpi-icon kpi-icon--error" style={{ width: '36px', height: '36px' }}><XCircle size={16} /></div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>3</div>
            <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>Cancelled Orders</div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Dual Grid (Orders & Top Products) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-6)' }}>
        {/* Recent Orders Table */}
        <div className="admin-panel">
          <div className="admin-panel-header">
            <h3 className="admin-panel-title">Recent Sales Operations</h3>
            <span style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>Live updates</span>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order No</th>
                  <th>Customer Name</th>
                  <th>Order Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_RECENT_SALES.map((order, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{order.orderNo}</td>
                    <td>{order.customer}</td>
                    <td>{order.date}</td>
                    <td style={{ fontWeight: 600 }}>{order.amount}</td>
                    <td>
                      <span className={`admin-badge admin-badge--${
                        order.status === 'delivered' ? 'success' :
                        order.status === 'confirmed' ? 'info' :
                        order.status === 'partial' ? 'warning' :
                        order.status === 'draft' ? 'info' : 'error'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="admin-panel">
          <div className="admin-panel-header">
            <h3 className="admin-panel-title">Top Selling Products</h3>
            <TrendingUp size={18} className="text-secondary" />
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Qty Sold</th>
                  <th>Revenue Generated</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_TOP_PRODUCTS.map((prod, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{prod.name}</td>
                    <td>{prod.qty} units</td>
                    <td style={{ fontWeight: 600, color: 'var(--color-success)' }}>{prod.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </AppShell>
  );
}
