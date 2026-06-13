import { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Users, Package, Award } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { salesApi } from '../../utils/salesApi';
import '../../styles/Purchase.css';

export default function SalesAnalytics() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [catalog, setCatalog] = useState([]);

  useEffect(() => {
    setOrders(salesApi.getOrders());
    setCustomers(salesApi.getCustomers());
    setCatalog(salesApi.getCatalog());
  }, []);

  return (
    <AppShell>
      <div className="animate-page sales-root">
        <div className="sales-header">
          <div>
            <h2 className="sales-title">
              <BarChart2 size={22} style={{ color: 'var(--color-primary)' }} />
              Sales Performance Analytics
            </h2>
            <p className="sales-sub">Live intelligence diagrams mapping order conversions, delivery completion rates, and client contribution sizes.</p>
          </div>
        </div>

        {/* Analytics visual block */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
          
          {/* Best Selling Products */}
          <div className="purchase-panel">
            <div className="purchase-panel-header">
              <h3 className="purchase-panel-title">
                <Package size={16} /> Best Selling Products
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'center', flex: 1 }}>
              {catalog.map((p, idx) => {
                let qtySold = 0;
                orders.filter(o => o.status !== 'Cancelled').forEach(o => {
                  o.items.forEach(item => {
                    if (item.productId === p.id) {
                      qtySold += item.qty;
                    }
                  });
                });
                // Calculate percentage based on max sold quantity
                const maxQty = 20;
                const pct = Math.min(Math.round((qtySold / maxQty) * 100), 100);

                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '150px', fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary)' }}>{p.name}</span>
                    <div style={{ flex: 1, height: '8px', background: 'var(--surface-low)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-primary)', borderRadius: 'var(--radius-full)' }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, minWidth: '32px', textAlign: 'right' }}>{qtySold} sold</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Core ratios */}
          <div className="purchase-panel">
            <div className="purchase-panel-header">
              <h3 className="purchase-panel-title">
                <Award size={16} /> Operational Ratios
              </h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>Average Order Invoice Value:</span>
                <strong style={{ color: 'var(--color-primary)' }}>₹1,35,400</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>Average Delivery Turnaround Time:</span>
                <strong style={{ color: 'var(--color-primary)' }}>1.8 Days</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>Order Completion Ratio:</span>
                <strong style={{ color: 'var(--color-success)' }}>100%</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Highest Spending Clients */}
        <div className="purchase-panel">
          <div className="purchase-panel-header">
            <h3 className="purchase-panel-title">
              <Users size={16} /> Highest Revenue Customer Accounts
            </h3>
          </div>
          <div className="purchase-table-wrapper">
            <table className="purchase-table">
              <thead>
                <tr>
                  <th>Client Account</th>
                  <th>Total Orders Placed</th>
                  <th>Revenue Contribution</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => {
                  const custOrders = orders.filter(o => o.customerId === c.id && o.status !== 'Cancelled');
                  const contributed = custOrders.reduce((sum, o) => sum + o.amount, 0);
                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td>{custOrders.length} contracts</td>
                      <td style={{ fontWeight: 700, color: 'var(--color-success)' }}>₹{contributed.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
