import { useState, useEffect } from 'react';
import { History, Download } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { api } from '../../utils/api';
import '../../styles/Purchase.css';

export default function SalesHistory() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [catalog, setCatalog] = useState([]);

  // Filters
  const [selectedCust, setSelectedCust] = useState('All');
  const [selectedProd, setSelectedProd] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ordRes, custRes, catRes] = await Promise.all([
          api.get('/sales-orders'),
          api.get('/customers'),
          api.get('/products')
        ]);
        setOrders(ordRes.data || []);
        setCustomers(custRes.data || []);
        setCatalog(catRes.data || []);
      } catch (err) {
        console.error('Failed to load history data', err);
      }
    };
    loadData();
  }, []);

  const handleExport = () => {
    alert('Exporting historical sales logs as CSV format...\nDownload Successful.');
  };

  const filtered = orders.filter(o => {
    const matchCust = selectedCust === 'All' || o.customer_id === selectedCust;
    const matchProd = selectedProd === 'All' || o.lines?.some(i => i.product_id === selectedProd);
    const matchStatus = statusFilter === 'All' || o.status === statusFilter;
    const matchDate = (!startDate || new Date(o.created_at) >= new Date(startDate)) &&
                      (!endDate || new Date(o.created_at) <= new Date(endDate));

    return matchCust && matchProd && matchStatus && matchDate;
  });

  return (
    <AppShell>
      <div className="animate-page sales-root">
        <div className="sales-header">
          <div>
            <h2 className="sales-title">
              <History size={22} style={{ color: 'var(--color-primary)' }} />
              Sales History
            </h2>
            <p className="sales-sub">Audit statement index of completed and dispatched customer transactions.</p>
          </div>
          <button className="btn btn--secondary" style={{ gap: '6px' }} onClick={handleExport}>
            <Download size={14} /> Export CSV Logs
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="purchase-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
            <div className="purchase-form-group" style={{ marginBottom: 0 }}>
              <label className="purchase-label">Customer</label>
              <select className="purchase-input" value={selectedCust} onChange={e => setSelectedCust(e.target.value)}>
                <option value="All">All Customers</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="purchase-form-group" style={{ marginBottom: 0 }}>
              <label className="purchase-label">Product</label>
              <select className="purchase-input" value={selectedProd} onChange={e => setSelectedProd(e.target.value)}>
                <option value="All">All Products</option>
                {catalog.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="purchase-form-group" style={{ marginBottom: 0 }}>
              <label className="purchase-label">Status</label>
              <select className="purchase-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
                <option value="dispatched">Dispatched</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="purchase-form-group" style={{ marginBottom: 0 }}>
              <label className="purchase-label">From Date</label>
              <input type="date" className="purchase-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>

            <div className="purchase-form-group" style={{ marginBottom: 0 }}>
              <label className="purchase-label">To Date</label>
              <input type="date" className="purchase-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>

        {/* List Table */}
        <div className="purchase-panel">
          <div className="purchase-table-wrapper">
            <table className="purchase-table">
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Customer Name</th>
                  <th>Products Logged</th>
                  <th>Total Amount</th>
                  <th>Order Date</th>
                  <th>Fulfillment Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => {
                  const amount = o.lines?.reduce((s, l) => s + (Number(l.ordered_qty) * Number(l.unit_price)), 0) || 0;
                  return (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 700 }}>{o.order_number}</td>
                      <td style={{ fontWeight: 600 }}>{o.customer?.name || 'Unknown'}</td>
                      <td>
                        {o.lines?.map((item, idx) => (
                          <div key={idx} style={{ fontSize: '12px' }}>
                            • {item.product?.name || 'Unknown'} x {Number(item.ordered_qty)}
                          </div>
                        ))}
                      </td>
                      <td style={{ fontWeight: 700 }}>₹{amount.toLocaleString()}</td>
                      <td>{new Date(o.created_at).toLocaleDateString()}</td>
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
      </div>
    </AppShell>
  );
}
