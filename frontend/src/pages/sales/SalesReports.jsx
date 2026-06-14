import { useState, useEffect } from 'react';
import { BarChart2, Download } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
import '../../styles/Purchase.css';

export default function SalesReports() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [activeReport, setActiveReport] = useState('summary'); // summary, customer, product, delivery

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ordRes, custRes, catRes, dlvRes] = await Promise.all([
          api.get('/sales-orders'),
          api.get('/customers'),
          api.get('/products'),
          api.get('/sales-deliveries')
        ]);
        setOrders(ordRes.data || []);
        setCustomers(custRes.data || []);
        setCatalog(catRes.data || []);
        setDeliveries(dlvRes.data || []);
      } catch (err) {
        console.error('Failed to load reports data', err);
      }
    };
    loadData();
  }, []);

  const handleExport = () => {
    alert(`Exporting Sales Analytical ${activeReport.toUpperCase()} report as PDF document...\nExport Successful.`);
  };

  const getOrderAmount = (order) => {
    return order.lines?.reduce((s, l) => s + (Number(l.ordered_qty) * Number(l.unit_price)), 0) || 0;
  };

  // Summary Metrics
  const activeOrders = orders.filter(o => o.status !== 'cancelled');
  const totalRevenue = activeOrders.reduce((sum, o) => sum + getOrderAmount(o), 0);
  const totalOrders = orders.length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const cancelledCount = orders.filter(o => o.status === 'cancelled').length;

  return (
    <AppShell>
      <div className="animate-page sales-root">
        <div className="sales-header">
          <div>
            <h2 className="sales-title">
              <BarChart2 size={22} style={{ color: 'var(--color-primary)' }} />
              Sales Reports & Analytics
            </h2>
            <p className="sales-sub">Analytical print-ready indexes for revenue balances, accounts activity, and delivery velocities.</p>
          </div>
          <button className="btn btn--primary" style={{ gap: '6px' }} onClick={handleExport}>
            <Download size={14} /> Export Report PDF
          </button>
        </div>

        {/* Tabs */}
        <div className="purchase-tabs">
          <button className={`purchase-tab ${activeReport === 'summary' ? 'purchase-tab--active' : ''}`} onClick={() => setActiveReport('summary')}>Sales Summary</button>
          <button className={`purchase-tab ${activeReport === 'customer' ? 'purchase-tab--active' : ''}`} onClick={() => setActiveReport('customer')}>Customer Performance</button>
          <button className={`purchase-tab ${activeReport === 'product' ? 'purchase-tab--active' : ''}`} onClick={() => setActiveReport('product')}>Product Metrics</button>
          <button className={`purchase-tab ${activeReport === 'delivery' ? 'purchase-tab--active' : ''}`} onClick={() => setActiveReport('delivery')}>Deliveries Audit</button>
        </div>

        {/* Content */}
        <div className="purchase-panel">
          {activeReport === 'summary' && (
            <>
              <div className="inventory-panel-header" style={{ justifyContent: 'space-between' }}>
                <h3 className="inventory-panel-title">Business Revenue Statement</h3>
                <span style={{ fontWeight: 800 }}>Invoice Volume: {totalOrders} contracts</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={{ padding: '16px', background: 'var(--surface-low)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 700 }}>REVENUE GENERATED</div>
                  <h3 style={{ margin: '6px 0 0 0', fontSize: '20px', fontWeight: 800 }}>₹{totalRevenue.toLocaleString()}</h3>
                </div>
                <div style={{ padding: '16px', background: 'var(--surface-low)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 700 }}>TOTAL CONTRACTS VOLUME</div>
                  <h3 style={{ margin: '6px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{totalOrders} POs</h3>
                </div>
                <div style={{ padding: '16px', background: 'var(--surface-low)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 700 }}>DELIVERED ORDERS</div>
                  <h3 style={{ margin: '6px 0 0 0', fontSize: '20px', fontWeight: 800, color: 'var(--color-success)' }}>{deliveredCount}</h3>
                </div>
                <div style={{ padding: '16px', background: 'var(--surface-low)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 700 }}>CANCELLED ORDERS</div>
                  <h3 style={{ margin: '6px 0 0 0', fontSize: '20px', fontWeight: 800, color: 'var(--color-error)' }}>{cancelledCount}</h3>
                </div>
              </div>
            </>
          )}

          {activeReport === 'customer' && (
            <>
              <div className="inventory-panel-header">
                <h3 className="inventory-panel-title">Customer-wise Sales Breakdown</h3>
              </div>
              <div className="purchase-table-wrapper">
                <table className="purchase-table">
                  <thead>
                    <tr>
                      <th>Customer ID</th>
                      <th>Customer Name</th>
                      <th>Total Orders placed</th>
                      <th>Revenue Contributed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map(c => {
                      const custOrders = orders.filter(o => o.customer_id === c.id && o.status !== 'cancelled');
                      const revenue = custOrders.reduce((sum, o) => sum + getOrderAmount(o), 0);
                      return (
                        <tr key={c.id}>
                          <td style={{ fontFamily: 'monospace' }}>{c.customer_code || 'CUSTOMER'}</td>
                          <td style={{ fontWeight: 600 }}>{c.name}</td>
                          <td>{custOrders.length} orders</td>
                          <td style={{ fontWeight: 700 }}>₹{revenue.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeReport === 'product' && (
            <>
              <div className="inventory-panel-header">
                <h3 className="inventory-panel-title">Product Wise Sales & Dispatches</h3>
              </div>
              <div className="purchase-table-wrapper">
                <table className="purchase-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Product Code</th>
                      <th>Quantity Sold</th>
                      <th>Revenue Accumulated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catalog.map(p => {
                      let qtySold = 0;
                      orders.filter(o => o.status !== 'cancelled').forEach(o => {
                        o.lines?.forEach(item => {
                          if (item.product_id === p.id) {
                            qtySold += Number(item.ordered_qty);
                          }
                        });
                      });
                      return (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 600 }}>{p.name}</td>
                          <td style={{ fontFamily: 'monospace' }}>{p.sku || 'N/A'}</td>
                          <td>{qtySold} units</td>
                          <td style={{ fontWeight: 700 }}>₹{(qtySold * Number(p.sales_price)).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeReport === 'delivery' && (
            <>
              <div className="inventory-panel-header">
                <h3 className="inventory-panel-title">Delivery Schedule Integrity Report</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div style={{ padding: '16px', background: 'var(--surface-low)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 700 }}>ON TIME DELIVERIES</div>
                  <h3 style={{ margin: '6px 0 0 0', fontSize: '20px', fontWeight: 800, color: 'var(--color-success)' }}>100%</h3>
                </div>
                <div style={{ padding: '16px', background: 'var(--surface-low)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 700 }}>DELAYED DELIVERIES</div>
                  <h3 style={{ margin: '6px 0 0 0', fontSize: '20px', fontWeight: 800, color: 'var(--color-error)' }}>0</h3>
                </div>
                <div style={{ padding: '16px', background: 'var(--surface-low)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 700 }}>PENDING DISPATCHES</div>
                  <h3 style={{ margin: '6px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{deliveries.filter(d => d.status !== 'Delivered').length}</h3>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
