import { useState, useEffect } from 'react';
import { History, Search, Filter, Download } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { salesApi } from '../../utils/salesApi';
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
    setOrders(salesApi.getOrders());
    setCustomers(salesApi.getCustomers());
    setCatalog(salesApi.getCatalog());
  }, []);

  const handleExport = () => {
    alert('Exporting historical sales logs as CSV format...\nDownload Successful.');
  };

  const filtered = orders.filter(o => {
    const matchCust = selectedCust === 'All' || o.customerId === selectedCust;
    const matchProd = selectedProd === 'All' || o.items.some(i => i.productId === selectedProd);
    const matchStatus = statusFilter === 'All' || o.status === statusFilter;
    const matchDate = (!startDate || new Date(o.orderDate) >= new Date(startDate)) &&
                      (!endDate || new Date(o.orderDate) <= new Date(endDate));

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
                <option value="Confirmed">Confirmed</option>
                <option value="Processing">Processing</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
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
                  const cust = customers.find(c => c.id === o.customerId);
                  return (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 700 }}>{o.id}</td>
                      <td style={{ fontWeight: 600 }}>{cust ? cust.name : o.customerId}</td>
                      <td>
                        {o.items.map((item, idx) => (
                          <div key={idx} style={{ fontSize: '12px' }}>
                            • {item.name} x {item.qty}
                          </div>
                        ))}
                      </td>
                      <td style={{ fontWeight: 700 }}>₹{o.amount.toLocaleString()}</td>
                      <td>{o.orderDate}</td>
                      <td>
                        <span className={`purchase-badge purchase-badge--${
                          o.status === 'Delivered' ? 'success' :
                          o.status === 'Cancelled' ? 'error' : 'warning'
                        }`}>
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
